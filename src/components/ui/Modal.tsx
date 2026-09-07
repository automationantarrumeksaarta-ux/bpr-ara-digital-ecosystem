import * as React from "react"
import { X } from "lucide-react"
import { cn } from "../../lib/utils"

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, description, children, className }) => {
  // Focus & Scroll management
  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape') onClose();
      };
      document.addEventListener("keydown", handleEscape);
      return () => {
        document.body.style.overflow = "unset";
        document.removeEventListener("keydown", handleEscape);
      };
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6" role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={onClose} aria-hidden="true" />
      <div className={cn("relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200", className)}>
        
        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div>
            {title && <h2 id="modal-title" className="text-lg font-bold text-slate-900 dark:text-white">{title}</h2>}
            {description && <p className="text-xs text-slate-500 mt-1">{description}</p>}
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors" aria-label="Close">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  )
}

export { Modal }
