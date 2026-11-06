import { useEffect, useState, type ReactNode } from 'react';
import { Minus, X } from 'lucide-react';

interface ModalProps {
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  maxWidth?: string;
}

export default function Modal({ title, onClose, children, footer, maxWidth = 'max-w-2xl' }: ModalProps) {
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm modal-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className={`modal-panel flex max-h-[90vh] w-full ${maxWidth} flex-col rounded-2xl bg-white shadow-2xl ring-1 ring-slate-900/5 transition-all duration-200 ${collapsed ? 'max-h-[60px]' : ''}`}
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <h2 id="modal-title" className="text-lg font-semibold text-slate-900">
            {title}
          </h2>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setCollapsed((prev) => !prev)}
              aria-label={collapsed ? 'Развернуть' : 'Свернуть'}
              className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
            >
              <Minus className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Закрыть"
              className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
        {!collapsed && <div className="overflow-y-auto px-6 py-6">{children}</div>}
        {footer && !collapsed && (
          <div className="flex justify-end gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4 rounded-b-2xl">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
