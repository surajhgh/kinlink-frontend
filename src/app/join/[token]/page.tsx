'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession, signIn } from 'next-auth/react';
import axios from 'axios';

interface FamilyInfo {
  familyCode: string;
  familyName: string;
}

export default function JoinFamilyPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  const token = params.token as string;

  const [family, setFamily] = useState<FamilyInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAccepting, setIsAccepting] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  // Fetch invitation details
  useEffect(() => {
    const fetchInvitation = async (): Promise<void> => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
        const response = await axios.get(`${apiUrl}/invitations/${token}`);

        if (response.data.valid) {
          setFamily(response.data.family);
        }
      } catch (err: any) {
        if (err.response?.status === 410) {
          setError('This invitation has expired or has already been used.');
        } else if (err.response?.status === 404) {
          setError('This invitation does not exist.');
        } else {
          setError('Failed to validate invitation.');
        }
      } finally {
        setIsLoading(false);
      }
    };

    if (token) {
      fetchInvitation();
    }
  }, [token]);

  // If not authenticated, redirect to login/signup
  useEffect(() => {
    if (status === 'unauthenticated') {
      // Store return URL for after auth
      localStorage.setItem('returnAfterAuth', `/join/${token}`);
    }
  }, [status, token]);

  const handleAcceptInvitation = async (): Promise<void> => {
    if (status !== 'authenticated' || !session) {
      // Redirect to signup/login
      localStorage.setItem('returnAfterAuth', `/join/${token}`);
      signIn();
      return;
    }

    setIsAccepting(true);
    setError('');
    setMessage('');

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const accessToken = (session as any).accessToken;

      if (!accessToken) {
        setError('Authentication failed. Please log in again.');
        return;
      }

      const response = await axios.post(
        `${apiUrl}/invitations/${token}/accept`,
        {},
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      setMessage(`Successfully joined ${response.data.family.familyName}!`);

      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        router.push('/dashboard');
      }, 2000);
    } catch (err: any) {
      if (err.response?.status === 410) {
        setError('This invitation has expired or has already been used.');
      } else if (err.response?.status === 401) {
        setError('You need to be logged in to accept this invitation.');
      } else {
        setError(err.response?.data?.error || 'Failed to join family.');
      }
    } finally {
      setIsAccepting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
          <p className="mt-4 text-gray-600">Validating invitation...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-lg">
          <h1 className="mb-4 text-2xl font-bold text-gray-900">Invitation Error</h1>
          <div className="mb-6 rounded-md bg-red-50 p-4 text-red-700">{error}</div>
          <button
            onClick={() => router.push('/')}
            className="w-full rounded-md bg-indigo-600 py-2 font-medium text-white hover:bg-indigo-700"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  if (!family) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-lg text-center">
          <h1 className="mb-2 text-2xl font-bold text-gray-900">Join {family.familyName}</h1>
          <p className="mb-6 text-gray-600">Sign up or log in to accept this invitation</p>

          <div className="space-y-3">
            <button
              onClick={() => {
                localStorage.setItem('returnAfterAuth', `/join/${token}`);
                signIn('google');
              }}
              className="w-full rounded-md border border-gray-300 py-2 font-medium text-gray-700 hover:bg-gray-50"
            >
              Sign up with Google
            </button>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-white px-2 text-gray-500">or</span>
              </div>
            </div>

            <button
              onClick={() => {
                localStorage.setItem('returnAfterAuth', `/join/${token}`);
                router.push('/signup');
              }}
              className="w-full rounded-md bg-indigo-600 py-2 font-medium text-white hover:bg-indigo-700"
            >
              Sign up with Email
            </button>

            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <button
                onClick={() => {
                  localStorage.setItem('returnAfterAuth', `/join/${token}`);
                  router.push('/login');
                }}
                className="font-medium text-indigo-600 hover:text-indigo-500"
              >
                Log in
              </button>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-lg">
        <h1 className="mb-2 text-center text-3xl font-bold text-gray-900">
          Join {family.familyName}
        </h1>
        <p className="mb-6 text-center text-gray-600">
          You&apos;ve been invited to join the family
        </p>

        <div className="mb-6 rounded-md bg-blue-50 p-4">
          <p className="text-sm text-blue-800">
            <strong>Family Code:</strong> {family.familyCode}
          </p>
        </div>

        {message && (
          <div className="mb-6 rounded-md bg-green-50 p-4 text-sm text-green-700">{message}</div>
        )}

        {error && (
          <div className="mb-6 rounded-md bg-red-50 p-4 text-sm text-red-700">{error}</div>
        )}

        <button
          onClick={handleAcceptInvitation}
          disabled={isAccepting || !!message}
          className="w-full rounded-md bg-indigo-600 py-3 font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          {isAccepting ? 'Accepting...' : 'Accept Invitation'}
        </button>

        <button
          onClick={() => router.push('/')}
          className="mt-3 w-full rounded-md border border-gray-300 py-3 font-medium text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
