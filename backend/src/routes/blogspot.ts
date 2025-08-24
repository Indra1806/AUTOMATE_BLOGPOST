import express from 'express';
import { body, validationResult } from 'express-validator';
import { google } from 'googleapis';
import { protect } from '../middleware/auth';
import User from '../models/User';
import Post from '../models/Post';

const router = express.Router();

// Google OAuth2 configuration
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI || 'http://localhost:5000/api/blogspot/callback'
);

// Blogger API v3
const blogger = google.blogger('v3');

// @route   GET /api/blogspot/auth
// @desc    Initiate OAuth2 flow for Blogspot
// @access  Private
router.get('/auth', protect, (req: any, res) => {
  try {
    const scopes = [
      'https://www.googleapis.com/auth/blogger',
      'https://www.googleapis.com/auth/userinfo.profile',
      'https://www.googleapis.com/auth/userinfo.email'
    ];

    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      prompt: 'consent', // Force consent to get refresh token
    });

    res.json({
      success: true,
      data: { authUrl },
      message: 'OAuth2 URL generated successfully',
    });
  } catch (error) {
    console.error('OAuth2 URL generation error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to generate OAuth2 URL',
      },
    });
  }
});

// @route   GET /api/blogspot/callback
// @desc    Handle OAuth2 callback and store tokens
// @access  Public (called by Google)
router.get('/callback', async (req, res) => {
  try {
    const { code, state } = req.query;

    if (!code) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Authorization code not received',
        },
      });
    }

    // Exchange code for tokens
    const { tokens } = await oauth2Client.getToken(code as string);
    
    if (!tokens.access_token || !tokens.refresh_token) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Failed to obtain access and refresh tokens',
        },
      });
    }

    // Set credentials
    oauth2Client.setCredentials(tokens);

    // Get user info
    const userInfo = await google.oauth2('v2').userinfo.get({ auth: oauth2Client });
    const email = userInfo.data.email;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Failed to get user email',
        },
      });
    }

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'User not found. Please register first.',
        },
      });
    }

    // Get user's blogs
    const blogsResponse = await blogger.blogs.listByUser({
      auth: oauth2Client,
      userId: 'self',
    });

    const blogs = blogsResponse.data.items || [];
    const primaryBlog = blogs[0]; // Usually the first blog is the primary one

    // Update user's blogspot settings
    user.blogspotSettings = {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token!,
      expiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : new Date(Date.now() + 3600000),
      blogId: primaryBlog?.id,
      blogUrl: primaryBlog?.url,
    };

    await user.save();

    // Redirect to frontend with success
    const redirectUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard?blogspot=connected`;
    res.redirect(redirectUrl);

  } catch (error) {
    console.error('OAuth2 callback error:', error);
    
    const redirectUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard?blogspot=error`;
    res.redirect(redirectUrl);
  }
});

// @route   GET /api/blogspot/blogs
// @desc    Get user's Blogspot blogs
// @access  Private
router.get('/blogs', protect, async (req: any, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user || !user.isBlogspotConnected()) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Blogspot not connected. Please connect your account first.',
        },
      });
    }

    // Refresh token if expired
    if (user.blogspotSettings!.expiresAt < new Date()) {
      await refreshUserToken(user);
    }

    // Set credentials
    oauth2Client.setCredentials({
      access_token: user.blogspotSettings!.accessToken,
      refresh_token: user.blogspotSettings!.refreshToken,
    });

    // Get blogs
    const blogsResponse = await blogger.blogs.listByUser({
      auth: oauth2Client,
      userId: 'self',
    });

    const blogs = blogsResponse.data.items || [];

    res.json({
      success: true,
      data: { blogs },
      message: 'Blogs retrieved successfully',
    });
  } catch (error) {
    console.error('Get blogs error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to retrieve blogs',
      },
    });
  }
});

