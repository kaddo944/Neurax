import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiRequest } from '../lib/queryClient'

export interface User {
  id: number
  email: string
  username: string
  twitterConnected?: boolean
  twitterUsername?: string
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterCredentials {
  email: string
  password: string
  username: string
}

export function useAuth() {
  const queryClient = useQueryClient()

  const { data: user, isLoading } = useQuery({
    queryKey: ['user'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/auth/user', {
          credentials: 'include'
        })
        
        if (!response.ok) {
          if (response.status === 401) {
            return null // User not authenticated
          }
          throw new Error('Failed to fetch user')
        }
        
        return await response.json()
      } catch (error) {
        console.error('Error fetching user:', error)
        return null
      }
    },
    retry: false,
    staleTime: 5 * 60 * 1000 // 5 minutes
  })

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginCredentials) => {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(credentials),
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Login failed')
      }
      
      return await response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user'] })
    }
  })

  const registerMutation = useMutation({
    mutationFn: async (credentials: RegisterCredentials) => {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(credentials),
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Registration failed')
      }
      
      return await response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user'] })
    }
  })

  const logoutMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      })
      
      if (!response.ok) {
        throw new Error('Logout failed')
      }
      
      return await response.json()
    },
    onSuccess: () => {
      queryClient.clear()
    }
  })

  const loginWithTwitter = async () => {
    const response = await fetch('/api/twitter/auth/login', {
      credentials: 'include'
    })
    
    if (!response.ok) {
      throw new Error('Failed to initiate Twitter login')
    }
    
    const data = await response.json()
    // Redirect to Twitter authorization URL
    window.location.href = data.url
    return data
  }

  const sendOTP = async (email: string) => {
    // This functionality would need to be implemented on the server
    throw new Error('OTP functionality not implemented with Express auth')
  }

  const verifyOTP = async (email: string, token: string) => {
    // This functionality would need to be implemented on the server
    throw new Error('OTP functionality not implemented with Express auth')
  }

  const resetPassword = async (email: string) => {
    // This functionality would need to be implemented on the server
    throw new Error('Password reset not implemented with Express auth')
  }

  return {
    user,
    isAuthenticated: !!user,
    isLoading,
    login: loginMutation.mutateAsync,
    register: registerMutation.mutateAsync,
    logout: logoutMutation.mutateAsync,
    loginWithTwitter,
    sendOTP,
    verifyOTP,
    resetPassword,
    isLoginLoading: loginMutation.isPending,
    isRegisterLoading: registerMutation.isPending,
    isLogoutLoading: logoutMutation.isPending
  }
}
