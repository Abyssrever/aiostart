'use client'

import React, { useState, useEffect } from 'react'
import { CheckCircle, X, AlertCircle, Info, AlertTriangle } from 'lucide-react'

interface ToastProps {
  message: string
  description?: string
  type?: 'success' | 'error' | 'warning' | 'info'
  duration?: number
  onClose?: () => void
  isVisible: boolean
}

export function Toast({ 
  message, 
  description, 
  type = 'success', 
  duration = 4000, 
  onClose, 
  isVisible 
}: ToastProps) {
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (isVisible) {
      setShow(true)
      const timer = setTimeout(() => {
        setShow(false)
        setTimeout(() => onClose?.(), 300) // 等待动画完成
      }, duration)
      return () => clearTimeout(timer)
    }
  }, [isVisible, duration, onClose])

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />
      case 'info':
        return <Info className="w-5 h-5 text-blue-500" />
    }
  }

  const getStyles = () => {
    switch (type) {
      case 'success':
        return 'bg-white border-l-4 border-l-green-500 shadow-lg'
      case 'error':
        return 'bg-white border-l-4 border-l-red-500 shadow-lg'
      case 'warning':
        return 'bg-white border-l-4 border-l-yellow-500 shadow-lg'
      case 'info':
        return 'bg-white border-l-4 border-l-blue-500 shadow-lg'
    }
  }

  if (!isVisible && !show) return null

  return (
    <div
      className={`fixed top-4 right-4 z-50 max-w-sm w-full transition-all duration-300 transform ${
        show 
          ? 'translate-x-0 opacity-100 scale-100' 
          : 'translate-x-full opacity-0 scale-95'
      }`}
    >
      <div className={`rounded-lg p-4 ${getStyles()}`}>
        <div className="flex items-start">
          <div className="flex-shrink-0">
            {getIcon()}
          </div>
          <div className="ml-3 flex-1">
            <div className="text-sm font-medium text-gray-900">
              {message}
            </div>
            {description && (
              <div className="mt-1 text-sm text-gray-600">
                {description}
              </div>
            )}
          </div>
          <div className="ml-4 flex-shrink-0 flex">
            <button
              className="inline-flex text-gray-400 hover:text-gray-600 focus:outline-none focus:text-gray-600 transition-colors"
              onClick={() => {
                setShow(false)
                setTimeout(() => onClose?.(), 300)
              }}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        {/* 进度条 */}
        <div className="mt-3 bg-gray-200 rounded-full h-1 overflow-hidden">
          <div 
            className={`h-full transition-all ease-linear ${
              type === 'success' ? 'bg-green-500' : 
              type === 'error' ? 'bg-red-500' : 
              type === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'
            }`}
            style={{
              width: show ? '0%' : '100%',
              transitionDuration: `${duration}ms`
            }}
          />
        </div>
      </div>
    </div>
  )
}

// Toast管理器Hook - 使用全局状态
export function useToast() {
  const showToast = (
    message: string, 
    description?: string, 
    type: 'success' | 'error' | 'warning' | 'info' = 'success',
    duration = 4000
  ) => {
    const id = Math.random().toString(36).substr(2, 9)
    const newToast = { id, message, description, type, duration }
    
    globalToasts.push(newToast)
    globalSetToasts?.(globalToasts)
    
    // 自动移除
    setTimeout(() => {
      globalToasts = globalToasts.filter(toast => toast.id !== id)
      globalSetToasts?.(globalToasts)
    }, duration + 500)
  }

  const success = (message: string, description?: string, duration?: number) => 
    showToast(message, description, 'success', duration)
  
  const error = (message: string, description?: string, duration?: number) => 
    showToast(message, description, 'error', duration)
  
  const warning = (message: string, description?: string, duration?: number) => 
    showToast(message, description, 'warning', duration)
  
  const info = (message: string, description?: string, duration?: number) => 
    showToast(message, description, 'info', duration)

  return {
    showToast,
    success,
    error,
    warning,
    info
  }
}

// Toast容器组件 - 需要全局状态管理
let globalToasts: Array<{
  id: string
  message: string
  description?: string
  type: 'success' | 'error' | 'warning' | 'info'
  duration?: number
}> = []

let globalSetToasts: ((toasts: any[]) => void) | null = null

export function ToastContainer() {
  const [toasts, setToasts] = useState(globalToasts)
  
  useEffect(() => {
    globalSetToasts = setToasts
    return () => { globalSetToasts = null }
  }, [])
  
  const removeToast = (id: string) => {
    const newToasts = toasts.filter(toast => toast.id !== id)
    setToasts(newToasts)
    globalToasts = newToasts
  }
  
  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toasts.map((toast, index) => (
        <div
          key={toast.id}
          style={{ 
            zIndex: 50 + index,
            transform: `translateY(${index * 10}px)`
          }}
        >
          <Toast
            message={toast.message}
            description={toast.description}
            type={toast.type}
            duration={toast.duration}
            isVisible={true}
            onClose={() => removeToast(toast.id)}
          />
        </div>
      ))}
    </div>
  )
}