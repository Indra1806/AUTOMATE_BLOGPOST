import { prisma } from '@/db/client'
import { ApiError } from '@/middleware/error'
import { Prisma } from '@prisma/client'

export interface CreateTaskData {
  title: string
  description?: string
  projectId: string
  assigneeId?: string
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  dueDate?: Date
  estimatedHours?: number
  parentTaskId?: string
}

export interface UpdateTaskData {
  title?: string
  description?: string
  status?: 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'COMPLETED' | 'CANCELLED'
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  assigneeId?: string
  dueDate?: Date
  estimatedHours?: number
  actualHours?: number
}

export interface TaskFilters {
  status?: string
  priority?: string
  assigneeId?: string
  projectId?: string
  search?: string
  dueDate?: 'overdue' | 'today' | 'this_week' | 'this_month'
  page?: number
  limit?: number
  sortBy?: 'createdAt' | 'dueDate' | 'priority' | 'title'
  sortOrder?: 'asc' | 'desc'
}

class TaskService {
  // Get all tasks with filters and pagination
  async getTasks(userId: string, filters: TaskFilters) {
    const {
      status,
      priority,
      assigneeId,
      projectId,
      search,
      dueDate,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = filters

    // Build where clause
    const where: Prisma.TaskWhereInput = {
      OR: [
        { creatorId: userId },
        { assigneeId: userId },
        {
          project: {
            OR: [
              { ownerId: userId },
              { members: { some: { userId } } }
            ]
          }
        }
      ]
    }

    // Apply filters
    if (status) {
      where.status = status as any
    }

    if (priority) {
      where.priority = priority as any
    }

    if (assigneeId) {
      where.assigneeId = assigneeId
    }

    if (projectId) {
      where.projectId = projectId
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ]
    }

    if (dueDate) {
      const now = new Date()
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000)
      const weekEnd = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)
      const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, today.getDate())

      switch (dueDate) {
        case 'overdue':
          where.dueDate = { lt: today }
          where.status = { notIn: ['COMPLETED', 'CANCELLED'] }
          break
        case 'today':
          where.dueDate = { gte: today, lt: tomorrow }
          break
        case 'this_week':
          where.dueDate = { gte: today, lt: weekEnd }
          break
        case 'this_month':
          where.dueDate = { gte: today, lt: monthEnd }
          break
      }
    }

    // Calculate pagination
    const skip = (page - 1) * limit

    // Execute query
    const [tasks, total] = await Promise.all([
      prisma.task.findMany({
        where,
        include: {
          creator: {
            select: { id: true, name: true, email: true, avatar: true }
          },
          assignee: {
            select: { id: true, name: true, email: true, avatar: true }
          },
          project: {
            select: { id: true, name: true, color: true }
          },
          tags: {
            include: {
              tag: true
            }
          },
          _count: {
            select: { comments: true, subtasks: true }
          }
        },
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limit,
      }),
      prisma.task.count({ where })
    ])

    return {
      tasks,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page < Math.ceil(total / limit),
        hasPrevPage: page > 1,
      }
    }
  }

  // Get task by ID
  async getTaskById(taskId: string, userId: string) {
    const task = await prisma.task.findFirst({
      where: {
        id: taskId,
        OR: [
          { creatorId: userId },
          { assigneeId: userId },
          {
            project: {
              OR: [
                { ownerId: userId },
                { members: { some: { userId } } }
              ]
            }
          }
        ]
      },
      include: {
        creator: {
          select: { id: true, name: true, email: true, avatar: true }
        },
        assignee: {
          select: { id: true, name: true, email: true, avatar: true }
        },
        project: {
          select: { id: true, name: true, color: true }
        },
        tags: {
          include: {
            tag: true
          }
        },
        comments: {
          include: {
            author: {
              select: { id: true, name: true, email: true, avatar: true }
            }
          },
          orderBy: { createdAt: 'desc' }
        },
        subtasks: {
          include: {
            assignee: {
              select: { id: true, name: true, email: true, avatar: true }
            }
          },
          orderBy: { createdAt: 'asc' }
        },
        parentTask: {
          select: { id: true, title: true }
        }
      }
    })

    if (!task) {
      throw new ApiError('Task not found', 404)
    }

    return task
  }

  // Create new task
  async createTask(data: CreateTaskData, creatorId: string) {
    const { projectId, assigneeId, parentTaskId, ...taskData } = data

    // Verify project access
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        OR: [
          { ownerId: creatorId },
          { members: { some: { userId: creatorId } } }
        ]
      }
    })

    if (!project) {
      throw new ApiError('Project not found or access denied', 404)
    }

    // Verify assignee access to project if provided
    if (assigneeId) {
      const hasAccess = await prisma.project.findFirst({
        where: {
          id: projectId,
          OR: [
            { ownerId: assigneeId },
            { members: { some: { userId: assigneeId } } }
          ]
        }
      })

      if (!hasAccess) {
        throw new ApiError('Assignee does not have access to this project', 400)
      }
    }

    // Verify parent task if provided
    if (parentTaskId) {
      const parentTask = await prisma.task.findFirst({
        where: {
          id: parentTaskId,
          projectId,
          OR: [
            { creatorId },
            { assigneeId: creatorId },
            {
              project: {
                OR: [
                  { ownerId: creatorId },
                  { members: { some: { userId: creatorId } } }
                ]
              }
            }
          ]
        }
      })

      if (!parentTask) {
        throw new ApiError('Parent task not found or access denied', 404)
      }
    }

    const task = await prisma.task.create({
      data: {
        ...taskData,
        creatorId,
        projectId,
        assigneeId,
        parentTaskId,
      },
      include: {
        creator: {
          select: { id: true, name: true, email: true, avatar: true }
        },
        assignee: {
          select: { id: true, name: true, email: true, avatar: true }
        },
        project: {
          select: { id: true, name: true, color: true }
        }
      }
    })

    return task
  }

  // Update task
  async updateTask(taskId: string, data: UpdateTaskData, userId: string) {
    // Verify task access
    const existingTask = await prisma.task.findFirst({
      where: {
        id: taskId,
        OR: [
          { creatorId: userId },
          { assigneeId: userId },
          {
            project: {
              OR: [
                { ownerId: userId },
                { members: { some: { userId: userId, role: { in: ['OWNER', 'ADMIN'] } } } }
              ]
            }
          }
        ]
      }
    })

    if (!existingTask) {
      throw new ApiError('Task not found or access denied', 404)
    }

    // Handle completion status
    const updateData: any = { ...data }
    if (data.status === 'COMPLETED' && existingTask.status !== 'COMPLETED') {
      updateData.completedAt = new Date()
    } else if (data.status !== 'COMPLETED' && existingTask.status === 'COMPLETED') {
      updateData.completedAt = null
    }

    // Verify assignee access if changing assignee
    if (data.assigneeId && data.assigneeId !== existingTask.assigneeId) {
      const hasAccess = await prisma.project.findFirst({
        where: {
          id: existingTask.projectId,
          OR: [
            { ownerId: data.assigneeId },
            { members: { some: { userId: data.assigneeId } } }
          ]
        }
      })

      if (!hasAccess) {
        throw new ApiError('Assignee does not have access to this project', 400)
      }
    }

    const task = await prisma.task.update({
      where: { id: taskId },
      data: updateData,
      include: {
        creator: {
          select: { id: true, name: true, email: true, avatar: true }
        },
        assignee: {
          select: { id: true, name: true, email: true, avatar: true }
        },
        project: {
          select: { id: true, name: true, color: true }
        },
        tags: {
          include: {
            tag: true
          }
        }
      }
    })

    return task
  }

  // Delete task
  async deleteTask(taskId: string, userId: string) {
    // Verify task access and ownership
    const task = await prisma.task.findFirst({
      where: {
        id: taskId,
        OR: [
          { creatorId: userId },
          {
            project: {
              OR: [
                { ownerId: userId },
                { members: { some: { userId: userId, role: { in: ['OWNER', 'ADMIN'] } } } }
              ]
            }
          }
        ]
      }
    })

    if (!task) {
      throw new ApiError('Task not found or access denied', 404)
    }

    await prisma.task.delete({
      where: { id: taskId }
    })
  }

  // Add comment to task
  async addComment(taskId: string, content: string, authorId: string) {
    // Verify task access
    const task = await prisma.task.findFirst({
      where: {
        id: taskId,
        OR: [
          { creatorId: authorId },
          { assigneeId: authorId },
          {
            project: {
              OR: [
                { ownerId: authorId },
                { members: { some: { userId: authorId } } }
              ]
            }
          }
        ]
      }
    })

    if (!task) {
      throw new ApiError('Task not found or access denied', 404)
    }

    const comment = await prisma.comment.create({
      data: {
        content,
        authorId,
        taskId,
      },
      include: {
        author: {
          select: { id: true, name: true, email: true, avatar: true }
        }
      }
    })

    return comment
  }

  // Get task statistics
  async getTaskStats(userId: string, projectId?: string) {
    const baseWhere = {
      OR: [
        { creatorId: userId },
        { assigneeId: userId },
        {
          project: {
            OR: [
              { ownerId: userId },
              { members: { some: { userId } } }
            ]
          }
        }
      ]
    }

    if (projectId) {
      (baseWhere as any).projectId = projectId
    }

    const [totalTasks, todoTasks, inProgressTasks, completedTasks, overdueTasks] = await Promise.all([
      prisma.task.count({ where: baseWhere }),
      prisma.task.count({ where: { ...baseWhere, status: 'TODO' } }),
      prisma.task.count({ where: { ...baseWhere, status: 'IN_PROGRESS' } }),
      prisma.task.count({ where: { ...baseWhere, status: 'COMPLETED' } }),
      prisma.task.count({
        where: {
          ...baseWhere,
          dueDate: { lt: new Date() },
          status: { notIn: ['COMPLETED', 'CANCELLED'] }
        }
      })
    ])

    return {
      total: totalTasks,
      todo: todoTasks,
      inProgress: inProgressTasks,
      completed: completedTasks,
      overdue: overdueTasks,
      completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
    }
  }
}

export const taskService = new TaskService()