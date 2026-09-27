import type { InputHTMLAttributes } from 'react'

type InputProps = InputHTMLAttributes<HTMLInputElement>

export function Input({ className = '', ...rest }: InputProps) {
  return <input className={`form-control ${className}`} {...rest} />
}
