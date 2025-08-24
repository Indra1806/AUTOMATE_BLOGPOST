import { Request, Response, NextFunction } from 'express'
import { validationResult, ValidationChain } from 'express-validator'
import { ApiError } from '@/middleware/error'

// Middleware to handle validation results
export const handleValidationErrors = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req)
  
  if (!errors.isEmpty()) {
    const extractedErrors: { [key: string]: string }[] = []
    
    errors.array().map(err => {
      if ('path' in err) {
        extractedErrors.push({ [err.path]: err.msg })
      }
    })

    throw new ApiError('Validation failed', 400)
  }
  
  next()
}

// Helper to run validation chains
export const validate = (validations: ValidationChain[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Run all validations
    await Promise.all(validations.map(validation => validation.run(req)))

    // Check for errors
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      const extractedErrors: any[] = []
      
      errors.array().map(err => {
        if ('path' in err) {
          extractedErrors.push({
            field: err.path,
            message: err.msg,
            value: err.value
          })
        }
      })

      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: extractedErrors,
      })
    }

    next()
  }
}