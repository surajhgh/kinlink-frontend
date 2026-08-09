import axios, { AxiosInstance } from 'axios';
import { getSession } from 'next-auth/react';
import { Relationship, User } from './types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

let axiosInstance: AxiosInstance | null = null;

export async function getAuthenticatedAxiosInstance(): Promise<AxiosInstance> {
  if (!axiosInstance) {
    axiosInstance = axios.create({
      baseURL: API_BASE,
      headers: { 'Content-Type': 'application/json' },
    });

    // Re-attach token on every request (handles token refresh / logout)
    axiosInstance.interceptors.request.use(async (config) => {
      const currentSession = await getSession();
      const currentToken = (currentSession as any)?.accessToken;
      if (currentToken) {
        config.headers.Authorization = `Bearer ${currentToken}`;
      }
      return config;
    });
  }

  return axiosInstance;
}

/** Reset the cached instance (call on logout) */
export function resetAxiosInstance(): void {
  axiosInstance = null;
}

export const apiClient = {
  async get(url: string): Promise<any> {
    const instance = await getAuthenticatedAxiosInstance();
    return instance.get(url);
  },
  async post(url: string, data?: any): Promise<any> {
    const instance = await getAuthenticatedAxiosInstance();
    return instance.post(url, data);
  },
  async patch(url: string, data?: any): Promise<any> {
    const instance = await getAuthenticatedAxiosInstance();
    return instance.patch(url, data);
  },
  async delete(url: string): Promise<any> {
    const instance = await getAuthenticatedAxiosInstance();
    return instance.delete(url);
  },
};

// ─── Users API ───────────────────────────────────────────────────────────────

export const usersApi = {
  /**
   * Get any user's public profile (privacy-filtered by the server)
   */
  async getUserProfile(userId: string): Promise<{ user: Partial<User>; restricted: boolean; reason?: string }> {
    const instance = await getAuthenticatedAxiosInstance();
    const response = await instance.get(`/users/${userId}`);
    return response.data;
  },

  /**
   * Update own profile fields
   */
  async updateProfile(data: {
    fullName?: string;
    nickname?: string;
    gender?: string;
    dateOfBirth?: string;
    placeOfBirth?: string;
    bio?: string;
    occupation?: string;
    education?: string;
    privacy?: string;
  }): Promise<Partial<User>> {
    const instance = await getAuthenticatedAxiosInstance();
    const response = await instance.patch('/users/me', data);
    return response.data.user;
  },

  /**
   * Upload a profile photo file to Cloudinary via the backend.
   * Falls back to sending a URL if no file is provided.
   */
  async uploadProfilePhotoFile(file: File): Promise<string> {
    const session = await getSession();
    const token = (session as any)?.accessToken;

    const formData = new FormData();
    formData.append('photo', file);

    const response = await axios.post(`${API_BASE}/users/me/photo`, formData, {
      headers: {
        Authorization: token ? `Bearer ${token}` : '',
        // Let axios set Content-Type with boundary automatically for FormData
      },
    });
    return response.data.user.profilePhotoUrl as string;
  },

  /**
   * Fallback: save a photo URL directly (no Cloudinary)
   */
  async updateProfilePhotoUrl(photoUrl: string): Promise<string> {
    const instance = await getAuthenticatedAxiosInstance();
    const response = await instance.post('/users/me/photo', { photoUrl });
    return response.data.user.profilePhotoUrl as string;
  },
};

// ─── Relationships API ────────────────────────────────────────────────────────

