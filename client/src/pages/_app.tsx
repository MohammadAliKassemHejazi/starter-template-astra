import { useEffect, useState } from 'react';
import type { AppProps } from 'next/app';
import { Provider } from 'react-redux';
import { AppShell } from '../components/layout/AppShell';
import { makeStore } from '../store';
import { fetchMe } from '../store/slices/auth-slice';
import '../styles/globals.css';

export default function App({ Component, pageProps }: AppProps) {
  const [store] = useState(makeStore);

  // Restore the session from the httpOnly cookies once per page load (identity is never kept in JS storage).
  useEffect(() => {
    void store.dispatch(fetchMe());
  }, [store]);

  return (
    <Provider store={store}>
      <AppShell>
        <Component {...pageProps} />
      </AppShell>
    </Provider>
  );
}
