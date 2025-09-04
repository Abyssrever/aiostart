'use client'

import { useEffect } from 'react'

interface PerformanceMonitorProps {
  componentName: string
  enabled?: boolean
}

export const PerformanceMonitor: React.FC<PerformanceMonitorProps> = ({ 
  componentName, 
  enabled = process.env.NODE_ENV === 'development' 
}) => {
  useEffect(() => {
    if (!enabled) return

    const startTime = performance.now()
    console.log(`🚀 ${componentName} 开始渲染`)

    return () => {
      const endTime = performance.now()
      const renderTime = endTime - startTime
      
      if (renderTime > 100) {
        console.warn(`⚠️ ${componentName} 渲染时间较长: ${renderTime.toFixed(2)}ms`)
      } else {
        console.log(`✅ ${componentName} 渲染完成: ${renderTime.toFixed(2)}ms`)
      }
    }
  }, [componentName, enabled])

  return null
}

export default PerformanceMonitor