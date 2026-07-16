'use client';

import { useState } from 'react';
import axios from 'axios';
import { useSession } from 'next-auth/react';

interface FamilySetupDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onFamilyCreated: () => void;
}

export function FamilySetupDialog({
  isOpen,
  onClose,
  onFamilyCreated,
}: FamilySetupDialogProps) {
  const { data: session } = useSession();
  const [mode, setMode] = useState<'choose' | 'create' | 'connect'>('choose');
  const [familyName, setFamilyName] = useState('');
  const [personalCode, setPersonalCode] = useState('');
  const [relationshipType, setRelationshipType] = useState('');
  const [message, setMessage] = useState('');
  const [foundUser, setFoundUser] = useState<any>(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  // Only parent-child relationships are allowed for family requests
  const relationshipTypes = [
    { value: 'Father', label: 'Father' },
    { value: 'Mother', label: 'Mother' },
    { value: 'Son', label: 'Son' },
    { value: 'Daughter', label: 'Daughter' },
  ];

  const handleCreateFamily = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const accessToken = (session as any)?.accessToken;

      if (!accessToken) {
        setError('No access token found. Please log in again.');
        return;
      }

      const response = await axios.post(
        `${apiUrl}/families`,
        { name: familyName },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (response.status === 201) {
        onFamilyCreated();
        onClose();
      }
    } catch (err: any) {
      console.error('Create family error:', err);
      setError(err.response?.data?.error || 'Failed to create family');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchUser = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    setFoundUser(null);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const accessToken = (session as any)?.accessToken;

      if (!accessToken) {
        setError('No access token found. Please log in again.');
        return;
      }

      const response = await axios.get(
        `${apiUrl}/families/search?code=${personalCode}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (response.status === 200 && response.data.user) {
        setFoundUser(response.data.user);
        setError('');
      }
    } catch (err: any) {
      console.error('Search user error:', err);
      setError(err.response?.data?.error || 'User not found with this personal code');
      setFoundUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendRequest = async (): Promise<void> => {
    if (!foundUser || !relationshipType) {
      setError('Please select a relationship type');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const accessToken = (session as any)?.accessToken;

      if (!accessToken) {
        setError('No access token found. Please log in again.');
        return;
      }

      const response = await axios.post(
        `${apiUrl}/relationships`,
        {
          toUserId: foundUser.id,
          type: relationshipType,
          message: message || null,
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (response.status === 201) {
        // Success! Redirect to dashboard
        onFamilyCreated();
        onClose();
      }
    } catch (err: any) {
      console.error('Send relationship request error:', err);
      setError(err.response?.data?.error || 'Failed to send relationship request');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-lg relative max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition"
          aria-label="Close dialog"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        {mode === 'choose' && (
          <>
            <h2 className="mb-6 text-2xl font-bold text-gray-900">Set Up Your Family</h2>
            <div className="space-y-3">
              <button
                onClick={() => setMode('create')}
                className="w-full rounded-lg border-2 border-indigo-600 py-3 font-semibold text-indigo-600 hover:bg-indigo-50"
              >
                Create a New Family
              </button>
              <button
                onClick={() => setMode('connect')}
                className="w-full rounded-lg border-2 border-gray-300 py-3 font-semibold text-gray-700 hover:bg-gray-50"
              >
                Connect with Family Member
              </button>
              <button
                onClick={onClose}
                className="w-full rounded-lg border-2 border-red-300 py-3 font-semibold text-red-600 hover:bg-red-50 mt-4"
              >
                Cancel & Go Back
              </button>
            </div>
          </>
        )}

        {mode === 'create' && (
          <>
            <h2 className="mb-6 text-2xl font-bold text-gray-900">Create a Family</h2>
            <form onSubmit={handleCreateFamily} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Family Name
                </label>
                <input
                  type="text"
                  value={familyName}
                  onChange={(e) => setFamilyName(e.target.value)}
                  required
                  placeholder="e.g., Smith Family"
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none"
                />
              </div>

              {error && <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setMode('choose')}
                  className="flex-1 rounded-md border border-gray-300 py-2 font-medium text-gray-700 hover:bg-gray-50"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 rounded-md bg-indigo-600 py-2 font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                >
                  {isLoading ? 'Creating...' : 'Create Family'}
                </button>
              </div>
            </form>
          </>
        )}

        {mode === 'connect' && !foundUser && (
          <>
            <h2 className="mb-6 text-2xl font-bold text-gray-900">Connect with Family Member</h2>
            <form onSubmit={handleSearchUser} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Enter Personal Code
                </label>
                <p className="text-xs text-gray-500 mt-1 mb-2">
                  Ask your family member for their personal code (e.g., MBR-296153)
                </p>
                <input
                  type="text"
                  value={personalCode}
                  onChange={(e) => setPersonalCode(e.target.value.toUpperCase())}
                  required
                  placeholder="MBR-XXXXXX"
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none font-mono"
                />
              </div>

              {error && <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setMode('choose')}
                  className="flex-1 rounded-md border border-gray-300 py-2 font-medium text-gray-700 hover:bg-gray-50"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 rounded-md bg-indigo-600 py-2 font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                >
                  {isLoading ? 'Searching...' : 'Find Person'}
                </button>
              </div>
            </form>
          </>
        )}

        {mode === 'connect' && foundUser && (
          <>
            <h2 className="mb-6 text-2xl font-bold text-gray-900">Define Relationship</h2>
            
            {/* Found User Card */}
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-3">
                {foundUser.profilePhoto ? (
                  <img
                    src={foundUser.profilePhoto}
                    alt={foundUser.fullName}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-indigo-500 flex items-center justify-center text-white text-xl font-bold">
                    {foundUser.fullName.charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <p className="font-semibold text-gray-900">{foundUser.fullName}</p>
                  <p className="text-sm text-gray-600">{foundUser.personalCode}</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  This person is my:
                </label>
                <select
                  value={relationshipType}
                  onChange={(e) => setRelationshipType(e.target.value)}
                  required
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none"
                >
                  <option value="">Select relationship...</option>
                  {relationshipTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-gray-500">
                  Only parent-child relationships can be requested. Other relationships will be inferred from the family tree.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Message (optional)
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Add a message to help them verify this relationship..."
                  rows={3}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none resize-none"
                />
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                <p className="text-sm text-blue-800">
                  📩 A relationship request will be sent to {foundUser.fullName}. They will need to approve it before it appears on your family tree.
                </p>
              </div>

              {error && <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setFoundUser(null);
                    setRelationshipType('');
                    setMessage('');
                    setError('');
                  }}
                  className="flex-1 rounded-md border border-gray-300 py-2 font-medium text-gray-700 hover:bg-gray-50"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleSendRequest}
                  disabled={isLoading || !relationshipType}
                  className="flex-1 rounded-md bg-indigo-600 py-2 font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                >
                  {isLoading ? 'Sending...' : 'Send Request'}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
