import type { AppProps } from 'next/app';
import Head from 'next/head';
import { AuthProvider } from '../context/AuthContext';
import '../styles/globals.css';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <AuthProvider>
      <Head>
        <title>LL LifeLink - Connected Care & Senior Medication Management</title>
        <meta name="description" content="Production medication management and caregiver support platform for older adults." />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        <meta name="theme-color" content="#FF7A00" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="LL LifeLink" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Component {...pageProps} />
    </AuthProvider>
  );
}
