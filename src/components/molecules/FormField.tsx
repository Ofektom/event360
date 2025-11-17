import { ReactNode } from 'react'
import { Input } from '@/components/atoms/Input'
import { InputHTMLAttributes } from 'react'

interface FormFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
  helperText?: string
  required?: boolean
}

export function FormField({
  label,
  error,
  helperText,
  required,
  ...inputProps
}: FormFieldProps) {
  return (
    <Input
      label={label}
      error={error}
      helperText={helperText}
      required={required}
      {...inputProps}
    />
  )
}

