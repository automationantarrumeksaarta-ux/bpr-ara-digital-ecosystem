import * as React from "react"
import { cn } from "../../lib/utils"

const PageContainer = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("w-full max-w-7xl mx-auto space-y-5 animate-in fade-in pb-10", className)} {...props} />
  )
)
PageContainer.displayName = "PageContainer"

interface PageHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  description?: string;
  badge?: string;
  badgeVariant?: "success" | "warning" | "danger" | "info" | "neutral";
  actions?: React.ReactNode;
}

const PageHeader = React.forwardRef<HTMLDivElement, PageHeaderProps>(
  ({ className, title, description, badge, badgeVariant = "neutral", actions, ...props }, ref) => {
    return (
      <div ref={ref} className={cn("p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4", className)} {...props}>
        <div>
          <div className="flex items-center gap-2">
            {badge && (
              <span className={cn(
                "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border",
                badgeVariant === 'success' && "bg-emerald-50 text-emerald-700 border-emerald-200",
                badgeVariant === 'info' && "bg-blue-50 text-blue-700 border-blue-200",
                badgeVariant === 'warning' && "bg-amber-50 text-amber-700 border-amber-200",
                badgeVariant === 'danger' && "bg-rose-50 text-rose-700 border-rose-200",
                badgeVariant === 'neutral' && "bg-slate-100 text-slate-700 border-slate-200"
              )}>
                {badge}
              </span>
            )}
          </div>
          <h1 className="text-xl font-bold text-slate-900 mt-1">{title}</h1>
          {description && <p className="text-xs text-slate-500 mt-1">{description}</p>}
        </div>
        {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
      </div>
    )
  }
)
PageHeader.displayName = "PageHeader"

export { PageContainer, PageHeader }
