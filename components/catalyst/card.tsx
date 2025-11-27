import { cn } from '@/lib/utils'
import React from 'react'

export function Card({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={cn('rounded-xl bg-white shadow-sm border border-zinc-200 dark:bg-zinc-900 dark:border-zinc-800', className)}>
      {children}
    </div>
  )
}

export function CardHeader({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn('p-6 border-b border-zinc-200 dark:border-zinc-800', className)}>{children}</div>
}

export function CardContent({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn('p-6', className)}>{children}</div>
}

export function CardFooter({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn('p-6 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 rounded-b-xl', className)}>{children}</div>
}
