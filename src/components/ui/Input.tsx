import * as React from "react"
import { cn } from "../../lib/utils"

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  description?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, label, error, description, required, id, ...props }, ref) => {
    const generatedId = React.useId();
    const inputId = id || generatedId;
    
    return (
      <div className="w-full flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            {label} {required && <span className="text-danger">*</span>}
          </label>
        )}
        <input
          id={inputId}
          type={type}
          className={cn(
            "flex h-9 w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs font-medium placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 disabled:cursor-not-allowed disabled:opacity-50 transition-all",
            error && "border-danger focus-visible:ring-danger/50",
            className
          )}
          ref={ref}
          required={required}
          {...props}
        />
        {description && !error && <p className="text-[10px] text-slate-500">{description}</p>}
        {error && <p className="text-[10px] font-semibold text-danger">{error}</p>}
      </div>
    )
  }
)
Input.displayName = "Input"

export { Input }
