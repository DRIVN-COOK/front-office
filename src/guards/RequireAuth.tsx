import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@drivn-cook/shared'

export default function RequireAuth({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth()
  const loc = useLocation()
  if (!isAuthenticated) return <Navigate to="/login" replace state={{ from: loc }} />
  return <>{children}</>
}
