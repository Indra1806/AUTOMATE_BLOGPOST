import { PrismaClient } from '@prisma/client'
import { logger } from '@/config/logger'

// Declare global prisma variable to prevent multiple instances in development
declare global {
  var __prisma: PrismaClient | undefined
}

// Create Prisma client instance
const createPrismaClient = () => {
  return new PrismaClient({
    log: [
      { emit: 'event', level: 'query' },
      { emit: 'event', level: 'error' },
      { emit: 'event', level: 'info' },
      { emit: 'event', level: 'warn' },
    ],
  })
}

// Use global instance in development to prevent multiple connections
export const prisma = globalThis.__prisma ?? createPrismaClient()

if (process.env.NODE_ENV === 'development') {
  globalThis.__prisma = prisma
}

// Log database events
prisma.$on('query', (e) => {
  logger.debug(`Query: ${e.query}`)
  logger.debug(`Params: ${e.params}`)
  logger.debug(`Duration: ${e.duration}ms`)
})

prisma.$on('error', (e) => {
  logger.error(`Database error: ${e.message}`)
})

prisma.$on('info', (e) => {
  logger.info(`Database info: ${e.message}`)
})

prisma.$on('warn', (e) => {
  logger.warn(`Database warning: ${e.message}`)
})

// Test database connection
export const connectDatabase = async () => {
  try {
    await prisma.$connect()
    logger.info('🗄️  Database connected successfully')
  } catch (error) {
    logger.error('Failed to connect to database:', error)
    process.exit(1)
  }
}

// Graceful disconnect
export const disconnectDatabase = async () => {
  try {
    await prisma.$disconnect()
    logger.info('🗄️  Database disconnected successfully')
  } catch (error) {
    logger.error('Error disconnecting from database:', error)
  }
}