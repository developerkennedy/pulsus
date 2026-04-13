import type { ReactNode } from 'react';

type AuthFormFieldProps = {
  label: string;
  htmlFor: string;
  hint?: string;
  error?: string;
  children: ReactNode;
};

export function AuthFormField({
  label,
  htmlFor,
  hint,
  error,
  children,
}: AuthFormFieldProps) {
  return (
    <div className="space-y-2">
      <label htmlFor={htmlFor} className="text-sm font-medium text-slate-900">
        {label}
      </label>
      {children}
      {hint ? <p className="text-xs text-slate-500">{hint}</p> : null}
      {error ? <p className="text-xs text-rose-500">{error}</p> : null}
    </div>
  );
}
