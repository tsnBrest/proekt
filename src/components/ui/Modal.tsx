import { useEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Minus, X } from 'lucide-react';
import { useModal } from '@/components/ui/ModalProvider';

interface ModalProps {
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  maxWidth?: string;
}

export default function Modal({ title, onClose, children, footer, maxWidth = 'max-w-2xl' }: ModalProps) {
  const { register, unregister, setCollapsed, focus, entries } = useModal();
  const idRef = useRef(++modalIdSeq);
  const id = idRef.current;
  const [collapsed, setLocalCollapsed] = useState(false);

  const entry = entries.find((e) => e.id === id);
  const isCollapsed = entry?.collapsed ?? collapsed;

  useEffect(() => {
    register({
      id,
      title,
      collapsed: false,
      onRestore: () => {
        setLocalCollapsed(false);
        focus(id);
      },
      onClose,
    });
    return () => unregister(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isCollapsed) onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose, isCollapsed]);

  const handleCollapse = () => {
    setLocalCollapsed(true);
    setCollapsed(id, true);
  };

  const handleRestore = () => {
    setLocalCollapsed(false);
    setCollapsed(id, false);
    focus(id);
  };

  if (typeof document === 'undefined') return null;

  return createPortal(
    <>
      {!isCollapsed && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm modal-backdrop"
          style={{ zIndex: entry?.zIndex ?? 50 }}
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={`modal-title-${id}`}
            className={`modal-panel flex max-h-[90vh] w-full ${maxWidth} flex-col rounded-2xl bg-white shadow-2xl ring-1 ring-slate-900/5`}
          >
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <h2 id={`modal-title-${id}`} className="text-lg font-semibold text-slate-900">
                {title}
              </h2>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={handleCollapse}
                  aria-label="Свернуть"
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
            <div className="overflow-y-auto px-6 py-6">{children}</div>
            {footer && (
              <div className="flex justify-end gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4 rounded-b-2xl">
                {footer}
              </div>
            )}
          </div>
        </div>
      )}
    </>,
    document.body,
  );
}

let modalIdSeq = 0;

export { CollapsedDock };

function CollapsedDock() {
  const { entries } = useModal();
  const collapsedEntries = entries.filter((e) => e.collapsed);

  if (collapsedEntries.length === 0) return null;

  return createPortal(
    <div className="fixed bottom-0 left-0 right-0 z-[60] flex flex-wrap items-end gap-2 px-4 pb-2">
      {collapsedEntries.map((entry) => (
        <button
          key={entry.id}
          type="button"
          onClick={entry.onRestore}
          className="dock-button group flex items-center gap-2 rounded-t-lg bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-lg ring-1 ring-slate-900/10 transition-colors hover:bg-slate-50"
        >
          <span className="max-w-[200px] truncate">{entry.title}</span>
          <span
            role="button"
            tabIndex={0}
            onClick={(e) => {
              e.stopPropagation();
              entry.onClose();
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.stopPropagation();
                entry.onClose();
              }
            }}
            className="ml-1 rounded p-0.5 text-slate-400 transition-colors hover:bg-slate-200 hover:text-slate-700"
          >
            <X className="h-4 w-4" />
          </span>
        </button>
      ))}
    </div>,
    document.body,
  );
}
