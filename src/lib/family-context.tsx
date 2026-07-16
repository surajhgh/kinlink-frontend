'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useSession } from 'next-auth/react';
import axios from 'axios';

export interface FamilyMember {
  userId: string;
  fullName: string;
  email: string;
  profilePhotoUrl?: string;
  isOwner: boolean;
}

export interface Family {
  familyCode: string;
  familyName: string;
  ownerUserId: string;
  createdAt: string;
}

export interface FamilyContextType {
  family: Family | null;
  members: FamilyMember[] | null;
  memberCount: number;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

const FamilyContext = createContext<FamilyContextType | undefined>(undefined);

export function FamilyProvider({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession();
  const [family, setFamily] = useState<Family | null>(null);
  const [members, setMembers] = useState<FamilyMember[] | null>(null);
  const [memberCount, setMemberCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchFamily = async (): Promise<void> => {
    if (status !== 'authenticated' || !session) {
      console.log('[FamilyProvider] Not authenticated, skipping fetch', { status, hasSession: !!session });
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const accessToken = (session as any)?.accessToken;

      if (!accessToken) {
        console.log('[FamilyProvider] No access token found');
        setError('No access token found');
        setIsLoading(false);
        return;
      }

      console.log('[FamilyProvider] Fetching family data from:', `${apiUrl}/families/my-family`);
      const response = await axios.get(`${apiUrl}/families/my-family`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      console.log('[FamilyProvider] Family data received:', response.data);
      setFamily(response.data.family);
      setMembers(response.data.members);
      setMemberCount(response.data.memberCount);
    } catch (err: any) {
      console.error('[FamilyProvider] Error fetching family:', err.response?.status, err.response?.data);
      if (err.response?.status === 404) {
        // User not in a family yet
        console.log('[FamilyProvider] User not in a family (404)');
        setFamily(null);
        setMembers(null);
        setMemberCount(0);
      } else {
        setError(err.response?.data?.error || 'Failed to fetch family');
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    console.log('[FamilyProvider] Effect triggered:', { status, hasSession: !!session, hasEmail: !!(session as any)?.user?.email });
    if (status === 'authenticated' && session?.user) {
      fetchFamily();
    }
  }, [status, session?.user?.email]);

  return (
    <FamilyContext.Provider
      value={{
        family,
        members,
        memberCount,
        isLoading,
        error,
        refetch: fetchFamily,
      }}
    >
      {children}
    </FamilyContext.Provider>
  );
}

export function useFamily(): FamilyContextType {
  const context = useContext(FamilyContext);
  if (!context) {
    throw new Error('useFamily must be used within FamilyProvider');
  }
  return context;
}
