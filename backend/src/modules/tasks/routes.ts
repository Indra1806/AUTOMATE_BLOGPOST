import { Router } from 'express'
import { body, param, query } from 'express-validator'
import { taskController } from './controller'
import { authenticate } from '@/middleware/auth'
import { validate } from '@/middleware/validation'

const router = Router()

// All task routes require authentication
router.use(authenticate)

// Validation rules
const createTaskValidation = [
  body('title')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Title must be between 1 and 200 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Description must not exceed 2000 characters'),
  body('projectId')
    .isUUID()
    .withMessage('Project ID must be a valid UUID'),
  body('assigneeId')
    .optional()
    .isUUID()
    .withMessage('Assignee ID must be a valid UUID'),
  body('priority')
    .optional()
    .isIn(['LOW', 'MEDIUM', 'HIGH', 'URGENT'])
    .withMessage('Priority must be LOW, MEDIUM, HIGH, or URGENT'),
  body('dueDate')
    .optional()
    .isISO8601()
    .withMessage('Due date must be a valid ISO 8601 date'),
  body('estimatedHours')
    .optional()
    .isInt({ min: 1, max: 1000 })
    .withMessage('Estimated hours must be between 1 and 1000'),
  body('parentTaskId')
    .optional()
    .isUUID()
    .withMessage('Parent task ID must be a valid UUID'),
]

const updateTaskValidation = [
  body('title')
    .optional()
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Title must be between 1 and 200 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Description must not exceed 2000 characters'),
  body('status')
    .optional()
    .isIn(['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'COMPLETED', 'CANCELLED'])
    .withMessage('Status must be TODO, IN_PROGRESS, IN_REVIEW, COMPLETED, or CANCELLED'),
  body('priority')
    .optional()
    .isIn(['LOW', 'MEDIUM', 'HIGH', 'URGENT'])
    .withMessage('Priority must be LOW, MEDIUM, HIGH, or URGENT'),
  body('assigneeId')
    .optional()
    .isUUID()
    .withMessage('Assignee ID must be a valid UUID'),
  body('dueDate')
    .optional()
    .isISO8601()
    .withMessage('Due date must be a valid ISO 8601 date'),
  body('estimatedHours')
    .optional()
    .isInt({ min: 1, max: 1000 })
    .withMessage('Estimated hours must be between 1 and 1000'),
  body('actualHours')
    .optional()
    .isInt({ min: 1, max: 1000 })
    .withMessage('Actual hours must be between 1 and 1000'),
]

const addCommentValidation = [
  body('content')
    .trim()
    .isLength({ min: 1, max: 1000 })
    .withMessage('Comment content must be between 1 and 1000 characters'),
]

const taskIdValidation = [
  param('id')
    .isUUID()
    .withMessage('Task ID must be a valid UUID'),
]

const taskQueryValidation = [
  query('status')
    .optional()
    .isIn(['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'COMPLETED', 'CANCELLED'])
    .withMessage('Status must be TODO, IN_PROGRESS, IN_REVIEW, COMPLETED, or CANCELLED'),
  query('priority')
    .optional()
    .isIn(['LOW', 'MEDIUM', 'HIGH', 'URGENT'])
    .withMessage('Priority must be LOW, MEDIUM, HIGH, or URGENT'),
  query('assigneeId')
    .optional()
    .isUUID()
    .withMessage('Assignee ID must be a valid UUID'),
  query('projectId')
    .optional()
    .isUUID()
    .withMessage('Project ID must be a valid UUID'),
  query('search')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Search term must not exceed 100 characters'),
  query('dueDate')
    .optional()
    .isIn(['overdue', 'today', 'this_week', 'this_month'])
    .withMessage('Due date filter must be overdue, today, this_week, or this_month'),
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('sortBy')
    .optional()
    .isIn(['createdAt', 'dueDate', 'priority', 'title'])
    .withMessage('Sort by must be createdAt, dueDate, priority, or title'),
  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be asc or desc'),
]

// Routes
router.get('/stats', taskController.getTaskStats)
router.get('/', validate(taskQueryValidation), taskController.getTasks)
router.get('/:id', validate(taskIdValidation), taskController.getTaskById)
router.post('/', validate(createTaskValidation), taskController.createTask)
router.put('/:id', validate([...taskIdValidation, ...updateTaskValidation]), taskController.updateTask)
router.delete('/:id', validate(taskIdValidation), taskController.deleteTask)
router.post('/:id/comments', validate([...taskIdValidation, ...addCommentValidation]), taskController.addComment)

export default router