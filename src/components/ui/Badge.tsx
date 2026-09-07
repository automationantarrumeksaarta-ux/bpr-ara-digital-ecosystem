import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "../../lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wide uppercase transition-colors border",
  {
    variants: {
      variant: {
        success: "bg-[#F0FDF4] text-[#166534] border-[#BBF7D0] dark:bg-success/10 dark:text-success dark:border-success/20",
        warning: "bg-[#FFFBEB] text-[#B45309] border-[#FDE68A] dark:bg-warning/10 dark:text-warning dark:border-warning/20",
        danger: "bg-[#FEF2F2] text-[#991B1B] border-[#FECACA] dark:bg-danger/10 dark:text-danger dark:border-danger/20",
        info: "bg-primary-light text-primary-dark border-primary/20 dark:bg-primary/10 dark:text-primary-light dark:border-primary/20",
        neutral: "bg-surface-muted text-foreground border-border dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700",
      },
    },
    defaultVariants: {
      variant: "neutral",
    },
  }
)

export type BadgeProps = React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof badgeVariants>;

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
