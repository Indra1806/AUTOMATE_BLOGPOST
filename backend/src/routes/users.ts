import express from 'express';
import { body, validationResult } from 'express-validator';
import { protect } from '../middleware/auth';
import User from '../models/User';

const router = express.Router();

// @route   GET /api/users/profile
// @desc    Get current user profile
// @access  Private
router.get('/profile', protect, async (req: any, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'User not found',
        },
      });
    }

    res.json({
      success: true,
      data: { user },
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to retrieve profile',
      },
    });
  }
});

// @route   PUT /api/users/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', [
  protect,
  body('firstName')
    .optional()
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters'),
  body('lastName')
    .optional()
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters'),
  body('avatar')
    .optional()
    .isURL()
    .withMessage('Avatar must be a valid URL'),
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

    const { firstName, lastName, avatar } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'User not found',
        },
      });
    }

    // Update fields
    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (avatar) user.avatar = avatar;

    await user.save();

    // Remove password from response
    const userResponse = user.toObject();
    delete userResponse.password;

    res.json({
      success: true,
      data: { user: userResponse },
      message: 'Profile updated successfully',
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to update profile',
      },
    });
  }
});

// @route   PUT /api/users/password
// @desc    Change user password
// @access  Private
router.put('/password', [
  protect,
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('New password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('New password must contain at least one uppercase letter, one lowercase letter, and one number'),
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

    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user._id).select('+password');
    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'User not found',
        },
      });
    }

    // Verify current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Current password is incorrect',
        },
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: 'Password changed successfully',
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to change password',
      },
    });
  }
});

// @route   PUT /api/users/settings/blogspot
// @desc    Update user's Blogspot settings
// @access  Private
router.put('/settings/blogspot', [
  protect,
  body('blogId')
    .optional()
    .isString()
    .withMessage('Blog ID must be a string'),
  body('blogUrl')
    .optional()
    .isURL()
    .withMessage('Blog URL must be a valid URL'),
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

    const { blogId, blogUrl } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'User not found',
        },
      });
    }

    // Check if blogspot is connected
    if (!user.isBlogspotConnected()) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Blogspot not connected. Please connect your account first.',
        },
      });
    }

    // Update blogspot settings
    if (blogId) user.blogspotSettings!.blogId = blogId;
    if (blogUrl) user.blogspotSettings!.blogUrl = blogUrl;

    await user.save();

    res.json({
      success: true,
      data: { user },
      message: 'Blogspot settings updated successfully',
    });
  } catch (error) {
    console.error('Update blogspot settings error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to update blogspot settings',
      },
    });
  }
});

// @route   PUT /api/users/settings/adsense
// @desc    Update user's AdSense settings
// @access  Private
router.put('/settings/adsense', [
  protect,
  body('isEnabled')
    .isBoolean()
    .withMessage('isEnabled must be a boolean'),
  body('adCode')
    .optional()
    .isString()
    .withMessage('Ad code must be a string'),
  body('placement')
    .optional()
    .isIn(['top', 'middle', 'bottom', 'sidebar'])
    .withMessage('Invalid placement specified'),
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

    const { isEnabled, adCode, placement } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'User not found',
        },
      });
    }

    // Initialize adSense settings if not exists
    if (!user.adSenseSettings) {
      user.adSenseSettings = {
        isEnabled: false,
        placement: 'middle',
      };
    }

    // Update adSense settings
    user.adSenseSettings.isEnabled = isEnabled;
    if (adCode !== undefined) user.adSenseSettings.adCode = adCode;
    if (placement) user.adSenseSettings.placement = placement;

    await user.save();

    res.json({
      success: true,
      data: { user },
      message: 'AdSense settings updated successfully',
    });
  } catch (error) {
    console.error('Update AdSense settings error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to update AdSense settings',
      },
    });
  }
});

// @route   PUT /api/users/settings/affiliate
// @desc    Update user's affiliate settings
// @access  Private
router.put('/settings/affiliate', [
  protect,
  body('isEnabled')
    .isBoolean()
    .withMessage('isEnabled must be a boolean'),
  body('links')
    .optional()
    .isArray()
    .withMessage('Links must be an array'),
  body('links.*.keyword')
    .optional()
    .isString()
    .withMessage('Keyword must be a string'),
  body('links.*.url')
    .optional()
    .isURL()
    .withMessage('URL must be a valid URL'),
  body('links.*.description')
    .optional()
    .isString()
    .withMessage('Description must be a string'),
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

    const { isEnabled, links } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'User not found',
        },
      });
    }

    // Initialize affiliate settings if not exists
    if (!user.affiliateSettings) {
      user.affiliateSettings = {
        isEnabled: false,
        links: [],
      };
    }

    // Update affiliate settings
    user.affiliateSettings.isEnabled = isEnabled;
    if (links !== undefined) user.affiliateSettings.links = links;

    await user.save();

    res.json({
      success: true,
      data: { user },
      message: 'Affiliate settings updated successfully',
    });
  } catch (error) {
    console.error('Update affiliate settings error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to update affiliate settings',
      },
    });
  }
});

// @route   PUT /api/users/settings/seo
// @desc    Update user's SEO settings
// @access  Private
router.put('/settings/seo', [
  protect,
  body('autoGenerateMeta')
    .optional()
    .isBoolean()
    .withMessage('autoGenerateMeta must be a boolean'),
  body('autoGenerateTags')
    .optional()
    .isBoolean()
    .withMessage('autoGenerateTags must be a boolean'),
  body('defaultTags')
    .optional()
    .isArray()
    .withMessage('defaultTags must be an array'),
  body('defaultTags.*')
    .optional()
    .isString()
    .withMessage('Default tag must be a string'),
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

    const { autoGenerateMeta, autoGenerateTags, defaultTags } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'User not found',
        },
      });
    }

    // Initialize SEO settings if not exists
    if (!user.seoSettings) {
      user.seoSettings = {
        autoGenerateMeta: true,
        autoGenerateTags: true,
        defaultTags: [],
      };
    }

    // Update SEO settings
    if (autoGenerateMeta !== undefined) user.seoSettings.autoGenerateMeta = autoGenerateMeta;
    if (autoGenerateTags !== undefined) user.seoSettings.autoGenerateTags = autoGenerateTags;
    if (defaultTags !== undefined) user.seoSettings.defaultTags = defaultTags;

    await user.save();

    res.json({
      success: true,
      data: { user },
      message: 'SEO settings updated successfully',
    });
  } catch (error) {
    console.error('Update SEO settings error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to update SEO settings',
      },
    });
  }
});

// @route   DELETE /api/users/account
// @desc    Delete user account
// @access  Private
router.delete('/account', protect, async (req: any, res) => {
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

    // Check if user has published posts
    const Post = require('../models/Post');
    const publishedPosts = await Post.countDocuments({
      userId: req.user._id,
      status: 'published',
    });

    if (publishedPosts > 0) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Cannot delete account with published posts. Please unpublish or delete them first.',
        },
      });
    }

    // Delete user and all associated posts
    await Post.deleteMany({ userId: req.user._id });
    await User.findByIdAndDelete(req.user._id);

    res.json({
      success: true,
      message: 'Account deleted successfully',
    });
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to delete account',
      },
    });
  }
});

export default router;