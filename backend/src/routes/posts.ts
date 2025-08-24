import express from 'express';
import { body, validationResult, query } from 'express-validator';
import { protect } from '../middleware/auth';
import Post from '../models/Post';
import User from '../models/User';

const router = express.Router();

// @route   GET /api/posts
// @desc    Get user's posts with filtering and pagination
// @access  Private
router.get('/', protect, [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('status')
    .optional()
    .isIn(['draft', 'published', 'scheduled'])
    .withMessage('Invalid status filter'),
  query('search')
    .optional()
    .isString()
    .withMessage('Search query must be a string'),
  query('tags')
    .optional()
    .isString()
    .withMessage('Tags filter must be a string'),
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

    const {
      page = 1,
      limit = 10,
      status,
      search,
      tags,
    } = req.query;

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    // Build filter object
    const filter: any = { userId: req.user._id };
    
    if (status) {
      filter.status = status;
    }

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } },
      ];
    }

    if (tags) {
      const tagArray = tags.split(',').map((tag: string) => tag.trim().toLowerCase());
      filter.tags = { $in: tagArray };
    }

    // Get posts with pagination
    const posts = await Post.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit as string))
      .populate('userId', 'firstName lastName email');

    // Get total count for pagination
    const total = await Post.countDocuments(filter);

    // Calculate pagination info
    const totalPages = Math.ceil(total / parseInt(limit as string));
    const hasNextPage = parseInt(page as string) < totalPages;
    const hasPrevPage = parseInt(page as string) > 1;

    res.json({
      success: true,
      data: {
        posts,
        pagination: {
          currentPage: parseInt(page as string),
          totalPages,
          totalPosts: total,
          hasNextPage,
          hasPrevPage,
          limit: parseInt(limit as string),
        },
      },
      message: 'Posts retrieved successfully',
    });
  } catch (error) {
    console.error('Get posts error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to retrieve posts',
      },
    });
  }
});

// @route   POST /api/posts
// @desc    Create a new post
// @access  Private
router.post('/', [
  protect,
  body('title')
    .isLength({ min: 5, max: 200 })
    .withMessage('Title must be between 5 and 200 characters'),
  body('content')
    .isLength({ min: 100 })
    .withMessage('Content must be at least 100 characters long'),
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array'),
  body('excerpt')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Excerpt cannot exceed 500 characters'),
  body('featuredImage')
    .optional()
    .isURL()
    .withMessage('Featured image must be a valid URL'),
  body('seo.metaTitle')
    .optional()
    .isLength({ max: 60 })
    .withMessage('Meta title cannot exceed 60 characters'),
  body('seo.metaDescription')
    .optional()
    .isLength({ max: 160 })
    .withMessage('Meta description cannot exceed 160 characters'),
  body('scheduledFor')
    .optional()
    .isISO8601()
    .withMessage('Scheduled date must be a valid ISO date'),
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

    const {
      title,
      content,
      tags = [],
      excerpt,
      featuredImage,
      seo = {},
      scheduledFor,
    } = req.body;

    // Determine status based on scheduledFor
    let status: 'draft' | 'scheduled' = 'draft';
    if (scheduledFor && new Date(scheduledFor) > new Date()) {
      status = 'scheduled';
    }

    // Create new post
    const post = new Post({
      userId: req.user._id,
      title,
      content,
      tags: tags.map((tag: string) => tag.toLowerCase().trim()),
      excerpt,
      featuredImage,
      seo,
      scheduledFor: scheduledFor ? new Date(scheduledFor) : undefined,
      status,
      aiGeneration: {
        prompt: req.body.aiPrompt || 'Manual creation',
        model: 'manual',
        tokensUsed: 0,
        cost: 0,
      },
    });

    await post.save();

    // Populate user info
    await post.populate('userId', 'firstName lastName email');

    res.status(201).json({
      success: true,
      data: { post },
      message: 'Post created successfully',
    });
  } catch (error) {
    console.error('Create post error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to create post',
      },
    });
  }
});

// @route   GET /api/posts/:id
// @desc    Get a specific post by ID
// @access  Private
router.get('/:id', protect, async (req: any, res) => {
  try {
    const post = await Post.findById(req.params.id).populate('userId', 'firstName lastName email');
    
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
          message: 'Not authorized to access this post',
        },
      });
    }

    res.json({
      success: true,
      data: { post },
    });
  } catch (error) {
    console.error('Get post error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to retrieve post',
      },
    });
  }
});

