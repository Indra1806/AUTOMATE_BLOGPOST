import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  isActive: boolean;
  role: 'user' | 'admin';
  blogspotSettings?: {
    accessToken: string;
    refreshToken: string;
    expiresAt: Date;
    blogId?: string;
    blogUrl?: string;
  };
  adSenseSettings?: {
    isEnabled: boolean;
    adCode?: string;
    placement: 'top' | 'middle' | 'bottom' | 'sidebar';
  };
  affiliateSettings?: {
    isEnabled: boolean;
    links: Array<{
      keyword: string;
      url: string;
      description: string;
    }>;
  };
  seoSettings?: {
    autoGenerateMeta: boolean;
    autoGenerateTags: boolean;
    defaultTags: string[];
  };
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>({
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email'],
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [8, 'Password must be at least 8 characters long'],
    select: false,
  },
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true,
    maxlength: [50, 'First name cannot exceed 50 characters'],
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true,
    maxlength: [50, 'Last name cannot exceed 50 characters'],
  },
  avatar: {
    type: String,
    default: '',
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user',
  },
  blogspotSettings: {
    accessToken: String,
    refreshToken: String,
    expiresAt: Date,
    blogId: String,
    blogUrl: String,
  },
  adSenseSettings: {
    isEnabled: {
      type: Boolean,
      default: false,
    },
    adCode: String,
    placement: {
      type: String,
      enum: ['top', 'middle', 'bottom', 'sidebar'],
      default: 'middle',
    },
  },
  affiliateSettings: {
    isEnabled: {
      type: Boolean,
      default: false,
    },
    links: [{
      keyword: String,
      url: String,
      description: String,
    }],
  },
  seoSettings: {
    autoGenerateMeta: {
      type: Boolean,
      default: true,
    },
    autoGenerateTags: {
      type: Boolean,
      default: true,
    },
    defaultTags: [String],
  },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// Virtual for full name
userSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Virtual for display name
userSchema.virtual('displayName').get(function() {
  return this.firstName || this.email.split('@')[0];
});

// Index for email queries
userSchema.index({ email: 1 });

// Index for blogspot settings
userSchema.index({ 'blogspotSettings.blogId': 1 });

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw new Error('Password comparison failed');
  }
};

// Method to check if blogspot is connected
userSchema.methods.isBlogspotConnected = function(): boolean {
  return !!(this.blogspotSettings?.accessToken && this.blogspotSettings?.refreshToken);
};

// Method to check if adSense is enabled
userSchema.methods.isAdSenseEnabled = function(): boolean {
  return this.adSenseSettings?.isEnabled || false;
};

// Method to check if affiliate links are enabled
userSchema.methods.isAffiliateEnabled = function(): boolean {
  return this.affiliateSettings?.isEnabled || false;
};

export default mongoose.model<IUser>('User', userSchema);