'use client';

import { useSession } from 'next-auth/react';
import { AuthGuard } from '@/components/AuthGuard';
import { useEffect, useState } from 'react';
import { relationshipsApi } from '@/lib/api';
import { Relationship } from '@/lib/types';
import { toast } from 'sonner';
import axios from 'axios';

export default function RequestsPage() {
  const { data: session, status } = useSession();
  const [pendingRequests, setPendingRequests] = useState<Relationship[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());

  console.log('RequestsPage: Session status:', status);
  console.log('RequestsPage: Session data:', session);

  useEffect(() => {
    const fetchPendingRequests = async (): Promise<void> => {
      console.log('useEffect: Starting to fetch, status:', status);
      
      if (status !== 'authenticated') {
        console.log('useEffect: Not authenticated yet, waiting...');
        return;
      }

      try {
        console.log('Fetching pending requests...');
        const requests = await relationshipsApi.getPendingRequests();
        console.log('Pending requests received:', requests);
        setPendingRequests(requests);
      } catch (err) {
        console.error('Failed to fetch pending requests:', err);
        if (axios.isAxiosError(err)) {
          console.error('Axios error details:', {
            status: err.response?.status,
            data: err.response?.data,
            url: err.config?.url,
            baseURL: err.config?.baseURL,
          });
        }
        toast.error('Failed to load pending requests');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPendingRequests();
  }, [status]);

  const handleApprove = async (id: string) => {
    if (!id) return;
    setProcessingIds(prev => new Set(prev).add(id));
    try {
      await relationshipsApi.approveRelationship(id);
      setPendingRequests(prev => prev.filter(r => r.id !== id));
      toast.success('Relationship approved successfully!');
    } catch (err) {
      console.error('Failed to approve:', err);
      toast.error('Failed to approve relationship');
    } finally {
      setProcessingIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const handleReject = async (id: string) => {
    if (!id) return;
    setProcessingIds(prev => new Set(prev).add(id));
    try {
      await relationshipsApi.rejectRelationship(id);
      setPendingRequests(prev => prev.filter(r => r.id !== id));
      toast.success('Relationship rejected');
    } catch (err) {
      console.error('Failed to reject:', err);
      toast.error('Failed to reject relationship');
    } finally {
      setProcessingIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  if (!session) {
    return <div></div>;
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="mx-auto max-w-4xl">
          <div className="mb-8 flex items-center justify-between rounded-lg bg-white p-6 shadow-md">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Relationship Requests</h1>
              <p className="mt-1 text-gray-600">Review and respond to incoming requests</p>
            </div>
            <a
              href="/dashboard"
              className="rounded-md bg-gray-600 px-4 py-2 font-medium text-white hover:bg-gray-700"
            >
              Back to Dashboard
            </a>
          </div>

          <div className="space-y-4">
            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
              </div>
            ) : pendingRequests.length === 0 ? (
              <div className="rounded-lg bg-white p-8 text-center shadow-md">
                <p className="text-gray-600">No pending relationship requests</p>
              </div>
            ) : (
              pendingRequests.map(request => (
                <div key={request.id} className="rounded-lg bg-white p-6 shadow-md">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-lg font-semibold text-gray-900">
                        {request.fromUser?.fullName} says they are your {request.relationshipType}
                      </p>
                      {request.message && (
                        <p className="mt-2 text-gray-600">"{request.message}"</p>
                      )}
                    </div>
                  </div>
                  <div className="mt-4 flex gap-3">
                    <button
                      onClick={() => handleApprove(request.id!)}
                      disabled={processingIds.has(request.id!)}
                      className="rounded-md bg-green-600 px-4 py-2 font-medium text-white hover:bg-green-700 disabled:opacity-50"
                    >
                      {processingIds.has(request.id!) ? 'Processing...' : 'Approve'}
                    </button>
                    <button
                      onClick={() => handleReject(request.id!)}
                      disabled={processingIds.has(request.id!)}
                      className="rounded-md bg-red-600 px-4 py-2 font-medium text-white hover:bg-red-700 disabled:opacity-50"
                    >
                      {processingIds.has(request.id!) ? 'Processing...' : 'Reject'}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
