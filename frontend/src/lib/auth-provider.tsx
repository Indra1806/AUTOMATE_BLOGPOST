import React, { createContext, useContext, useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import axios from 'axios'
import Cookies from 'js-cookie'
import toast from 'react-hot-toast'

interface User {
  id: string
  email: string
  name: string
  role: 'user' | 'admin'
  avatar?: string
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  signup: (name: string, email: string, password: string) => Promise<void>
  logout: () => void
  refreshToken: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

// Configure axios defaults
axios.defaults.baseURL = API_BASE_URL
axios.defaults.withCredentials = true

// Add auth token to requests
axios.interceptors.request.use(
  (config) => {
    const token = Cookies.get('accessToken')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Handle token refresh
axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true
      
      try {
        const refreshToken = Cookies.get('refreshToken')
        if (refreshToken) {
          const response = await axios.post('/auth/refresh', {
            refreshToken
          })
          
          const { accessToken } = response.data
          Cookies.set('accessToken', accessToken, { 
            expires: 1, // 1 day
            secure: true, 
            sameSite: 'strict' 
          })
          
          originalRequest.headers.Authorization = `Bearer ${accessToken}`
          return axios(originalRequest)
        }
      } catch (refreshError) {
        // Refresh failed, redirect to login
        Cookies.remove('accessToken')
        Cookies.remove('refreshToken')
        window.location.href = '/login'
      }
    }
    
    return Promise.reject(error)
  }
)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const queryClient = useQueryClient()

  // Fetch current user
  const { isLoading } = useQuery(
    'current-user',
    async () => {
      const token = Cookies.get('accessToken')
      if (!token) return null
      
      const response = await axios.get('/auth/me')
      return response.data
    },
    {
      onSuccess: (data) => {
        setUser(data)
      },
      onError: () => {
        setUser(null)
        Cookies.remove('accessToken')
        Cookies.remove('refreshToken')
      },
      retry: false,
      refetchOnWindowFocus: false,
    }
  )

  const loginMutation = useMutation(
    async ({ email, password }: { email: string; password: string }) => {
      const response = await axios.post('/auth/login', { email, password })
      return response.data
    },
    {
      onSuccess: (data) => {
        const { user, accessToken, refreshToken } = data
        
        Cookies.set('accessToken', accessToken, { 
          expires: 1, // 1 day
          secure: true, 
          sameSite: 'strict' 
        })
        Cookies.set('refreshToken', refreshToken, { 
          expires: 7, // 7 days
          secure: true, 
          sameSite: 'strict' 
        })
        
        setUser(user)
        queryClient.setQueryData('current-user', user)
        toast.success('Welcome back!')
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || 'Login failed')
      },
    }
  )

  const signupMutation = useMutation(
    async ({ name, email, password }: { name: string; email: string; password: string }) => {
      const response = await axios.post('/auth/signup', { name, email, password })
      return response.data
    },
    {
      onSuccess: (data) => {
        const { user, accessToken, refreshToken } = data
        
        Cookies.set('accessToken', accessToken, { 
          expires: 1,
          secure: true, 
          sameSite: 'strict' 
        })
        Cookies.set('refreshToken', refreshToken, { 
          expires: 7,
          secure: true, 
          sameSite: 'strict' 
        })
        
        setUser(user)
        queryClient.setQueryData('current-user', user)
        toast.success('Account created successfully!')
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || 'Signup failed')
      },
    }
  )

  const login = async (email: string, password: string) => {
    await loginMutation.mutateAsync({ email, password })
  }

  const signup = async (name: string, email: string, password: string) => {
    await signupMutation.mutateAsync({ name, email, password })
  }

  const logout = () => {
    Cookies.remove('accessToken')
    Cookies.remove('refreshToken')
    setUser(null)
    queryClient.clear()
    toast.success('Logged out successfully')
  }

  const refreshToken = async () => {
    try {
      const refreshToken = Cookies.get('refreshToken')
      if (!refreshToken) throw new Error('No refresh token')
      
      const response = await axios.post('/auth/refresh', { refreshToken })
      const { accessToken } = response.data
      
      Cookies.set('accessToken', accessToken, { 
        expires: 1,
        secure: true, 
        sameSite: 'strict' 
      })
    } catch (error) {
      logout()
    }
  }

  const value: AuthContextType = {
    user,
    isLoading,
    login,
    signup,
    logout,
    refreshToken,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}