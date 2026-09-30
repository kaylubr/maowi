import type { ComponentProps } from 'react'

type InputProps = ComponentProps<'input'>

export function Input({ className = '', ...rest }: InputProps) {
  return <input className={`form-control ${className}`} {...rest} />
}
