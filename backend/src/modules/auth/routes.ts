import { Router } from 'express'
import { body } from 'express-validator'
import { authController } from './controller'
import { authenticate } from '@/middleware/auth'
import { validate } from '@/middleware/validation'

const router = Router()

// Validation rules
const signupValidation = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
]

const loginValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
]

const changePasswordValidation = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('New password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('New password must contain at least one uppercase letter, one lowercase letter, and one number'),
]

const updateProfileValidation = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  body('bio')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Bio must not exceed 500 characters'),
  body('timezone')
    .optional()
    .isString()
    .withMessage('Timezone must be a valid string'),
]

// Public routes
router.post('/signup', validate(signupValidation), authController.signup)
router.post('/login', validate(loginValidation), authController.login)
router.post('/refresh', authController.refreshToken)
router.post('/logout', authController.logout)

// Protected routes
router.use(authenticate) // All routes below require authentication

router.get('/me', authController.getCurrentUser)
router.post('/logout-all', authController.logoutAll)
router.put('/password', validate(changePasswordValidation), authController.changePassword)
router.put('/profile', validate(updateProfileValidation), authController.updateProfile)

export default router