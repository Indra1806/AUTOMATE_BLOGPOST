# 🚀 Productify - Ultimate Productivity Platform

[![CI/CD Pipeline](https://github.com/productify/productify/actions/workflows/ci.yml/badge.svg)](https://github.com/productify/productify/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](https://github.com/productify/productify)

A complete, production-grade full-stack web application built with modern technologies. Productify is the ultimate productivity platform for modern teams, featuring task management, project collaboration, and real-time updates.

## ✨ Features

### 🎯 **Core Functionality**
- **Task Management**: Create, assign, and track tasks with priorities and due dates
- **Project Collaboration**: Organize work into projects with team members
- **Real-time Updates**: Live collaboration with instant notifications
- **Role-based Access**: User and admin roles with granular permissions
- **Advanced Filtering**: Search, sort, and filter tasks by multiple criteria

### 🔐 **Security & Authentication**
- **JWT Authentication**: Secure token-based authentication with refresh tokens
- **Password Security**: Bcrypt hashing with configurable rounds
- **Rate Limiting**: API protection against abuse
- **CORS Protection**: Configurable cross-origin resource sharing
- **Security Headers**: Helmet.js for comprehensive security headers

### 🎨 **User Experience**
- **Responsive Design**: Mobile-first approach with Tailwind CSS
- **Dark Mode**: System-aware theme switching with persistence
- **Accessibility**: WCAG 2.1 AA compliance with screen reader support
- **Performance**: Optimized bundle splitting and lazy loading
- **PWA Ready**: Progressive Web App capabilities

### 🏗️ **Developer Experience**
- **TypeScript**: Full type safety across frontend and backend
- **Modern Tooling**: Vite, ESLint, Prettier, and comprehensive linting
- **Docker Support**: Multi-stage builds with development and production configs
- **CI/CD Pipeline**: Automated testing, building, and deployment
- **Comprehensive Testing**: Unit, integration, and e2e test suites

## 🛠️ Tech Stack

### **Frontend**
- **React 18** - Modern React with hooks and concurrent features
- **TypeScript** - Type-safe JavaScript with excellent DX
- **Vite** - Fast build tool with HMR and optimized bundling
- **Tailwind CSS** - Utility-first CSS framework with custom design system
- **React Router** - Client-side routing with dynamic imports
- **React Query** - Server state management with caching
- **React Hook Form** - Performant forms with validation
- **Framer Motion** - Smooth animations and micro-interactions
- **Lucide React** - Beautiful, customizable icons

### **Backend**
- **Node.js 18** - Runtime with latest features and performance
- **Express.js** - Fast, minimalist web framework
- **TypeScript** - Type-safe server-side development
- **Prisma** - Type-safe database client with migrations
- **PostgreSQL** - Robust relational database
- **JWT** - Secure authentication tokens
- **Winston** - Comprehensive logging solution
- **Zod** - Runtime type validation

### **DevOps & Infrastructure**
- **Docker** - Containerization with multi-stage builds
- **GitHub Actions** - CI/CD pipeline with automated testing
- **Nginx** - Reverse proxy and static file serving
- **Redis** - Caching and session storage
- **Adminer** - Database management interface

## 🚀 Quick Start

### Prerequisites

- **Node.js 18+** - [Download here](https://nodejs.org/)
- **Docker & Docker Compose** - [Install Docker](https://docs.docker.com/get-docker/)
- **Git** - [Install Git](https://git-scm.com/downloads)

### 1. Clone the Repository

```bash
git clone https://github.com/productify/productify.git
cd productify
```

### 2. Set Up Environment Variables

```bash
# Backend environment
cp backend/.env.example backend/.env

# Frontend environment
cp frontend/.env.example frontend/.env
```

**Important**: Update the environment variables with your own values, especially:
- Database connection strings
- JWT secrets (use strong, random values)
- API URLs
- CORS origins

### 3. Start with Docker (Recommended)

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
- **Database**: PostgreSQL on port 5432
- **Redis**: Redis on port 6379
- **Adminer**: Database UI on http://localhost:8080

### 4. Alternative: Manual Setup

#### Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate dev

# Seed the database
npm run seed

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

### 5. Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **API Health**: http://localhost:5000/health
- **Database UI**: http://localhost:8080

### 6. Default Credentials

After seeding, you can log in with:

**Admin User:**
- Email: `admin@productify.app`
- Password: `admin123`

**Regular Users:**
- Email: `john.doe@example.com` / Password: `password123`
- Email: `jane.smith@example.com` / Password: `password123`
- Email: `bob.johnson@example.com` / Password: `password123`

## 📁 Project Structure

```
productify/
├── frontend/                 # React frontend application
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   │   ├── ui/         # Basic UI primitives
│   │   │   └── layout/     # Layout components
│   │   ├── pages/          # Page components
│   │   ├── hooks/          # Custom React hooks
│   │   ├── lib/            # Utilities and providers
│   │   ├── styles/         # Global styles and themes
│   │   └── seo/            # SEO optimization utilities
│   ├── public/             # Static assets
│   └── package.json
│
├── backend/                  # Node.js backend API
│   ├── src/
│   │   ├── modules/        # Feature modules
│   │   │   ├── auth/       # Authentication
│   │   │   ├── users/      # User management
│   │   │   └── tasks/      # Task management
│   │   ├── middleware/     # Express middleware
│   │   ├── config/         # Configuration files
│   │   └── db/             # Database related files
│   └── package.json
│
├── infra/                    # Infrastructure and deployment
│   ├── docker/             # Docker configurations
│   ├── k8s/                # Kubernetes manifests
│   └── nginx/              # Nginx configurations
│
├── docs/                     # Documentation
├── .github/workflows/        # CI/CD pipelines
└── docker-compose.yml       # Local development setup
```

## 🔧 Development

### Available Scripts

#### Frontend Scripts
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
npm run lint:fix     # Fix ESLint issues
npm run type-check   # TypeScript type checking
npm run test         # Run tests
```

#### Backend Scripts
```bash
npm run dev          # Start development server with hot reload
npm run build        # Compile TypeScript
npm run start        # Start production server
npm run lint         # Run ESLint
npm run lint:fix     # Fix ESLint issues
npm run test         # Run tests
npm run migrate      # Run database migrations
npm run seed         # Seed database with sample data
npm run studio       # Open Prisma Studio
```

### Database Management

```bash
# Generate Prisma client after schema changes
npx prisma generate

# Create a new migration
npx prisma migrate dev --name your-migration-name

# Deploy migrations to production
npx prisma migrate deploy

# Reset database (development only)
npx prisma migrate reset

# Open Prisma Studio
npx prisma studio
```

### Docker Commands

```bash
# Start all services
docker-compose up -d

# Start specific service
docker-compose up frontend

# View logs
docker-compose logs -f backend

# Execute commands in container
docker-compose exec backend bash

# Rebuild containers
docker-compose build --no-cache

# Stop all services
docker-compose down

# Remove volumes (careful: deletes data)
docker-compose down -v
```

## 🧪 Testing

### Running Tests

```bash
# Frontend tests
cd frontend && npm test

# Backend tests
cd backend && npm test

# Run tests with coverage
npm run test:coverage

# E2E tests (if implemented)
npm run test:e2e
```

### Testing Strategy

- **Unit Tests**: Individual components and functions
- **Integration Tests**: API endpoints and database operations
- **E2E Tests**: Complete user workflows
- **Performance Tests**: Load testing and lighthouse audits

## 🚀 Deployment

### Production Environment Variables

Ensure these are set in production:

```bash
# Backend (.env)
NODE_ENV=production
DATABASE_URL=your-production-database-url
JWT_SECRET=your-super-secure-jwt-secret
JWT_REFRESH_SECRET=your-super-secure-refresh-secret
CORS_ALLOWED_ORIGINS=https://yourdomain.com

# Frontend
VITE_API_URL=https://api.yourdomain.com
```

### Docker Production Build

```bash
# Build production images
docker-compose -f docker-compose.prod.yml build

# Deploy to production
docker-compose -f docker-compose.prod.yml up -d
```

### Manual Deployment

1. **Build applications**:
   ```bash
   cd frontend && npm run build
   cd backend && npm run build
   ```

2. **Set up production database**:
   ```bash
   npx prisma migrate deploy
   ```

3. **Deploy static files** to CDN/static hosting
4. **Deploy backend** to your server/cloud platform

## 📊 Monitoring & Observability

### Health Checks

- **Frontend**: `GET /health`
- **Backend**: `GET /api/health`
- **Database**: Built-in PostgreSQL health checks

### Logging

- **Winston** for structured logging
- **Morgan** for HTTP request logging
- **Centralized** log aggregation ready

### Metrics

- **Performance** monitoring with built-in health endpoints
- **Error tracking** with structured error handling
- **Database** query performance monitoring

## 🔒 Security

### Security Features Implemented

- ✅ **Authentication**: JWT with refresh tokens
- ✅ **Authorization**: Role-based access control
- ✅ **Rate Limiting**: API protection against abuse
- ✅ **CORS**: Configurable cross-origin policies
- ✅ **Security Headers**: Helmet.js implementation
- ✅ **Input Validation**: Zod schema validation
- ✅ **SQL Injection**: Prisma ORM protection
- ✅ **XSS Protection**: Content Security Policy
- ✅ **Password Security**: Bcrypt hashing

### Security Best Practices

- Use environment variables for secrets
- Regularly update dependencies
- Enable security scanning in CI/CD
- Implement proper error handling
- Use HTTPS in production
- Regular security audits

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. **Fork** the repository
2. **Create** a feature branch: `git checkout -b feature/amazing-feature`
3. **Commit** your changes: `git commit -m 'Add amazing feature'`
4. **Push** to the branch: `git push origin feature/amazing-feature`
5. **Open** a Pull Request

### Development Guidelines

- Follow the existing code style
- Write tests for new features
- Update documentation as needed
- Use conventional commit messages
- Ensure CI passes before requesting review

## 📝 API Documentation

### Authentication Endpoints

```bash
POST /api/auth/signup      # Register new user
POST /api/auth/login       # User login
POST /api/auth/refresh     # Refresh access token
POST /api/auth/logout      # Logout user
GET  /api/auth/me          # Get current user
PUT  /api/auth/profile     # Update user profile
PUT  /api/auth/password    # Change password
```

### Task Endpoints

```bash
GET    /api/tasks          # Get tasks with filters
POST   /api/tasks          # Create new task
GET    /api/tasks/:id      # Get task by ID
PUT    /api/tasks/:id      # Update task
DELETE /api/tasks/:id      # Delete task
POST   /api/tasks/:id/comments  # Add comment to task
GET    /api/tasks/stats    # Get task statistics
```

### User Endpoints

```bash
GET /api/users             # Get all users (admin only)
GET /api/users/:id         # Get user by ID
GET /api/users/search/members  # Search users for assignment
```

For detailed API documentation, see [API Documentation](./docs/API.md).

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **React Team** for the amazing framework
- **Vercel** for Next.js and deployment platform
- **Prisma** for the excellent database toolkit
- **Tailwind CSS** for the utility-first CSS framework
- **Open Source Community** for the countless libraries used

## 📞 Support

- **Documentation**: [docs/](./docs/)
- **Issues**: [GitHub Issues](https://github.com/productify/productify/issues)
- **Discussions**: [GitHub Discussions](https://github.com/productify/productify/discussions)
- **Email**: support@productify.app

---

<div align="center">
  <strong>Built with ❤️ for productivity enthusiasts</strong>
  <br>
  <sub>Made by the Productify Team</sub>
</div>