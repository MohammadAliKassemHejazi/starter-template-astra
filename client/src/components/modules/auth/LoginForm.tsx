import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/router';
import { loginSchema } from '@project/shared';
import { TextField } from '../../common/TextField';
import { useAppDispatch } from '../../../store';
import { login } from '../../../store/slices/auth-slice';
import { safeNextPath } from '../../../utils/safe-redirect';
import { toFieldErrors } from '../../../utils/zod-field-errors';

export function LoginForm() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const registered = router.query.registered === '1';

  const onSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const parsed = loginSchema.safeParse({ email: form.get('email'), password: form.get('password') });
    if (!parsed.success) {
      setFieldErrors(toFieldErrors(parsed.error.issues));
      setFormError(null);
      return;
    }
    setFieldErrors({});
    setFormError(null);
    setIsPending(true);
    const result = await dispatch(login(parsed.data));
    if (login.fulfilled.match(result)) {
      await router.replace(safeNextPath(router.query.next));
      return;
    }
    setIsPending(false);
    // Deliberately generic: never reveal whether the email exists.
    setFormError(result.payload?.status === 429 ? result.payload.message : result.payload?.message ?? 'Sign in failed');
  };

  return (
    <form noValidate onSubmit={(e) => void onSubmit(e)} className="space-y-4" aria-label="Sign in">
      {registered ? (
        <p role="status" className="alert-info">
          Account created. Sign in to continue.
        </p>
      ) : null}
      {formError ? (
        <p role="alert" className="alert-error">
          {formError}
        </p>
      ) : null}
      <TextField id="email" label="Email" type="email" autoComplete="username" error={fieldErrors.email} />
      <TextField
        id="password"
        label="Password"
        type="password"
        autoComplete="current-password"
        error={fieldErrors.password}
      />
      <button type="submit" className="btn-primary w-full" disabled={isPending}>
        {isPending ? 'Signing in…' : 'Sign in'}
      </button>
    </form>
  );
}
