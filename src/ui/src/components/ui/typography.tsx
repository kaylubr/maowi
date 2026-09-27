import type { HTMLAttributes, LabelHTMLAttributes } from 'react'

type TextProps = HTMLAttributes<HTMLElement>

export function Label({
  className = '',
  ...rest
}: LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={`form-label ${className}`} {...rest} />
}

export function ErrorText({ className = '', ...rest }: TextProps) {
  return <p role="alert" className={`text-danger small mb-2 ${className}`} {...rest} />
}
