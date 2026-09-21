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
