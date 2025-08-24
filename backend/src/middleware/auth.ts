import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { config } from '@/config/env'
import { ApiError } from '@/middleware/error'
import { prisma } from '@/db/client'

// Extend Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string
        email: string
        role: string
      }
    }
  }
}

export interface JwtPayload {
  id: string
  email: string
  role: string
  iat: number
  exp: number
}

// Middleware to verify JWT token
export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    let token: string | undefined

    // Check for token in Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1]
    }
    
    // Check for token in cookies
    else if (req.cookies.accessToken) {
      token = req.cookies.accessToken
    }

    if (!token) {
      throw new ApiError('Access token is required', 401)
    }

    // Verify token
    const decoded = jwt.verify(token, config.jwt.secret) as JwtPayload

    // Check if user still exists
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        email: true,
        role: true,
        isActive: true,
      },
    })

    if (!user) {
      throw new ApiError('User no longer exists', 401)
    }

    if (!user.isActive) {
      throw new ApiError('User account is deactivated', 401)
    }

    // Attach user to request
    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
    }

    next()
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      next(new ApiError('Invalid token', 401))
    } else if (error instanceof jwt.TokenExpiredError) {
      next(new ApiError('Token expired', 401))
    } else {
      next(error)
    }
  }
}

// Middleware to check if user has required role
export const authorize = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new ApiError('Access denied', 403))
    }

    if (!roles.includes(req.user.role)) {
      return next(new ApiError('Insufficient permissions', 403))
    }

    next()
  }
}

// Middleware to check if user owns the resource or is admin
export const authorizeOwnerOrAdmin = (userIdParam: string = 'id') => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new ApiError('Access denied', 403))
    }

    const resourceUserId = req.params[userIdParam]
    
    if (req.user.role === 'ADMIN' || req.user.id === resourceUserId) {
      next()
    } else {
      next(new ApiError('Access denied', 403))
    }
  }
}

// Optional authentication - doesn't throw error if no token
export const optionalAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    let token: string | undefined

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1]
    } else if (req.cookies.accessToken) {
      token = req.cookies.accessToken
    }

    if (token) {
      const decoded = jwt.verify(token, config.jwt.secret) as JwtPayload
      
      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
        select: {
          id: true,
          email: true,
          role: true,
          isActive: true,
        },
      })

      if (user && user.isActive) {
        req.user = {
          id: user.id,
          email: user.email,
          role: user.role,
        }
      }
    }

    next()
  } catch (error) {
    // Ignore token errors for optional auth
    next()
  }
}