export const relationshipsApi = {
  async createRelationship(data: { toUserId: string; relationshipType: string; message?: string }) {
    const instance = await getAuthenticatedAxiosInstance();
    const response = await instance.post('/relationships', data);
    return response.data;
  },

  async getPendingRequests(): Promise<Relationship[]> {
    console.log('📞 Calling GET /relationships/pending...');
    const instance = await getAuthenticatedAxiosInstance();
    console.log('📞 Instance created, making request...');
    const response = await instance.get('/relationships/pending');
    console.log('📞 Response received:', response.data);
    return response.data.requests as Relationship[];
  },

  async approveRelationship(id: string) {
    const instance = await getAuthenticatedAxiosInstance();
    const response = await instance.post(`/relationships/${id}/approve`);
    return response.data;
  },

  async rejectRelationship(id: string) {
    const instance = await getAuthenticatedAxiosInstance();
    const response = await instance.post(`/relationships/${id}/reject`);
    return response.data;
  },

  async getVerifiedRelationships(): Promise<Relationship[]> {
    const instance = await getAuthenticatedAxiosInstance();
    const response = await instance.get('/relationships/verified');
    return response.data.relationships as Relationship[];
  },

  /**
   * Get verified relationships for a specific user (for profile page display)
   */
  async getVerifiedRelationshipsForUser(userId: string): Promise<Relationship[]> {
    const instance = await getAuthenticatedAxiosInstance();
    const response = await instance.get(`/users/${userId}/relationships`);
    return response.data.relationships as Relationship[];
  },
};

// ─── Family API ───────────────────────────────────────────────────────────────

export const familyApi = {
  /**
   * Get family tree using graph traversal (new personal code system)
   */
  async getMyFamilyTree(): Promise<{ nodes: User[]; edges: Relationship[]; rootUserId: string }> {
    const instance = await getAuthenticatedAxiosInstance();
    const response = await instance.get('/tree');
    
    // Transform backend response to match frontend User interface
    const transformedNodes = response.data.nodes.map((node: any) => ({
      userId: node.id, // Map id to userId for frontend compatibility
      fullName: node.fullName,
      nickname: node.nickname,
      email: node.email || '',
      profilePhotoUrl: node.profilePhoto,
      bio: node.bio,
      dateOfBirth: node.dateOfBirth,
      personalCode: node.personalCode,
    }));

    // Transform edges to use relationshipType and map user IDs
    const transformedEdges = response.data.edges.map((edge: any) => ({
      id: edge.id,
      fromUserId: edge.fromUserId,
      toUserId: edge.toUserId,
      relationshipType: edge.relationshipType,
      status: edge.status,
      message: edge.message,
      createdAt: edge.createdAt,
    }));

    return {
      nodes: transformedNodes,
      edges: transformedEdges,
      rootUserId: response.data.rootUserId,
    };
  },

  /**
   * @deprecated Use getMyFamilyTree() instead
   * Get current user's family and its members (OLD - family-based system)
   */
  async getMyFamily(): Promise<{ family: any; members: User[]; memberCount: number }> {
    // For backward compatibility, convert tree data to old format
    const treeData = await familyApi.getMyFamilyTree();
    const rootUser = treeData.nodes.find(n => n.userId === treeData.rootUserId);
    return {
      family: rootUser ? {
        familyName: `${rootUser.fullName}'s Family`,
        familyCode: rootUser.personalCode,
        ownerUserId: rootUser.userId,
      } : null,
      members: treeData.nodes,
      memberCount: treeData.nodes.length,
    };
  },

  /**
   * @deprecated Use getMyFamilyTree() instead
   * Get all members of the current user's family
   */
  async getFamilyMembers(): Promise<User[]> {
    const data = await familyApi.getMyFamily();
    return data.members;
  },

  /**
   * Get family tree data (nodes and edges) - OLD method
   * @deprecated Use getMyFamilyTree() instead
   */
  async getFamilyTree(familyCode: string): Promise<{ nodes: User[]; edges: Relationship[] }> {
    const instance = await getAuthenticatedAxiosInstance();
    const response = await instance.get(`/families/${familyCode}/tree`);
    return response.data;
  },

  /**
   * Request to join a family (pending verification)
   */
  async requestJoinFamily(code: string): Promise<any> {
    const instance = await getAuthenticatedAxiosInstance();
    const response = await instance.post(`/families/${code}/verify`);
    return response.data;
  },

  /**
   * Approve a pending family member
   */
  async approveFamilyMember(userId: string): Promise<any> {
    const instance = await getAuthenticatedAxiosInstance();
    const response = await instance.post(`/families/member/${userId}/approve`);
    return response.data;
  },

  /**
   * Get pending family members
   */
  async getPendingMembers(): Promise<any[]> {
    const instance = await getAuthenticatedAxiosInstance();
    const response = await instance.get(`/families/pending-members`);
    return response.data.pendingMembers;
  },
};

