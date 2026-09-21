import type { FieldError } from '@project/shared';

interface IssueLike {
  path: (string | number)[];
  message: string;
}

/** First message per top-level field from Zod issues or server `errors`. */
export function toFieldErrors(issues: IssueLike[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of issues) {
    const key = String(issue.path[0] ?? '');
    if (key && out[key] === undefined) out[key] = issue.message;
  }
  return out;
}

export function fromServerErrors(errors: FieldError[]): Record<string, string> {
  return toFieldErrors(errors.map((e) => ({ path: [e.field], message: e.issue })));
}

/** Move focus to the first control in the form whose name has an error (form order wins). */
export function focusFirstInvalid(form: HTMLFormElement, errors: Record<string, string>): void {
  for (const el of Array.from(form.elements)) {
    const name = (el as HTMLInputElement).name;
    if (name && errors[name] !== undefined) {
      (el as HTMLInputElement).focus();
      return;
    }
  }
}
