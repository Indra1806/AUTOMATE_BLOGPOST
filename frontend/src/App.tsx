import React from 'react'
import { Routes, Route } from 'react-router-dom'
import { ThemeProvider } from '@/lib/theme-provider'
import { AuthProvider } from '@/lib/auth-provider'
import ErrorBoundary from '@/components/ui/error-boundary'

// Layout components
import Layout from '@/components/layout/layout'

// Pages
import HomePage from '@/pages/home'
import LoginPage from '@/pages/login'
import SignupPage from '@/pages/signup'
import DashboardPage from '@/pages/dashboard'
import TasksPage from '@/pages/tasks'
import NotFoundPage from '@/pages/not-found'

// Protected route wrapper
import ProtectedRoute from '@/components/ui/protected-route'

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="system" storageKey="productify-ui-theme">
        <AuthProvider>
          <Layout>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignupPage />} />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <DashboardPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/tasks"
                element={
                  <ProtectedRoute>
                    <TasksPage />
                  </ProtectedRoute>
                }
              />
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </Layout>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  )
}

export default App