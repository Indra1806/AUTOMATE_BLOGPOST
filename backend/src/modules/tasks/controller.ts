import { Request, Response } from 'express'
import { taskService } from './service'
import { asyncHandler } from '@/middleware/error'

class TaskController {
  // GET /api/tasks
  getTasks = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id
    const filters = {
      status: req.query.status as string,
      priority: req.query.priority as string,
      assigneeId: req.query.assigneeId as string,
      projectId: req.query.projectId as string,
      search: req.query.search as string,
      dueDate: req.query.dueDate as 'overdue' | 'today' | 'this_week' | 'this_month',
      page: req.query.page ? parseInt(req.query.page as string) : 1,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
      sortBy: req.query.sortBy as 'createdAt' | 'dueDate' | 'priority' | 'title',
      sortOrder: req.query.sortOrder as 'asc' | 'desc',
    }

    const result = await taskService.getTasks(userId, filters)

    res.json({
      success: true,
      data: result.tasks,
      pagination: result.pagination,
    })
  })

  // GET /api/tasks/stats
  getTaskStats = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id
    const projectId = req.query.projectId as string

    const stats = await taskService.getTaskStats(userId, projectId)

    res.json({
      success: true,
      data: stats,
    })
  })

  // GET /api/tasks/:id
  getTaskById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params
    const userId = req.user!.id

    const task = await taskService.getTaskById(id, userId)

    res.json({
      success: true,
      data: task,
    })
  })

  // POST /api/tasks
  createTask = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id
    const {
      title,
      description,
      projectId,
      assigneeId,
      priority,
      dueDate,
      estimatedHours,
      parentTaskId,
    } = req.body

    const taskData = {
      title,
      description,
      projectId,
      assigneeId,
      priority,
      dueDate: dueDate ? new Date(dueDate) : undefined,
      estimatedHours,
      parentTaskId,
    }

    const task = await taskService.createTask(taskData, userId)

    res.status(201).json({
      success: true,
      message: 'Task created successfully',
      data: task,
    })
  })

  // PUT /api/tasks/:id
  updateTask = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params
    const userId = req.user!.id
    const {
      title,
      description,
      status,
      priority,
      assigneeId,
      dueDate,
      estimatedHours,
      actualHours,
    } = req.body

    const updateData = {
      title,
      description,
      status,
      priority,
      assigneeId,
      dueDate: dueDate ? new Date(dueDate) : undefined,
      estimatedHours,
      actualHours,
    }

    // Remove undefined values
    Object.keys(updateData).forEach(key => {
      if (updateData[key as keyof typeof updateData] === undefined) {
        delete updateData[key as keyof typeof updateData]
      }
    })

    const task = await taskService.updateTask(id, updateData, userId)

    res.json({
      success: true,
      message: 'Task updated successfully',
      data: task,
    })
  })

  // DELETE /api/tasks/:id
  deleteTask = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params
    const userId = req.user!.id

    await taskService.deleteTask(id, userId)

    res.json({
      success: true,
      message: 'Task deleted successfully',
    })
  })

  // POST /api/tasks/:id/comments
  addComment = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params
    const { content } = req.body
    const userId = req.user!.id

    const comment = await taskService.addComment(id, content, userId)

    res.status(201).json({
      success: true,
      message: 'Comment added successfully',
      data: comment,
    })
  })
}

export const taskController = new TaskController()