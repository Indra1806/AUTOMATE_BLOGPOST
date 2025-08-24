import express, { Application, Request, Response, NextFunction } from 'express'
import cors from 'cors'
import helmet from 'helmet'
import compression from 'compression'
import cookieParser from 'cookie-parser'
import morgan from 'morgan'
import rateLimit from 'express-rate-limit'

import { config } from '@/config/env'
import { logger } from '@/config/logger'
import { errorHandler, notFoundHandler } from '@/middleware/error'
import { authLimiter, generalLimiter } from '@/middleware/rate-limit'

// Import routes
import authRoutes from '@/modules/auth/routes'
import userRoutes from '@/modules/users/routes'
import taskRoutes from '@/modules/tasks/routes'

// Create Express application
const app: Application = express()

// Trust proxy for accurate client IPs behind reverse proxy
app.set('trust proxy', 1)

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}))

// CORS configuration
app.use(cors({
  origin: function (origin, callback) {
    const allowedOrigins = config.cors.allowedOrigins
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true)
    } else {
      callback(new Error('Not allowed by CORS'))
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie']
}))

// General middleware
app.use(compression())
app.use(cookieParser())
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// Logging middleware
app.use(morgan('combined', {
  stream: {
    write: (message: string) => logger.info(message.trim())
  }
}))

// Rate limiting
app.use(generalLimiter)

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: config.env,
    version: config.version
  })
})

// API routes
app.use('/api/auth', authLimiter, authRoutes)
app.use('/api/users', userRoutes)
app.use('/api/tasks', taskRoutes)

// API documentation
app.get('/api', (req: Request, res: Response) => {
  res.json({
    name: 'Productify API',
    version: config.version,
    description: 'RESTful API for the Productify productivity platform',
    endpoints: {
      auth: '/api/auth',
      users: '/api/users',
      tasks: '/api/tasks'
    },
    documentation: '/api/docs'
  })
})

// 404 handler
app.use(notFoundHandler)

// Global error handler
app.use(errorHandler)

export default app