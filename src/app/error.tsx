'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error for debugging
    console.error('Application Error:', error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-lg text-center">
        <div className="text-6xl mb-4">⚠️</div>
        <h1 className="text-3xl font-bold text-gray-900">Something Went Wrong</h1>
        <p className="mt-2 text-gray-600">An unexpected error has occurred.</p>

        {process.env.NODE_ENV === 'development' && (
          <div className="mt-4 rounded-md bg-red-50 p-3 text-left">
            <p className="font-mono text-sm text-red-700 break-words">{error.message}</p>
          </div>
        )}

        <div className="mt-8 flex flex-col gap-3">
          <button
            onClick={reset}
            className="rounded-md bg-indigo-600 px-4 py-2 font-medium text-white hover:bg-indigo-700 transition"
          >
            Try Again
          </button>
          <Link
            href="/dashboard"
            className="rounded-md border border-indigo-600 px-4 py-2 font-medium text-indigo-600 hover:bg-indigo-50 transition"
          >
            Go to Dashboard
          </Link>
          <Link
            href="/"
            className="rounded-md border border-gray-300 px-4 py-2 font-medium text-gray-700 hover:bg-gray-50 transition"
          >
            Go to Home
          </Link>
        </div>

        <p className="mt-6 text-xs text-gray-500">
          If the problem persists, please contact support.
        </p>
      </div>
    </div>
  );
}
