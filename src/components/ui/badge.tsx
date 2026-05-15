import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../../lib/utils'

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-primary-50 text-primary-700 border border-primary-200',
        secondary: 'bg-gray-100 text-gray-700 border border-gray-200',
        destructive: 'bg-red-50 text-red-700 border border-red-200',
        success: 'bg-green-50 text-green-700 border border-green-200',
        warning: 'bg-amber-50 text-amber-700 border border-amber-200',
        purple: 'bg-purple-50 text-purple-700 border border-purple-200',
        blue: 'bg-blue-50 text-blue-700 border border-blue-200',
        outline: 'bg-transparent text-gray-600 border border-gray-300',
      },
    },
    defaultVariants: { variant: 'default' },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
