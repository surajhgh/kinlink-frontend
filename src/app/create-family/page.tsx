'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AuthGuard } from '@/components/AuthGuard';
import { FamilySetupDialog } from '@/components/FamilySetupDialog';
import Link from 'next/link';

export default function CreateFamilyPage() {
  const router = useRouter();
  const [isDialogOpen, setIsDialogOpen] = useState(true);

  const handleFamilyCreated = (): void => {
    setIsDialogOpen(false);
    // Redirect to dashboard after a short delay
    setTimeout(() => {
      router.push('/dashboard');
    }, 500);
  };

  const handleDialogClose = (): void => {
    setIsDialogOpen(false);
    router.back();
  };

  const handleGoBack = (): void => {
    router.back();
  };

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="mx-auto max-w-6xl">
          {/* Header with Back Button */}
          <div className="mb-8 flex items-center justify-between rounded-lg bg-white p-6 shadow-md">
            <div className="flex items-center gap-4">
              <button
                onClick={handleGoBack}
                className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-indigo-600 hover:bg-gray-100 rounded-md transition"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 19l-7-7m0 0l7-7m-7 7h18"
                  />
                </svg>
                <span className="font-medium">Back</span>
              </button>
              <div className="h-6 w-px bg-gray-300"></div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Create Family</h1>
                <p className="text-sm text-gray-600">Set up your family group</p>
              </div>
            </div>
            
            <div className="flex gap-3">
              <Link
                href="/dashboard"
                className="px-4 py-2 text-gray-600 hover:text-indigo-600 hover:bg-gray-100 rounded-md transition font-medium"
              >
                Dashboard
              </Link>
              <Link
                href="/settings"
                className="px-4 py-2 text-gray-600 hover:text-indigo-600 hover:bg-gray-100 rounded-md transition font-medium"
              >
                Settings
              </Link>
            </div>
          </div>

          <FamilySetupDialog
            isOpen={isDialogOpen}
            onClose={handleDialogClose}
            onFamilyCreated={handleFamilyCreated}
          />
        </div>
      </div>
    </AuthGuard>
  );
}
