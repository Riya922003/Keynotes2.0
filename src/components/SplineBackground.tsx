'use client'

import Spline from '@splinetool/react-spline'
import { Suspense } from 'react'

interface SplineBackgroundProps {
  scene: string
  className?: string
}

function SplineLoader() {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="text-center">
        <div className="w-8 h-8 border-4 border-gray-300 border-t-gray-600 rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-sm text-gray-500 dark:text-gray-400">Loading 3D Scene...</p>
      </div>
    </div>
  )
}

export default function SplineBackground({ scene, className = '' }: SplineBackgroundProps) {
  return (
    <div className={`absolute inset-0 overflow-hidden -z-10 ${className}`}>
      <Suspense fallback={<SplineLoader />}>
        <Spline 
          scene={scene}
          style={{
            width: '100%',
            height: '100%',
            background: 'transparent'
          }}
        />
      </Suspense>
    </div>
  )
}