import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/router';
import { PASSWORD_MIN, registerSchema } from '@project/shared';
import { TextField } from '../../common/TextField';
import { useAppDispatch } from '../../../store';
import { register } from '../../../store/slices/auth-slice';
import { focusFirstInvalid, fromServerErrors, toFieldErrors } from '../../../utils/zod-field-errors';

export function RegisterForm() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isDisabled, setIsDisabled] = useState(false);
  const [isPending, setIsPending] = useState(false);

  const onSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    const formEl = event.currentTarget;
    const form = new FormData(formEl);
    const parsed = registerSchema.safeParse({
      name: form.get('name'),
      email: form.get('email'),
      password: form.get('password'),
    });
    if (!parsed.success) {
      const errors = toFieldErrors(parsed.error.issues);
      setFieldErrors(errors);
      setFormError(null);
      focusFirstInvalid(formEl, errors);
      return;
    }
    setFieldErrors({});
    setFormError(null);
    setIsPending(true);
    const result = await dispatch(register(parsed.data));
    if (register.fulfilled.match(result)) {
      await router.replace('/login?registered=1');
      return;
    }
    setIsPending(false);
    const failure = result.payload;
    if (failure?.status === 403) {
      // ALLOW_REGISTRATION is off on the server.
      setIsDisabled(true);
      setFormError('Registration is currently disabled. Please contact an administrator.');
      return;
    }
    setFieldErrors(fromServerErrors(failure?.errors ?? []));
    setFormError(failure?.message ?? 'Registration failed');
  };

  return (
    <form noValidate onSubmit={(e) => void onSubmit(e)} className="space-y-4" aria-label="Create account">
      {formError ? (
        <p role="alert" className="alert-error">
          {formError}
        </p>
      ) : null}
      <TextField id="name" label="Name" autoComplete="name" error={fieldErrors.name} disabled={isDisabled} />
      <TextField
        id="email"
        label="Email"
        type="email"
        autoComplete="email"
        error={fieldErrors.email}
        disabled={isDisabled}
      />
      <TextField
        id="password"
        label="Password"
        type="password"
        autoComplete="new-password"
        hint={`At least ${PASSWORD_MIN} characters`}
        error={fieldErrors.password}
        disabled={isDisabled}
      />
      <button type="submit" className="btn-primary w-full" disabled={isPending || isDisabled}>
        {isPending ? 'Creating account…' : 'Create account'}
      </button>
    </form>
  );
}
