/**
 * WHAT: Minimal toast notification system for user feedback
 * WHY: Provides success/error feedback for async operations; no existing toast system found in codebase
 * 
 * Design: Simple, accessible, auto-dismissing toasts with manual dismiss option
 */

'use client'

import { createContext, useContext, useState, useCallback, ReactNode } from 'react'

type ToastType = 'success' | 'error' | 'info'

interface Toast {
  id: string
  message: string
  type: ToastType
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType) => void
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = `toast-${Date.now()}-${Math.random()}`
    const newToast: Toast = { id, message, type }
    
    setToasts(prev => [...prev, newToast])
    
    // Auto-dismiss after 5 seconds
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, 5000)
  }, [])

  const dismissToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      
      {/* Toast container */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-md">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={`
              px-4 py-3 rounded-lg shadow-lg flex items-center justify-between gap-3
              animate-slide-up
              ${toast.type === 'success' ? 'bg-green-50 border border-green-200' : ''}
              ${toast.type === 'error' ? 'bg-red-50 border border-red-200' : ''}
              ${toast.type === 'info' ? 'bg-blue-50 border border-blue-200' : ''}
            `}
          >
            <p className={`
              text-sm font-medium
              ${toast.type === 'success' ? 'text-green-800' : ''}
              ${toast.type === 'error' ? 'text-red-800' : ''}
              ${toast.type === 'info' ? 'text-blue-800' : ''}
            `}>
              {toast.message}
            </p>
            <button
              onClick={() => dismissToast(toast.id)}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Dismiss"
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      <style jsx global>{`
        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(1rem);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </ToastContext.Provider>
  )
}

/**
 * WHAT: Hook to show toast notifications
 * WHY: Simple API for feedback throughout the app
 */
export function useToast() {
  const context = useContext(ToastContext)
  if (context === undefined) {
    throw new Error('useToast must be used within ToastProvider')
  }
  return context
}
