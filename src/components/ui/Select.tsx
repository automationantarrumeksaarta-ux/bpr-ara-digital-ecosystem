import * as React from "react"
import { cn } from "../../lib/utils"

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  description?: string;
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, description, required, id, children, ...props }, ref) => {
    const generatedId = React.useId();
    const inputId = id || generatedId;
    
    return (
      <div className="w-full flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            {label} {required && <span className="text-danger">*</span>}
          </label>
        )}
        <select
          id={inputId}
          className={cn(
            "flex h-9 w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 disabled:cursor-not-allowed disabled:opacity-50 transition-all cursor-pointer appearance-none",
            error && "border-danger focus-visible:ring-danger/50",
            className
          )}
          ref={ref}
          required={required}
          {...props}
        >
          {children}
        </select>
        {description && !error && <p className="text-[10px] text-slate-500">{description}</p>}
        {error && <p className="text-[10px] font-semibold text-danger">{error}</p>}
      </div>
    )
  }
)
Select.displayName = "Select"

export { Select }
