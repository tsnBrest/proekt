import type { ReactNode } from 'react';

export const inputClassName =
  'w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:bg-slate-100 disabled:text-slate-500';

interface FormFieldProps {
  label: string;
  error?: string;
  hint?: ReactNode;
  htmlFor: string;
  children: ReactNode;
  className?: string;
}

export default function FormField({ label, error, hint, htmlFor, children, className = '' }: FormFieldProps) {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <label htmlFor={htmlFor} className="flex items-center justify-between text-sm font-medium text-slate-700">
        {label}
      </label>
      {children}
      {error ? (
        <p className="text-xs text-red-600">{error}</p>
      ) : (
        hint && <div className="text-xs text-slate-500">{hint}</div>
      )}
    </div>
  );
}
