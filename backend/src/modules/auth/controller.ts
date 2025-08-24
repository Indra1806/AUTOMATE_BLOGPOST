import { Request, Response } from 'express'
import { authService } from './service'
import { asyncHandler } from '@/middleware/error'

class AuthController {
  // POST /api/auth/signup
  signup = asyncHandler(async (req: Request, res: Response) => {
    const { name, email, password } = req.body

    const result = await authService.signup({ name, email, password })

    // Set cookies
    res.cookie('accessToken', result.tokens.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000, // 1 day
    })

    res.cookie('refreshToken', result.tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    })

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: result.user,
        accessToken: result.tokens.accessToken,
        refreshToken: result.tokens.refreshToken,
      },
    })
  })

  // POST /api/auth/login
  login = asyncHandler(async (req: Request, res: Response) => {
    const { email, password } = req.body

    const result = await authService.login({ email, password })

    // Set cookies
    res.cookie('accessToken', result.tokens.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000, // 1 day
    })

    res.cookie('refreshToken', result.tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    })

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: result.user,
        accessToken: result.tokens.accessToken,
        refreshToken: result.tokens.refreshToken,
      },
    })
  })

  // POST /api/auth/refresh
  refreshToken = asyncHandler(async (req: Request, res: Response) => {
    const { refreshToken } = req.body
    const cookieRefreshToken = req.cookies.refreshToken

    const token = refreshToken || cookieRefreshToken

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token is required',
      })
    }

    const tokens = await authService.refreshToken(token)

    // Update cookies
    res.cookie('accessToken', tokens.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000, // 1 day
    })

    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    })

    res.json({
      success: true,
      message: 'Token refreshed successfully',
      data: tokens,
    })
  })

  // POST /api/auth/logout
  logout = asyncHandler(async (req: Request, res: Response) => {
    const { refreshToken } = req.body
    const cookieRefreshToken = req.cookies.refreshToken

    const token = refreshToken || cookieRefreshToken

    if (token) {
      await authService.logout(token)
    }

    // Clear cookies
    res.clearCookie('accessToken')
    res.clearCookie('refreshToken')

    res.json({
      success: true,
      message: 'Logout successful',
    })
  })

  // POST /api/auth/logout-all
  logoutAll = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id

    await authService.logoutAll(userId)

    // Clear cookies
    res.clearCookie('accessToken')
    res.clearCookie('refreshToken')

    res.json({
      success: true,
      message: 'Logged out from all devices',
    })
  })

  // GET /api/auth/me
  getCurrentUser = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id

    const user = await authService.getCurrentUser(userId)

    res.json({
      success: true,
      data: user,
    })
  })

  // PUT /api/auth/password
  changePassword = asyncHandler(async (req: Request, res: Response) => {
    const { currentPassword, newPassword } = req.body
    const userId = req.user!.id

    await authService.changePassword(userId, currentPassword, newPassword)

    // Clear cookies to force re-login
    res.clearCookie('accessToken')
    res.clearCookie('refreshToken')

    res.json({
      success: true,
      message: 'Password changed successfully. Please login again.',
    })
  })

  // PUT /api/auth/profile
  updateProfile = asyncHandler(async (req: Request, res: Response) => {
    const { name, bio, timezone } = req.body
    const userId = req.user!.id

    const user = await authService.updateProfile(userId, { name, bio, timezone })

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: user,
    })
  })
}

export const authController = new AuthController()