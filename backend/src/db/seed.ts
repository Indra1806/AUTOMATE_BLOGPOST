import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { logger } from '@/config/logger'

const prisma = new PrismaClient()

async function main() {
  logger.info('🌱 Starting database seed...')

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 12)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@productify.app' },
    update: {},
    create: {
      email: 'admin@productify.app',
      name: 'Admin User',
      password: adminPassword,
      role: 'ADMIN',
      bio: 'System administrator',
    },
  })

  // Create regular users
  const userPassword = await bcrypt.hash('password123', 12)
  const users = await Promise.all([
    prisma.user.upsert({
      where: { email: 'john.doe@example.com' },
      update: {},
      create: {
        email: 'john.doe@example.com',
        name: 'John Doe',
        password: userPassword,
        bio: 'Frontend Developer',
      },
    }),
    prisma.user.upsert({
      where: { email: 'jane.smith@example.com' },
      update: {},
      create: {
        email: 'jane.smith@example.com',
        name: 'Jane Smith',
        password: userPassword,
        bio: 'Backend Developer',
      },
    }),
    prisma.user.upsert({
      where: { email: 'bob.johnson@example.com' },
      update: {},
      create: {
        email: 'bob.johnson@example.com',
        name: 'Bob Johnson',
        password: userPassword,
        bio: 'UI/UX Designer',
      },
    }),
  ])

  logger.info(`👤 Created ${users.length + 1} users`)

  // Create sample projects
  const project1 = await prisma.project.create({
    data: {
      name: 'Website Redesign',
      description: 'Complete redesign of the company website',
      color: '#3B82F6',
      ownerId: users[0].id,
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-03-31'),
    },
  })

  const project2 = await prisma.project.create({
    data: {
      name: 'Mobile App Development',
      description: 'Development of a new mobile application',
      color: '#10B981',
      ownerId: users[1].id,
      startDate: new Date('2024-02-01'),
      endDate: new Date('2024-06-30'),
    },
  })

  logger.info('📁 Created sample projects')

  // Add project members
  await Promise.all([
    prisma.projectMember.create({
      data: {
        userId: users[1].id,
        projectId: project1.id,
        role: 'ADMIN',
      },
    }),
    prisma.projectMember.create({
      data: {
        userId: users[2].id,
        projectId: project1.id,
        role: 'MEMBER',
      },
    }),
    prisma.projectMember.create({
      data: {
        userId: users[0].id,
        projectId: project2.id,
        role: 'MEMBER',
      },
    }),
    prisma.projectMember.create({
      data: {
        userId: users[2].id,
        projectId: project2.id,
        role: 'MEMBER',
      },
    }),
  ])

  logger.info('👥 Added project members')

  // Create tags
  const tags = await Promise.all([
    prisma.tag.create({
      data: {
        name: 'Frontend',
        color: '#3B82F6',
        projectId: project1.id,
      },
    }),
    prisma.tag.create({
      data: {
        name: 'Backend',
        color: '#10B981',
        projectId: project1.id,
      },
    }),
    prisma.tag.create({
      data: {
        name: 'Design',
        color: '#F59E0B',
        projectId: project1.id,
      },
    }),
    prisma.tag.create({
      data: {
        name: 'Mobile',
        color: '#8B5CF6',
        projectId: project2.id,
      },
    }),
    prisma.tag.create({
      data: {
        name: 'API',
        color: '#EF4444',
        projectId: project2.id,
      },
    }),
  ])

  logger.info('🏷️  Created tags')

  // Create sample tasks
  const tasks = await Promise.all([
    prisma.task.create({
      data: {
        title: 'Design new homepage',
        description: 'Create mockups and prototypes for the new homepage design',
        status: 'IN_PROGRESS',
        priority: 'HIGH',
        dueDate: new Date('2024-01-15'),
        creatorId: users[0].id,
        assigneeId: users[2].id,
        projectId: project1.id,
        estimatedHours: 20,
      },
    }),
    prisma.task.create({
      data: {
        title: 'Implement user authentication',
        description: 'Add login and signup functionality with JWT tokens',
        status: 'COMPLETED',
        priority: 'MEDIUM',
        dueDate: new Date('2024-01-12'),
        completedAt: new Date('2024-01-10'),
        creatorId: users[1].id,
        assigneeId: users[1].id,
        projectId: project1.id,
        estimatedHours: 16,
        actualHours: 18,
      },
    }),
    prisma.task.create({
      data: {
        title: 'Set up CI/CD pipeline',
        description: 'Configure automated testing and deployment',
        status: 'TODO',
        priority: 'MEDIUM',
        dueDate: new Date('2024-01-20'),
        creatorId: users[0].id,
        assigneeId: users[1].id,
        projectId: project1.id,
        estimatedHours: 12,
      },
    }),
    prisma.task.create({
      data: {
        title: 'Mobile app wireframes',
        description: 'Create wireframes for all main screens',
        status: 'IN_PROGRESS',
        priority: 'HIGH',
        dueDate: new Date('2024-02-15'),
        creatorId: users[1].id,
        assigneeId: users[2].id,
        projectId: project2.id,
        estimatedHours: 24,
      },
    }),
    prisma.task.create({
      data: {
        title: 'API documentation',
        description: 'Write comprehensive API documentation',
        status: 'TODO',
        priority: 'LOW',
        dueDate: new Date('2024-02-28'),
        creatorId: users[1].id,
        projectId: project2.id,
        estimatedHours: 8,
      },
    }),
  ])

  logger.info('✅ Created sample tasks')

  // Add task tags
  await Promise.all([
    prisma.taskTag.create({
      data: {
        taskId: tasks[0].id,
        tagId: tags[2].id, // Design
      },
    }),
    prisma.taskTag.create({
      data: {
        taskId: tasks[1].id,
        tagId: tags[1].id, // Backend
      },
    }),
    prisma.taskTag.create({
      data: {
        taskId: tasks[3].id,
        tagId: tags[3].id, // Mobile
      },
    }),
    prisma.taskTag.create({
      data: {
        taskId: tasks[3].id,
        tagId: tags[2].id, // Design
      },
    }),
    prisma.taskTag.create({
      data: {
        taskId: tasks[4].id,
        tagId: tags[4].id, // API
      },
    }),
  ])

  logger.info('🏷️  Added task tags')

  // Add some comments
  await Promise.all([
    prisma.comment.create({
      data: {
        content: 'Looking good! The color scheme works well.',
        authorId: users[0].id,
        taskId: tasks[0].id,
      },
    }),
    prisma.comment.create({
      data: {
        content: 'Authentication is working perfectly. All tests pass.',
        authorId: users[1].id,
        taskId: tasks[1].id,
      },
    }),
    prisma.comment.create({
      data: {
        content: 'Should we add social login options as well?',
        authorId: users[2].id,
        taskId: tasks[1].id,
      },
    }),
  ])

  logger.info('💬 Added sample comments')

  logger.info('🌱 Database seed completed successfully!')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    logger.error('Error during seed:', e)
    await prisma.$disconnect()
    process.exit(1)
  })