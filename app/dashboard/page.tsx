'use client'

import { useEffect, useState } from 'react'
import { Dashboard } from '@/components/dashboard'

export default function DashboardPage() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading Dashboard...</div>
      </div>
    )
  }

  return <Dashboard />
}