// @route   PUT /api/posts/:id
// @desc    Update a post
// @access  Private
router.put('/:id', [
  protect,
  body('title')
    .optional()
    .isLength({ min: 5, max: 200 })
    .withMessage('Title must be between 5 and 200 characters'),
  body('content')
    .optional()
    .isLength({ min: 100 })
    .withMessage('Content must be at least 100 characters long'),
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array'),
  body('excerpt')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Excerpt cannot exceed 500 characters'),
  body('featuredImage')
    .optional()
    .isURL()
    .withMessage('Featured image must be a valid URL'),
  body('seo.metaTitle')
    .optional()
    .isLength({ max: 60 })
    .withMessage('Meta title cannot exceed 60 characters'),
  body('seo.metaDescription')
    .optional()
    .isLength({ max: 160 })
    .withMessage('Meta description cannot exceed 160 characters'),
  body('scheduledFor')
    .optional()
    .isISO8601()
    .withMessage('Scheduled date must be a valid ISO date'),
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

    const post = await Post.findById(req.params.id);
    
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
          message: 'Not authorized to update this post',
        },
      });
    }

    // Update fields
    const updateFields = req.body;
    
    // Handle tags array
    if (updateFields.tags) {
      updateFields.tags = updateFields.tags.map((tag: string) => tag.toLowerCase().trim());
    }

    // Handle scheduledFor and status
    if (updateFields.scheduledFor) {
      const scheduledDate = new Date(updateFields.scheduledFor);
      if (scheduledDate > new Date()) {
        updateFields.status = 'scheduled';
      } else {
        updateFields.status = 'draft';
      }
    }

    // Update post
    const updatedPost = await Post.findByIdAndUpdate(
      req.params.id,
      { $set: updateFields },
      { new: true, runValidators: true }
    ).populate('userId', 'firstName lastName email');

    res.json({
      success: true,
      data: { post: updatedPost },
      message: 'Post updated successfully',
    });
  } catch (error) {
    console.error('Update post error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to update post',
      },
    });
  }
});

// @route   DELETE /api/posts/:id
// @desc    Delete a post
// @access  Private
router.delete('/:id', protect, async (req: any, res) => {
  try {
    const post = await Post.findById(req.params.id);
    
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
          message: 'Not authorized to delete this post',
        },
      });
    }

    // Check if post is published on Blogspot
    if (post.status === 'published' && post.blogspot?.postId) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Cannot delete published post. Unpublish it first.',
        },
      });
    }

    await Post.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Post deleted successfully',
    });
  } catch (error) {
    console.error('Delete post error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to delete post',
      },
    });
  }
});

// @route   POST /api/posts/:id/publish
// @desc    Publish a draft post
// @access  Private
router.post('/:id/publish', protect, async (req: any, res) => {
  try {
    const post = await Post.findById(req.params.id);
    
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

    // Check if post is already published
    if (post.status === 'published') {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Post is already published',
        },
      });
    }

    // Publish post
    post.status = 'published';
    post.publishedAt = new Date();
    await post.save();

    res.json({
      success: true,
      data: { post },
      message: 'Post published successfully',
    });
  } catch (error) {
    console.error('Publish post error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to publish post',
      },
    });
  }
});

// @route   POST /api/posts/:id/unpublish
// @desc    Unpublish a published post
// @access  Private
router.post('/:id/unpublish', protect, async (req: any, res) => {
  try {
    const post = await Post.findById(req.params.id);
    
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
          message: 'Not authorized to unpublish this post',
        },
      });
    }

    // Check if post is published
    if (post.status !== 'published') {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Post is not published',
        },
      });
    }

    // Unpublish post
    post.status = 'draft';
    post.publishedAt = undefined;
    await post.save();

    res.json({
      success: true,
      data: { post },
      message: 'Post unpublished successfully',
    });
  } catch (error) {
    console.error('Unpublish post error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to unpublish post',
      },
    });
  }
});

// @route   GET /api/posts/stats/overview
// @desc    Get post statistics overview
// @access  Private
router.get('/stats/overview', protect, async (req: any, res) => {
  try {
    const stats = await Post.aggregate([
      { $match: { userId: req.user._id } },
      {
        $group: {
          _id: null,
          totalPosts: { $sum: 1 },
          publishedPosts: { $sum: { $cond: [{ $eq: ['$status', 'published'] }, 1, 0] } },
          draftPosts: { $sum: { $cond: [{ $eq: ['$status', 'draft'] }, 1, 0] } },
          scheduledPosts: { $sum: { $cond: [{ $eq: ['$status', 'scheduled'] }, 1, 0] } },
          totalViews: { $sum: '$analytics.views' },
          totalLikes: { $sum: '$analytics.likes' },
          totalShares: { $sum: '$analytics.shares' },
          totalComments: { $sum: '$analytics.comments' },
        },
      },
    ]);

    const result = stats[0] || {
      totalPosts: 0,
      publishedPosts: 0,
      draftPosts: 0,
      scheduledPosts: 0,
      totalViews: 0,
      totalLikes: 0,
      totalShares: 0,
      totalComments: 0,
    };

    res.json({
      success: true,
      data: { stats: result },
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to retrieve statistics',
      },
    });
  }
});

export default router;