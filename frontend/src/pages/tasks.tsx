import React, { useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { Plus, Search, Filter, Calendar, User } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Modal } from '@/components/ui/modal'

interface Task {
  id: number
  title: string
  description: string
  status: 'todo' | 'in-progress' | 'completed'
  priority: 'low' | 'medium' | 'high'
  dueDate: string
  assignee: string
  project: string
}

const mockTasks: Task[] = [
  {
    id: 1,
    title: 'Design new homepage',
    description: 'Create mockups and prototypes for the new homepage design',
    status: 'in-progress',
    priority: 'high',
    dueDate: '2024-01-15',
    assignee: 'John Doe',
    project: 'Website Redesign',
  },
  {
    id: 2,
    title: 'Implement user authentication',
    description: 'Add login and signup functionality with JWT tokens',
    status: 'completed',
    priority: 'medium',
    dueDate: '2024-01-12',
    assignee: 'Jane Smith',
    project: 'Backend API',
  },
  {
    id: 3,
    title: 'Write unit tests',
    description: 'Create comprehensive test suite for core functionality',
    status: 'todo',
    priority: 'medium',
    dueDate: '2024-01-20',
    assignee: 'Bob Johnson',
    project: 'Quality Assurance',
  },
  {
    id: 4,
    title: 'Optimize database queries',
    description: 'Improve performance of slow database operations',
    status: 'todo',
    priority: 'low',
    dueDate: '2024-01-25',
    assignee: 'Alice Brown',
    project: 'Performance',
  },
]

const statusConfig = {
  todo: { label: 'To Do', color: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300' },
  'in-progress': { label: 'In Progress', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' },
  completed: { label: 'Completed', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' },
}

const priorityConfig = {
  low: { label: 'Low', color: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300' },
  medium: { label: 'Medium', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300' },
  high: { label: 'High', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300' },
}

export default function TasksPage() {
  const [tasks] = useState<Task[]>(mockTasks)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [isNewTaskModalOpen, setIsNewTaskModalOpen] = useState(false)

  const filteredTasks = tasks.filter((task) => {
    const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         task.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || task.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const tasksByStatus = {
    todo: filteredTasks.filter(task => task.status === 'todo'),
    'in-progress': filteredTasks.filter(task => task.status === 'in-progress'),
    completed: filteredTasks.filter(task => task.status === 'completed'),
  }

  return (
    <>
      <Helmet>
        <title>Tasks - Productify</title>
        <meta name="description" content="Manage your tasks and track progress with Productify's task management system." />
        <meta name="robots" content="noindex" />
      </Helmet>

      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        {/* Header */}
        <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Tasks</h1>
            <p className="text-muted-foreground">
              Manage and track your team's tasks and projects
            </p>
          </div>
          <Button onClick={() => setIsNewTaskModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Task
          </Button>
        </div>

        {/* Filters and Search */}
        <div className="flex flex-col space-y-4 md:flex-row md:items-center md:space-y-0 md:space-x-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search tasks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex space-x-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="all">All Status</option>
              <option value="todo">To Do</option>
              <option value="in-progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
            <Button variant="outline" size="sm">
              <Filter className="mr-2 h-4 w-4" />
              Filters
            </Button>
          </div>
        </div>

        {/* Task Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">To Do</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{tasksByStatus.todo.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{tasksByStatus['in-progress'].length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{tasksByStatus.completed.length}</div>
            </CardContent>
          </Card>
        </div>

        {/* Kanban Board */}
        <div className="grid gap-6 md:grid-cols-3">
          {Object.entries(tasksByStatus).map(([status, statusTasks]) => (
            <div key={status} className="space-y-4">
              <div className="flex items-center space-x-2">
                <h3 className="font-semibold text-lg">
                  {statusConfig[status as keyof typeof statusConfig].label}
                </h3>
                <span className="text-sm text-muted-foreground">
                  ({statusTasks.length})
                </span>
              </div>
              
              <div className="space-y-3">
                {statusTasks.map((task) => (
                  <Card key={task.id} className="cursor-pointer hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div className="flex items-start justify-between">
                          <h4 className="font-medium text-sm">{task.title}</h4>
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                              priorityConfig[task.priority].color
                            }`}
                          >
                            {priorityConfig[task.priority].label}
                          </span>
                        </div>
                        
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {task.description}
                        </p>
                        
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <div className="flex items-center space-x-1">
                            <Calendar className="h-3 w-3" />
                            <span>{new Date(task.dueDate).toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <User className="h-3 w-3" />
                            <span>{task.assignee}</span>
                          </div>
                        </div>
                        
                        <div className="text-xs text-muted-foreground">
                          {task.project}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                
                {statusTasks.length === 0 && (
                  <div className="text-center text-muted-foreground py-8">
                    No tasks in this column
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* New Task Modal */}
        <Modal
          isOpen={isNewTaskModalOpen}
          onClose={() => setIsNewTaskModalOpen(false)}
          title="Create New Task"
        >
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Title</label>
              <Input placeholder="Enter task title..." />
            </div>
            <div>
              <label className="text-sm font-medium">Description</label>
              <textarea
                placeholder="Enter task description..."
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Priority</label>
                <select className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Due Date</label>
                <Input type="date" />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Assignee</label>
              <select className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                <option value="">Select assignee...</option>
                <option value="john">John Doe</option>
                <option value="jane">Jane Smith</option>
                <option value="bob">Bob Johnson</option>
              </select>
            </div>
            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="outline" onClick={() => setIsNewTaskModalOpen(false)}>
                Cancel
              </Button>
              <Button onClick={() => setIsNewTaskModalOpen(false)}>
                Create Task
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </>
  )
}