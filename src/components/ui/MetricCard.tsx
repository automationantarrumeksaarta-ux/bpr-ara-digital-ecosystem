import * as React from "react"
import { TrendingUp, TrendingDown, LucideIcon } from "lucide-react"
import { cn } from "../../lib/utils"
import { Card } from "./Card"

interface MetricCardProps extends React.HTMLAttributes<HTMLDivElement> {
  label: string;
  value: string | React.ReactNode;
  icon?: LucideIcon;
  trend?: string;
  trendDirection?: 'up' | 'down' | 'neutral';
  description?: string;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'primary';
}

const MetricCard = React.forwardRef<HTMLDivElement, MetricCardProps>(
  ({ className, label, value, icon: Icon, trend, trendDirection = 'neutral', description, variant = 'default', ...props }, ref) => {
    
    const colors = {
      primary: {
        bg: "bg-primary-dark border-primary-navy shadow-md text-white",
        iconBg: "bg-white/10",
        iconText: "text-white",
        label: "text-white/80",
        value: "text-white",
        desc: "text-white/70"
      },
      default: {
        bg: "bg-surface dark:bg-slate-900 border border-border shadow-sm",
        iconBg: "bg-primary/10",
        iconText: "text-primary"
      },
      success: {
        bg: "bg-success/5 border border-success/20",
        iconBg: "bg-success/20",
        iconText: "text-success"
      },
      warning: {
        bg: "bg-warning/5 border border-warning/20",
        iconBg: "bg-warning/20",
        iconText: "text-warning"
      },
      danger: {
        bg: "bg-danger/5 border border-danger/20",
        iconBg: "bg-danger/20",
        iconText: "text-danger"
      },
      info: {
        bg: "bg-info/5 border border-info/20",
        iconBg: "bg-info/20",
        iconText: "text-info",
        label: "text-slate-500",
        value: "text-foreground",
        desc: "text-slate-500"
      }
    };

    const currentColors = colors[variant];
    const isPrimary = variant === 'primary';

    return (
      <Card ref={ref} className={cn("p-5 flex flex-col justify-between", currentColors.bg, className)} {...props}>
        <div className="flex justify-between items-start mb-4">
          <p className={cn("text-sm font-medium", currentColors.label || "text-slate-500 dark:text-slate-400")}>{label}</p>
          {Icon && (
            <div className={cn("p-2 rounded-lg", currentColors.iconBg)}>
              <Icon className={cn("w-4 h-4", currentColors.iconText)} />
            </div>
          )}
        </div>
        
        <div>
          <h3 className={cn("text-2xl font-bold tracking-tight", currentColors.value || "text-slate-900 dark:text-white")}>{value}</h3>
          
          {(trend || description) && (
            <div className="mt-2 flex items-center gap-2">
              {trend && (
                <div className={cn(
                  "flex items-center text-[11px] font-bold px-1.5 py-0.5 rounded",
                  trendDirection === 'up' && (isPrimary ? "bg-emerald-800/60 text-emerald-300" : "bg-emerald-100/50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"),
                  trendDirection === 'down' && (isPrimary ? "bg-rose-800/60 text-rose-300" : "bg-rose-100/50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400"),
                  trendDirection === 'neutral' && (isPrimary ? "bg-slate-800/60 text-slate-300" : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400")
                )}>
                  {trendDirection === 'up' && <TrendingUp className="w-3 h-3 mr-1" />}
                  {trendDirection === 'down' && <TrendingDown className="w-3 h-3 mr-1" />}
                  {trend}
                </div>
              )}
              {description && (
                <span className={cn("text-xs", currentColors.desc || "text-slate-500 dark:text-slate-400")}>{description}</span>
              )}
            </div>
          )}
        </div>
      </Card>
    )
  }
)
MetricCard.displayName = "MetricCard"

export { MetricCard }
