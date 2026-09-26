import type { ButtonHTMLAttributes } from 'react'

type ButtonVariant = 'primary' | 'ghost' | 'danger'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant
}

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary: 'bg-white/20 hover:bg-white/30',
  ghost: 'bg-transparent hover:bg-white/10',
  danger: 'bg-red-500/40 hover:bg-red-500/60',
}

export function Button({
  variant = 'primary',
  className = '',
  type = 'button',
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={`rounded-2xl border border-white/20 px-4 py-2 font-medium text-white shadow-xl backdrop-blur-md transition disabled:cursor-not-allowed disabled:opacity-50 ${VARIANT_CLASSES[variant]} ${className}`}
      {...rest}
    />
  )
}
