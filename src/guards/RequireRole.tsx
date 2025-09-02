import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '@drivn-cook/shared'

export default function RequireRole({ role, children }: { role: string; children: React.ReactNode }) {
  const { user } = useAuth() as any
  const roles: string[] = user?.roles ?? (user?.role ? [user.role] : [])
  if (role && !roles.includes(role)) return <Navigate to="/" replace />
  return <>{children}</>
}
