import Head from 'next/head';
export default function Home() {
  return (
    <>
      <Head>
        <title>Home | Project</title>
      </Head>
      <main id="main" tabIndex={-1} className="p-8">
      <h1 className="text-2xl font-bold">Project</h1>
      </main>
    </>
  );
}
