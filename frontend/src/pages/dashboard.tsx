import React from 'react'
import { Helmet } from 'react-helmet-async'
import { BarChart, Users, CheckCircle, Clock, Plus } from 'lucide-react'

import { useAuth } from '@/lib/auth-provider'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const stats = [
  {
    name: 'Total Tasks',
    value: '48',
    change: '+12%',
    changeType: 'increase' as const,
    icon: CheckCircle,
  },
  {
    name: 'Active Projects',
    value: '6',
    change: '+2',
    changeType: 'increase' as const,
    icon: BarChart,
  },
  {
    name: 'Team Members',
    value: '12',
    change: '+4',
    changeType: 'increase' as const,
    icon: Users,
  },
  {
    name: 'Hours Tracked',
    value: '156',
    change: '+8%',
    changeType: 'increase' as const,
    icon: Clock,
  },
]

const recentTasks = [
  {
    id: 1,
    title: 'Design new landing page',
    project: 'Website Redesign',
    status: 'In Progress',
    dueDate: '2024-01-15',
    priority: 'High',
  },
  {
    id: 2,
    title: 'Implement user authentication',
    project: 'Mobile App',
    status: 'Completed',
    dueDate: '2024-01-12',
    priority: 'Medium',
  },
  {
    id: 3,
    title: 'Write API documentation',
    project: 'Backend Services',
    status: 'Todo',
    dueDate: '2024-01-20',
    priority: 'Low',
  },
]

const upcomingDeadlines = [
  {
    id: 1,
    title: 'Project Alpha Launch',
    date: '2024-01-18',
    daysLeft: 3,
  },
  {
    id: 2,
    title: 'Client Presentation',
    date: '2024-01-22',
    daysLeft: 7,
  },
  {
    id: 3,
    title: 'Marketing Campaign',
    date: '2024-01-25',
    daysLeft: 10,
  },
]

export default function DashboardPage() {
  const { user } = useAuth()

  return (
    <>
      <Helmet>
        <title>Dashboard - Productify</title>
        <meta name="description" content="Your productivity dashboard with tasks, projects, and team insights." />
        <meta name="robots" content="noindex" />
      </Helmet>

      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        {/* Header */}
        <div className="flex items-center justify-between space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">
            Welcome back, {user?.name}!
          </h1>
          <div className="flex items-center space-x-2">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Task
            </Button>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => {
            const Icon = stat.icon
            return (
              <Card key={stat.name}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {stat.name}
                  </CardTitle>
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <p className="text-xs text-muted-foreground">
                    <span className="text-green-600">{stat.change}</span> from last month
                  </p>
                </CardContent>
              </Card>
            )
          })}
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          {/* Recent Tasks */}
          <Card className="col-span-4">
            <CardHeader>
              <CardTitle>Recent Tasks</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentTasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center justify-between space-x-4 rounded-lg border p-4"
                  >
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {task.title}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {task.project}
                      </p>
                    </div>
                    <div className="flex flex-col items-end space-y-1">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          task.status === 'Completed'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                            : task.status === 'In Progress'
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
                        }`}
                      >
                        {task.status}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        Due {new Date(task.dueDate).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4">
                <Button variant="outline" className="w-full">
                  View All Tasks
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Upcoming Deadlines */}
          <Card className="col-span-3">
            <CardHeader>
              <CardTitle>Upcoming Deadlines</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {upcomingDeadlines.map((deadline) => (
                  <div key={deadline.id} className="flex items-center space-x-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                      <span className="text-sm font-semibold text-primary">
                        {deadline.daysLeft}d
                      </span>
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {deadline.title}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(deadline.date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4">
                <Button variant="outline" className="w-full">
                  View Calendar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <Button variant="outline" className="h-24 flex-col">
                <Plus className="h-6 w-6 mb-2" />
                Create New Project
              </Button>
              <Button variant="outline" className="h-24 flex-col">
                <Users className="h-6 w-6 mb-2" />
                Invite Team Member
              </Button>
              <Button variant="outline" className="h-24 flex-col">
                <BarChart className="h-6 w-6 mb-2" />
                View Reports
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  )
}