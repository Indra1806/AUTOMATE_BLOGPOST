# 🚀 AI Blogpost Generator - Automated Blogspot Publishing Platform

[![CI/CD Pipeline](https://github.com/aiblogpost/aiblogpost/actions/workflows/ci.yml/badge.svg)](https://github.com/aiblogpost/aiblogpost/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](https://github.com/aiblogpost/aiblogpost)

A complete, production-grade full-stack web application for AI-powered blog content generation with direct publishing to Blogspot (Blogger API v3). Perfect for bloggers, content creators, SEO marketers, and students building portfolios.

## ✨ Features

### 🎯 **Core Functionality**
- **AI Content Generation**: OpenAI/HuggingFace powered blog post creation
- **Direct Blogspot Publishing**: OAuth2 integration with Blogger API v3
- **Rich Text Editor**: WYSIWYG editor with AI suggestions and formatting
- **Draft Management**: Save, edit, and organize blog drafts
- **SEO Optimization**: AI-generated titles, meta descriptions, and tags
- **Multi-Blog Support**: Manage multiple Blogspot accounts

### 🔐 **Security & Authentication**
- **JWT Authentication**: Secure token-based authentication with refresh tokens
- **OAuth2 Integration**: Secure Blogspot API access
- **Password Security**: Bcrypt hashing with configurable rounds
- **Rate Limiting**: API protection against abuse
- **CORS Protection**: Configurable cross-origin resource sharing

### 🎨 **User Experience**
- **Responsive Design**: Mobile-first approach with Tailwind CSS
- **Dark Mode**: System-aware theme switching with persistence
- **Modern UI**: Clean, minimal dashboard with indigo + teal accents
- **Rich Text Editing**: TipTap-based WYSIWYG editor
- **Real-time Preview**: Live preview of blog posts

### 💰 **Monetization Features**
- **Google AdSense Integration**: Automatic ad placement in posts
- **Affiliate Link Management**: Configurable affiliate link insertion
- **Portfolio Showcase**: Professional presentation for recruiters
- **SEO Optimization**: Built-in SEO tools for better rankings

### 🏗️ **Developer Experience**
- **TypeScript**: Full type safety across frontend and backend
- **Next.js 14**: Modern React framework with App Router
- **MongoDB**: Flexible NoSQL database for content management
- **Docker Support**: Multi-stage builds with development and production configs
- **CI/CD Pipeline**: Automated testing, building, and deployment

## 🛠️ Tech Stack

### **Frontend**
- **Next.js 14** - Modern React framework with App Router
- **TypeScript** - Type-safe JavaScript with excellent DX
- **Tailwind CSS** - Utility-first CSS framework with custom design system
- **TipTap** - Rich text editor with AI integration
- **React Hook Form** - Performant forms with validation
- **Framer Motion** - Smooth animations and micro-interactions
- **Lucide React** - Beautiful, customizable icons

### **Backend**
- **Node.js 18** - Runtime with latest features and performance
- **Express.js** - Fast, minimalist web framework
- **TypeScript** - Type-safe server-side development
- **MongoDB** - Flexible NoSQL database with Mongoose ODM
- **JWT** - Secure authentication tokens
- **OpenAI API** - AI content generation
- **Blogger API v3** - Direct Blogspot publishing

### **DevOps & Infrastructure**
- **Docker** - Containerization with multi-stage builds
- **GitHub Actions** - CI/CD pipeline with automated testing
- **Vercel** - Frontend deployment platform
- **Render/Heroku** - Backend deployment platform
- **MongoDB Atlas** - Cloud database hosting

## 🚀 Quick Start

### Prerequisites

- **Node.js 18+** - [Download here](https://nodejs.org/)
- **Docker & Docker Compose** - [Install Docker](https://docs.docker.com/get-docker/)
- **Git** - [Install Git](https://git-scm.com/downloads)
- **MongoDB Atlas Account** - [Sign up here](https://www.mongodb.com/atlas)
- **Google Cloud Console** - [Set up here](https://console.cloud.google.com/)

### 1. Clone the Repository

```bash
git clone https://github.com/aiblogpost/aiblogpost.git
cd aiblogpost
```

### 2. Set Up Environment Variables

```bash
# Backend environment
cp backend/.env.example backend/.env

# Frontend environment
cp frontend/.env.example frontend/.env
```

**Important**: Update the environment variables with your own values:
- MongoDB connection string
- OpenAI API key
- Google OAuth2 credentials (Blogger API)
- JWT secrets
- CORS origins

### 3. Set Up Google OAuth2 (Blogger API)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Blogger API v3
4. Create OAuth2 credentials
5. Add authorized redirect URIs
6. Download credentials and add to `.env`

### 4. Start with Docker (Recommended)

```bash
# Start all services
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f
```

This will start:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **MongoDB**: MongoDB on port 27017

### 5. Alternative: Manual Setup

#### Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Start development server
npm run dev
```

#### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

### 6. Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **API Health**: http://localhost:5000/api/health

## 📁 Project Structure

```
aiblogpost/
├── frontend/                 # Next.js frontend application
│   ├── src/
│   │   ├── app/             # Next.js App Router
│   │   ├── components/      # Reusable UI components
│   │   │   ├── ui/         # Basic UI primitives
│   │   │   ├── editor/     # Rich text editor components
│   │   │   └── dashboard/  # Dashboard components
│   │   ├── lib/            # Utilities and providers
│   │   ├── styles/         # Global styles and themes
│   │   └── types/          # TypeScript type definitions
│   ├── public/             # Static assets
│   └── package.json
│
├── backend/                  # Node.js backend API
│   ├── src/
│   │   ├── routes/         # API route handlers
│   │   ├── middleware/     # Express middleware
│   │   ├── models/         # MongoDB schemas
│   │   ├── services/       # Business logic
│   │   ├── config/         # Configuration files
│   │   └── utils/          # Utility functions
│   └── package.json
│
├── deploy/                   # Deployment configurations
│   ├── docker/             # Docker configurations
│   ├── vercel.json         # Vercel frontend config
│   └── render.yaml         # Render backend config
│
├── .github/workflows/        # CI/CD pipelines
└── docker-compose.yml       # Local development setup
```

## 🔧 Development

### Available Scripts

#### Frontend Scripts
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run lint:fix     # Fix ESLint issues
npm run type-check   # TypeScript type checking
```

#### Backend Scripts
```bash
npm run dev          # Start development server with hot reload
npm run build        # Compile TypeScript
npm run start        # Start production server
npm run lint         # Run ESLint
npm run lint:fix     # Fix ESLint issues
npm run test         # Run tests
```

### Database Management

```bash
# Connect to MongoDB
mongosh "your-connection-string"

# View collections
show collections

# View documents
db.posts.find()
db.users.find()
```

## 🚀 Deployment

### Frontend Deployment (Vercel)

1. **Connect GitHub repository** to Vercel
2. **Set environment variables** in Vercel dashboard
3. **Deploy automatically** on push to main branch

### Backend Deployment (Render/Heroku)

1. **Connect GitHub repository** to Render/Heroku
2. **Set environment variables** in dashboard
3. **Configure build commands** and start commands
4. **Deploy automatically** on push to main branch

### MongoDB Atlas Setup

1. **Create cluster** in MongoDB Atlas
2. **Set up database access** with username/password
3. **Configure network access** (IP whitelist or 0.0.0.0/0)
4. **Get connection string** and add to environment variables

## 📊 API Endpoints

### Authentication
```bash
POST /api/auth/register     # Register new user
POST /api/auth/login        # User login
POST /api/auth/refresh      # Refresh access token
POST /api/auth/logout       # Logout user
GET  /api/auth/me           # Get current user
```

### Blog Posts
```bash
GET    /api/posts           # Get user's posts
POST   /api/posts           # Create new post
GET    /api/posts/:id       # Get post by ID
PUT    /api/posts/:id       # Update post
DELETE /api/posts/:id       # Delete post
```

### AI Generation
```bash
POST /api/generate/content  # Generate blog content
POST /api/generate/title    # Generate SEO-optimized title
POST /api/generate/tags     # Generate relevant tags
```

### Blogspot Integration
```bash
POST /api/blogspot/auth     # Initiate OAuth2 flow
GET  /api/blogspot/callback # OAuth2 callback
POST /api/blogspot/publish  # Publish post to Blogspot
GET  /api/blogspot/blogs    # Get user's blogs
```

## 🔒 Security

### Security Features

- ✅ **Authentication**: JWT with refresh tokens
- ✅ **OAuth2**: Secure Blogspot API access
- ✅ **Rate Limiting**: API protection against abuse
- ✅ **CORS**: Configurable cross-origin policies
- ✅ **Input Validation**: Request validation middleware
- ✅ **Password Security**: Bcrypt hashing
- ✅ **Environment Variables**: Secure secret management

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. **Fork** the repository
2. **Create** a feature branch: `git checkout -b feature/amazing-feature`
3. **Commit** your changes: `git commit -m 'Add amazing feature'`
4. **Push** to the branch: `git push origin feature/amazing-feature`
5. **Open** a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Support

- **Documentation**: [docs/](./docs/)
- **Issues**: [GitHub Issues](https://github.com/aiblogpost/aiblogpost/issues)
- **Discussions**: [GitHub Discussions](https://github.com/aiblogpost/aiblogpost/discussions)

---

<div align="center">
  <strong>Built with ❤️ for content creators</strong>
  <br>
  <sub>AI-powered blogging made simple</sub>
</div>