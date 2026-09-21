import type { InputHTMLAttributes } from 'react';

interface TextFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'id' | 'className'> {
  id: string;
  label: string;
  error?: string | undefined;
  hint?: string;
}

/** Labelled input with an associated, announced error message. */
export function TextField({ id, label, error, hint, ...inputProps }: TextFieldProps) {
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;
  const describedBy = [error ? errorId : null, hint ? hintId : null].filter(Boolean).join(' ') || undefined;
  return (
    <div className="space-y-1">
      <label htmlFor={id} className="block text-sm font-medium text-slate-900">
        {label}
      </label>
      <input
        {...inputProps}
        id={id}
        name={inputProps.name ?? id}
        className="input"
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
      />
      {hint ? (
        <p id={hintId} className="text-xs text-slate-700">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} role="alert" className="text-sm text-red-800">
          {error}
        </p>
      ) : null}
    </div>
  );
}
