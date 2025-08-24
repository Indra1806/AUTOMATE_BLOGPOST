// MongoDB initialization script for AI Blogpost Generator
// This script runs when the MongoDB container starts for the first time

print('Starting MongoDB initialization...');

// Switch to the aiblogpost database
db = db.getSiblingDB('aiblogpost');

// Create collections with validation
print('Creating collections...');

// Users collection
db.createCollection('users', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['email', 'password', 'firstName', 'lastName'],
      properties: {
        email: {
          bsonType: 'string',
          pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$'
        },
        password: {
          bsonType: 'string',
          minLength: 8
        },
        firstName: {
          bsonType: 'string',
          minLength: 2,
          maxLength: 50
        },
        lastName: {
          bsonType: 'string',
          minLength: 2,
          maxLength: 50
        },
        role: {
          enum: ['user', 'admin']
        }
      }
    }
  }
});

// Posts collection
db.createCollection('posts', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['userId', 'title', 'content', 'status'],
      properties: {
        userId: {
          bsonType: 'objectId'
        },
        title: {
          bsonType: 'string',
          minLength: 5,
          maxLength: 200
        },
        content: {
          bsonType: 'string',
          minLength: 100
        },
        status: {
          enum: ['draft', 'published', 'scheduled']
        },
        tags: {
          bsonType: 'array',
          items: {
            bsonType: 'string',
            maxLength: 50
          }
        }
      }
    }
  }
});

// Create indexes for better performance
print('Creating indexes...');

// Users collection indexes
db.users.createIndex({ 'email': 1 }, { unique: true });
db.users.createIndex({ 'blogspotSettings.blogId': 1 });
db.users.createIndex({ 'createdAt': -1 });

// Posts collection indexes
db.posts.createIndex({ 'userId': 1, 'status': 1 });
db.posts.createIndex({ 'userId': 1, 'createdAt': -1 });
db.posts.createIndex({ 'status': 1, 'publishedAt': -1 });
db.posts.createIndex({ 'tags': 1 });
db.posts.createIndex({ 'seo.slug': 1 }, { unique: true, sparse: true });
db.posts.createIndex({ 'blogspot.postId': 1 });
db.posts.createIndex({ 'scheduledFor': 1 });

// Create a default admin user (optional - for development)
if (db.users.countDocuments({ role: 'admin' }) === 0) {
  print('Creating default admin user...');
  
  // Note: In production, you should change this password
  const adminUser = {
    email: 'admin@aiblogpost.app',
    password: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/8KqjqGq', // admin123
    firstName: 'Admin',
    lastName: 'User',
    role: 'admin',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  };
  
  db.users.insertOne(adminUser);
  print('Default admin user created: admin@aiblogpost.app / admin123');
}

// Create some sample data for development
if (db.posts.countDocuments() === 0) {
  print('Creating sample posts...');
  
  const samplePosts = [
    {
      userId: db.users.findOne({ email: 'admin@aiblogpost.app' })._id,
      title: 'Welcome to AI Blogpost Generator',
      content: '<h2>Welcome to the Future of Blogging</h2><p>This is your first AI-generated blog post. Start creating amazing content with the power of artificial intelligence!</p>',
      excerpt: 'Discover how AI can revolutionize your blogging workflow and help you create engaging content faster than ever before.',
      tags: ['ai', 'blogging', 'content-creation', 'welcome'],
      status: 'published',
      featuredImage: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&h=400&fit=crop',
      seo: {
        metaTitle: 'Welcome to AI Blogpost Generator - AI-Powered Blogging',
        metaDescription: 'Start creating amazing blog content with AI assistance. Generate, edit, and publish posts directly to Blogspot.',
        slug: 'welcome-to-ai-blogpost-generator'
      },
      aiGeneration: {
        prompt: 'Create a welcome post for a new AI blogging platform',
        model: 'gpt-4',
        tokensUsed: 150,
        cost: 0.00675
      },
      monetization: {
        adSenseEnabled: false,
        affiliateLinks: []
      },
      analytics: {
        views: 0,
        likes: 0,
        shares: 0,
        comments: 0
      },
      publishedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      userId: db.users.findOne({ email: 'admin@aiblogpost.app' })._id,
      title: 'Getting Started with AI Content Generation',
      content: '<h2>Your First AI-Generated Post</h2><p>Learn how to use our AI tools to create compelling blog content in minutes.</p><h3>Step 1: Choose Your Topic</h3><p>Start with a clear idea of what you want to write about.</p><h3>Step 2: Generate Content</h3><p>Use our AI to create the initial draft.</p><h3>Step 3: Edit and Polish</h3><p>Refine the content to match your voice and style.</p>',
      excerpt: 'Learn the basics of AI-powered content creation and start building your blog empire today.',
      tags: ['ai', 'tutorial', 'getting-started', 'content-creation'],
      status: 'draft',
      featuredImage: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&h=400&fit=crop',
      seo: {
        metaTitle: 'Getting Started with AI Content Generation - Complete Guide',
        metaDescription: 'Master AI-powered content creation with our step-by-step guide. Start generating engaging blog posts today.',
        slug: 'getting-started-with-ai-content-generation'
      },
      aiGeneration: {
        prompt: 'Create a tutorial on getting started with AI content generation',
        model: 'gpt-4',
        tokensUsed: 200,
        cost: 0.009
      },
      monetization: {
        adSenseEnabled: false,
        affiliateLinks: []
      },
      analytics: {
        views: 0,
        likes: 0,
        shares: 0,
        comments: 0
      },
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];
  
  db.posts.insertMany(samplePosts);
  print('Sample posts created successfully');
}

print('MongoDB initialization completed successfully!');
print('Database: aiblogpost');
print('Collections: users, posts');
print('Default admin: admin@aiblogpost.app / admin123');
print('Sample posts: 2 created');