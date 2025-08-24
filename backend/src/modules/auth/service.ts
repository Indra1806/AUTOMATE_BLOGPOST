import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { v4 as uuidv4 } from 'uuid'
import { prisma } from '@/db/client'
import { config } from '@/config/env'
import { ApiError } from '@/middleware/error'

export interface SignupData {
  name: string
  email: string
  password: string
}

export interface LoginData {
  email: string
  password: string
}

export interface AuthTokens {
  accessToken: string
  refreshToken: string
}

export interface AuthResult {
  user: {
    id: string
    email: string
    name: string
    role: string
    avatar?: string
  }
  tokens: AuthTokens
}

class AuthService {
  // Generate JWT access token
  private generateAccessToken(payload: { id: string; email: string; role: string }): string {
    return jwt.sign(payload, config.jwt.secret, {
      expiresIn: config.jwt.expiresIn,
    })
  }

  // Generate refresh token
  private generateRefreshToken(): string {
    return uuidv4()
  }

  // Hash password
  private async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, config.security.bcryptRounds)
  }

  // Verify password
  private async verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword)
  }

  // Register new user
  async signup(data: SignupData): Promise<AuthResult> {
    const { name, email, password } = data

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    })

    if (existingUser) {
      throw new ApiError('User with this email already exists', 400)
    }

    // Hash password
    const hashedPassword = await this.hashPassword(password)

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email: email.toLowerCase(),
        password: hashedPassword,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        avatar: true,
      }
    })

    // Generate tokens
    const accessToken = this.generateAccessToken({
      id: user.id,
      email: user.email,
      role: user.role,
    })

    const refreshToken = this.generateRefreshToken()

    // Store refresh token in database
    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      }
    })

    return {
      user,
      tokens: {
        accessToken,
        refreshToken,
      }
    }
  }

  // User login
  async login(data: LoginData): Promise<AuthResult> {
    const { email, password } = data

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        avatar: true,
        password: true,
        isActive: true,
      }
    })

    if (!user) {
      throw new ApiError('Invalid email or password', 401)
    }

    if (!user.isActive) {
      throw new ApiError('Account has been deactivated', 401)
    }

    // Verify password
    const isPasswordValid = await this.verifyPassword(password, user.password)
    if (!isPasswordValid) {
      throw new ApiError('Invalid email or password', 401)
    }

    // Generate tokens
    const accessToken = this.generateAccessToken({
      id: user.id,
      email: user.email,
      role: user.role,
    })

    const refreshToken = this.generateRefreshToken()

    // Store refresh token in database
    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      }
    })

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user

    return {
      user: userWithoutPassword,
      tokens: {
        accessToken,
        refreshToken,
      }
    }
  }

  // Refresh access token
  async refreshToken(refreshToken: string): Promise<AuthTokens> {
    // Find refresh token in database
    const storedToken = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true,
            isActive: true,
          }
        }
      }
    })

    if (!storedToken) {
      throw new ApiError('Invalid refresh token', 401)
    }

    if (storedToken.expiresAt < new Date()) {
      // Delete expired token
      await prisma.refreshToken.delete({
        where: { id: storedToken.id }
      })
      throw new ApiError('Refresh token expired', 401)
    }

    if (!storedToken.user.isActive) {
      throw new ApiError('Account has been deactivated', 401)
    }

    // Generate new tokens
    const newAccessToken = this.generateAccessToken({
      id: storedToken.user.id,
      email: storedToken.user.email,
      role: storedToken.user.role,
    })

    const newRefreshToken = this.generateRefreshToken()

    // Update refresh token in database
    await prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: {
        token: newRefreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      }
    })

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    }
  }

  // Logout user
  async logout(refreshToken: string): Promise<void> {
    await prisma.refreshToken.deleteMany({
      where: { token: refreshToken }
    })
  }

  // Logout from all devices
  async logoutAll(userId: string): Promise<void> {
    await prisma.refreshToken.deleteMany({
      where: { userId }
    })
  }

  // Get current user
  async getCurrentUser(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
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
      }
    })

    if (!user) {
      throw new ApiError('User not found', 404)
    }

    if (!user.isActive) {
      throw new ApiError('Account has been deactivated', 401)
    }

    return user
  }

  // Change password
  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, password: true }
    })

    if (!user) {
      throw new ApiError('User not found', 404)
    }

    // Verify current password
    const isCurrentPasswordValid = await this.verifyPassword(currentPassword, user.password)
    if (!isCurrentPasswordValid) {
      throw new ApiError('Current password is incorrect', 400)
    }

    // Hash new password
    const hashedNewPassword = await this.hashPassword(newPassword)

    // Update password
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedNewPassword }
    })

    // Logout from all devices for security
    await this.logoutAll(userId)
  }

  // Update user profile
  async updateProfile(userId: string, data: { name?: string; bio?: string; timezone?: string }) {
    const user = await prisma.user.update({
      where: { id: userId },
      data,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        avatar: true,
        bio: true,
        timezone: true,
        updatedAt: true,
      }
    })

    return user
  }
}

export const authService = new AuthService()