// @route   POST /api/blogspot/publish
// @desc    Publish post to Blogspot
// @access  Private
router.post('/publish', [
  protect,
  body('postId')
    .isMongoId()
    .withMessage('Valid post ID is required'),
  body('blogId')
    .optional()
    .isString()
    .withMessage('Blog ID must be a string'),
], async (req: any, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Validation failed',
          details: errors.array(),
        },
      });
    }

    const { postId, blogId } = req.body;

    // Get user and post
    const user = await User.findById(req.user._id);
    if (!user || !user.isBlogspotConnected()) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Blogspot not connected. Please connect your account first.',
        },
      });
    }

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Post not found',
        },
      });
    }

    // Check if user owns the post
    if (post.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: {
          message: 'Not authorized to publish this post',
        },
      });
    }

    // Refresh token if expired
    if (user.blogspotSettings!.expiresAt < new Date()) {
      await refreshUserToken(user);
    }

    // Set credentials
    oauth2Client.setCredentials({
      access_token: user.blogspotSettings!.accessToken,
      refresh_token: user.blogspotSettings!.refreshToken,
    });

    // Prepare content with monetization
    let content = post.content;

    // Add AdSense if enabled
    if (user.isAdSenseEnabled() && user.adSenseSettings?.adCode) {
      const adCode = user.adSenseSettings.adCode;
      const placement = user.adSenseSettings.placement;
      
      if (placement === 'top') {
        content = `${adCode}\n\n${content}`;
      } else if (placement === 'middle') {
        const paragraphs = content.split('</p>');
        const middleIndex = Math.floor(paragraphs.length / 2);
        paragraphs.splice(middleIndex, 0, `\n${adCode}\n`);
        content = paragraphs.join('</p>');
      } else if (placement === 'bottom') {
        content = `${content}\n\n${adCode}`;
      }
    }

    // Add affiliate links if enabled
    if (user.isAffiliateEnabled() && user.affiliateSettings?.links) {
      user.affiliateSettings.links.forEach(link => {
        const regex = new RegExp(`\\b${link.keyword}\\b`, 'gi');
        content = content.replace(regex, `<a href="${link.url}" target="_blank" rel="nofollow sponsored">${link.keyword}</a>`);
      });
    }

    // Create blog post
    const blogPost = {
      kind: 'blogger#post',
      blog: {
        id: blogId || user.blogspotSettings!.blogId,
      },
      title: post.title,
      content: content,
      labels: post.tags,
    };

    const publishResponse = await blogger.posts.insert({
      auth: oauth2Client,
      blogId: blogId || user.blogspotSettings!.blogId!,
      requestBody: blogPost,
      isDraft: false,
    });

    const publishedPost = publishResponse.data;

    // Update post with blogspot info
    post.status = 'published';
    post.publishedAt = new Date();
    post.blogspot = {
      postId: publishedPost.id,
      publishedAt: new Date(publishedPost.published!),
      url: publishedPost.url,
      lastSyncAt: new Date(),
    };

    await post.save();

    res.json({
      success: true,
      data: {
        post: publishedPost,
        localPost: post,
      },
      message: 'Post published to Blogspot successfully',
    });
  } catch (error) {
    console.error('Publish to Blogspot error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to publish post to Blogspot',
      },
    });
  }
});

// @route   DELETE /api/blogspot/disconnect
// @desc    Disconnect Blogspot account
// @access  Private
router.delete('/disconnect', protect, async (req: any, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'User not found',
        },
      });
    }

    // Clear blogspot settings
    user.blogspotSettings = undefined;
    await user.save();

    res.json({
      success: true,
      message: 'Blogspot account disconnected successfully',
    });
  } catch (error) {
    console.error('Disconnect Blogspot error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to disconnect Blogspot account',
      },
    });
  }
});

// Helper function to refresh user's access token
async function refreshUserToken(user: any) {
  try {
    oauth2Client.setCredentials({
      refresh_token: user.blogspotSettings!.refreshToken,
    });

    const { credentials } = await oauth2Client.refreshAccessToken();
    
    user.blogspotSettings!.accessToken = credentials.access_token!;
    user.blogspotSettings!.expiresAt = credentials.expiry_date ? new Date(credentials.expiry_date) : new Date(Date.now() + 3600000);
    
    await user.save();
  } catch (error) {
    console.error('Token refresh error:', error);
    throw new Error('Failed to refresh access token');
  }
}

export default router;