"use client"

import React from 'react'

type SkeletonProps = React.HTMLAttributes<HTMLDivElement>

export default function Skeleton({ className = '', ...props }: SkeletonProps) {
  return (
    <div
      aria-hidden
      role="presentation"
      className={`animate-pulse bg-muted ${className}`}
      {...props}
    />
  )
}
