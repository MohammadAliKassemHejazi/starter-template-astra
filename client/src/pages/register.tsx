import Link from 'next/link';
import { RegisterForm } from '../components/modules/auth/RegisterForm';

export default function RegisterPage() {
  return (
    <main className="mx-auto max-w-sm p-6">
      <h1 className="mb-6 text-2xl font-bold text-slate-900">Create account</h1>
      <RegisterForm />
      <p className="mt-4 text-sm text-slate-800">
        Already registered?{' '}
        <Link href="/login" className="text-indigo-800 underline">
          Sign in
        </Link>
      </p>
    </main>
  );
}
