import { Router } from 'express'
import { param, query } from 'express-validator'
import { authenticate, authorize } from '@/middleware/auth'
import { validate } from '@/middleware/validation'
import { prisma } from '@/db/client'
import { asyncHandler } from '@/middleware/error'

const router = Router()

// All user routes require authentication
router.use(authenticate)

// Validation rules
const userIdValidation = [
  param('id')
    .isUUID()
    .withMessage('User ID must be a valid UUID'),
]

const userQueryValidation = [
  query('search')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Search term must not exceed 100 characters'),
  query('role')
    .optional()
    .isIn(['USER', 'ADMIN'])
    .withMessage('Role must be USER or ADMIN'),
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
]

// GET /api/users - Get all users (admin only)
router.get('/', 
  authorize('ADMIN'), 
  validate(userQueryValidation), 
  asyncHandler(async (req, res) => {
    const { search, role, page = 1, limit = 20 } = req.query
    
    const where: any = {}
    
    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { email: { contains: search as string, mode: 'insensitive' } }
      ]
    }
    
    if (role) {
      where.role = role
    }
    
    const skip = (Number(page) - 1) * Number(limit)
    
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          avatar: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: Number(limit),
      }),
      prisma.user.count({ where })
    ])
    
    res.json({
      success: true,
      data: users,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit)),
        hasNextPage: Number(page) < Math.ceil(total / Number(limit)),
        hasPrevPage: Number(page) > 1,
      }
    })
  })
)

// GET /api/users/:id - Get user by ID
router.get('/:id', 
  validate(userIdValidation), 
  asyncHandler(async (req, res) => {
    const { id } = req.params
    const currentUserId = req.user!.id
    const currentUserRole = req.user!.role
    
    // Users can only view their own profile unless they're admin
    if (id !== currentUserId && currentUserRole !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      })
    }
    
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        avatar: true,
        bio: true,
        timezone: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            ownedProjects: true,
            tasks: true,
            assignedTasks: true,
          }
        }
      }
    })
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      })
    }
    
    res.json({
      success: true,
      data: user
    })
  })
)

// GET /api/users/search - Search users for project assignment
router.get('/search/members', 
  validate([
    query('q')
      .trim()
      .isLength({ min: 1, max: 100 })
      .withMessage('Search query must be between 1 and 100 characters'),
    query('projectId')
      .optional()
      .isUUID()
      .withMessage('Project ID must be a valid UUID'),
  ]), 
  asyncHandler(async (req, res) => {
    const { q, projectId } = req.query
    
    const where: any = {
      isActive: true,
      OR: [
        { name: { contains: q as string, mode: 'insensitive' } },
        { email: { contains: q as string, mode: 'insensitive' } }
      ]
    }
    
    // If projectId is provided, exclude users already in the project
    if (projectId) {
      where.NOT = {
        OR: [
          { ownedProjects: { some: { id: projectId as string } } },
          { projectMembers: { some: { projectId: projectId as string } } }
        ]
      }
    }
    
    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
      },
      take: 10,
      orderBy: { name: 'asc' }
    })
    
    res.json({
      success: true,
      data: users
    })
  })
)

export default router