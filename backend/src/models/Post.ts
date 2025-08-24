import mongoose, { Document, Schema } from 'mongoose';

export interface IPost extends Document {
  userId: mongoose.Types.ObjectId;
  title: string;
  content: string;
  excerpt?: string;
  tags: string[];
  status: 'draft' | 'published' | 'scheduled';
  featuredImage?: string;
  seo: {
    metaTitle?: string;
    metaDescription?: string;
    slug?: string;
    canonicalUrl?: string;
  };
  blogspot: {
    postId?: string;
    publishedAt?: Date;
    url?: string;
    lastSyncAt?: Date;
  };
  aiGeneration: {
    prompt: string;
    model: string;
    tokensUsed: number;
    cost: number;
  };
  monetization: {
    adSenseEnabled: boolean;
    adSenseCode?: string;
    affiliateLinks: Array<{
      keyword: string;
      url: string;
      description: string;
      position: number;
    }>;
  };
  analytics: {
    views: number;
    likes: number;
    shares: number;
    comments: number;
  };
  scheduledFor?: Date;
  createdAt: Date;
  updatedAt: Date;
  publishedAt?: Date;
}

const postSchema = new Schema<IPost>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters'],
  },
  content: {
    type: String,
    required: [true, 'Content is required'],
    minlength: [100, 'Content must be at least 100 characters long'],
  },
  excerpt: {
    type: String,
    maxlength: [500, 'Excerpt cannot exceed 500 characters'],
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true,
    maxlength: [50, 'Tag cannot exceed 50 characters'],
  }],
  status: {
    type: String,
    enum: ['draft', 'published', 'scheduled'],
    default: 'draft',
    index: true,
  },
  featuredImage: {
    type: String,
    default: '',
  },
  seo: {
    metaTitle: {
      type: String,
      maxlength: [60, 'Meta title cannot exceed 60 characters'],
    },
    metaDescription: {
      type: String,
      maxlength: [160, 'Meta description cannot exceed 160 characters'],
    },
    slug: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
      lowercase: true,
      match: [/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be URL-friendly'],
    },
    canonicalUrl: String,
  },
  blogspot: {
    postId: String,
    publishedAt: Date,
    url: String,
    lastSyncAt: Date,
  },
  aiGeneration: {
    prompt: {
      type: String,
      required: true,
    },
    model: {
      type: String,
      default: 'gpt-4',
    },
    tokensUsed: {
      type: Number,
      default: 0,
    },
    cost: {
      type: Number,
      default: 0,
    },
  },
  monetization: {
    adSenseEnabled: {
      type: Boolean,
      default: false,
    },
    adSenseCode: String,
    affiliateLinks: [{
      keyword: String,
      url: String,
      description: String,
      position: Number,
    }],
  },
  analytics: {
    views: {
      type: Number,
      default: 0,
    },
    likes: {
      type: Number,
      default: 0,
    },
    shares: {
      type: Number,
      default: 0,
    },
    comments: {
      type: Number,
      default: 0,
    },
  },
  scheduledFor: Date,
  publishedAt: Date,
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// Virtual for reading time (average 200 words per minute)
postSchema.virtual('readingTime').get(function() {
  const wordCount = this.content.split(/\s+/).length;
  return Math.ceil(wordCount / 200);
});

// Virtual for word count
postSchema.virtual('wordCount').get(function() {
  return this.content.split(/\s+/).length;
});

// Virtual for isPublished
postSchema.virtual('isPublished').get(function() {
  return this.status === 'published';
});

// Virtual for isDraft
postSchema.virtual('isDraft').get(function() {
  return this.status === 'draft';
});

// Virtual for isScheduled
postSchema.virtual('isScheduled').get(function() {
  return this.status === 'scheduled';
});

// Indexes for better query performance
postSchema.index({ userId: 1, status: 1 });
postSchema.index({ userId: 1, createdAt: -1 });
postSchema.index({ status: 1, publishedAt: -1 });
postSchema.index({ tags: 1 });
postSchema.index({ 'seo.slug': 1 });
postSchema.index({ 'blogspot.postId': 1 });

// Pre-save middleware to generate slug if not provided
postSchema.pre('save', function(next) {
  if (!this.isModified('title') || this.seo?.slug) {
    return next();
  }

  try {
    this.seo = this.seo || {};
    this.seo.slug = this.title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Pre-save middleware to set publishedAt
postSchema.pre('save', function(next) {
  if (this.isModified('status') && this.status === 'published' && !this.publishedAt) {
    this.publishedAt = new Date();
  }
  next();
});

// Method to publish post
postSchema.methods.publish = function() {
  this.status = 'published';
  this.publishedAt = new Date();
  return this.save();
};

// Method to unpublish post
postSchema.methods.unpublish = function() {
  this.status = 'draft';
  this.publishedAt = undefined;
  return this.save();
};

// Method to schedule post
postSchema.methods.schedule = function(date: Date) {
  this.status = 'scheduled';
  this.scheduledFor = date;
  return this.save();
};

// Method to add affiliate link
postSchema.methods.addAffiliateLink = function(keyword: string, url: string, description: string, position?: number) {
  const link = { keyword, url, description, position: position || this.monetization.affiliateLinks.length };
  this.monetization.affiliateLinks.push(link);
  return this.save();
};

// Method to increment view count
postSchema.methods.incrementViews = function() {
  this.analytics.views += 1;
  return this.save();
};

export default mongoose.model<IPost>('Post', postSchema);