import type { HTMLAttributes, ReactNode } from 'react'

type GlassCardProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode
}

export function GlassCard({ children, className = '', ...rest }: GlassCardProps) {
  return (
    <div
      className={`rounded-2xl border border-white/20 bg-white/10 p-6 text-white shadow-xl backdrop-blur-md ${className}`}
      {...rest}
    >
      {children}
    </div>
  )
}
