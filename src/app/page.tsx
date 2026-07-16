'use client';

import { useSession, signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';

export default function Home() {
  const { status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'authenticated') {
      router.push('/dashboard');
    }
  }, [status, router]);

  if (status === 'authenticated') {
    return <div></div>;
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="rounded-lg bg-white shadow-lg p-8 max-w-md w-full text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">KinLink</h1>
        <p className="text-gray-600 mb-6">Connect with your family</p>

        <div className="space-y-3 mb-6">
          <Link
            href="/signup"
            className="block w-full rounded-md bg-indigo-600 py-2 font-semibold text-white hover:bg-indigo-700 transition"
          >
            Create Account
          </Link>
          <Link
            href="/login"
            className="block w-full rounded-md border border-indigo-600 py-2 font-semibold text-indigo-600 hover:bg-indigo-50 transition"
          >
            Log In
          </Link>
        </div>

        <button
          onClick={() => signIn('google')}
          className="w-full rounded-md border border-gray-300 py-2 font-medium text-gray-700 hover:bg-gray-50 transition"
        >
          Sign in with Google
        </button>

        <p className="mt-6 text-sm text-gray-500">
          Secure family connections, one relationship at a time.
        </p>
      </div>
    </main>
  );
}
