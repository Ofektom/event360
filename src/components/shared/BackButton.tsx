'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/atoms/Button'

interface BackButtonProps {
  href?: string
  label?: string
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline'
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function BackButton({ 
  href, 
  label = 'Back', 
  variant = 'ghost',
  size = 'sm',
  className = ''
}: BackButtonProps) {
  const router = useRouter()

  const handleClick = () => {
    if (href) {
      router.push(href)
    } else {
      router.back()
    }
  }

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleClick}
      className={className}
    >
      ← {label}
    </Button>
  )
}

