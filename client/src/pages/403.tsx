import Head from 'next/head';
import Link from 'next/link';

export default function ForbiddenPage() {
  return (
    <>
      <Head>
        <title>Access denied | Project</title>
      </Head>
      <main id="main" tabIndex={-1} className="mx-auto max-w-md p-8">
      <h1 className="mb-2 text-2xl font-bold text-slate-900">403 - Access denied</h1>
      <p className="mb-4 text-slate-800">You do not have permission to view this page.</p>
      <Link href="/" className="text-indigo-800 underline">
        Back to home
      </Link>
      </main>
    </>
  );
}
