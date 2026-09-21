import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { LoginForm } from '../components/modules/auth/LoginForm';
import { useAppSelector } from '../store';
import { safeNextPath } from '../utils/safe-redirect';

export default function LoginPage() {
  const router = useRouter();
  const isAuthenticated = useAppSelector((s) => s.auth.status === 'authenticated');

  useEffect(() => {
    if (isAuthenticated && router.isReady) void router.replace(safeNextPath(router.query.next));
  }, [isAuthenticated, router]);

  return (
    <main className="mx-auto max-w-sm p-6">
      <h1 className="mb-6 text-2xl font-bold text-slate-900">Sign in</h1>
      <LoginForm />
      <p className="mt-4 text-sm text-slate-800">
        No account?{' '}
        <Link href="/register" className="text-indigo-800 underline">
          Create one
        </Link>
      </p>
    </main>
  );
}
