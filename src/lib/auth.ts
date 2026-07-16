import { type NextAuthConfig } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';

export const authOptions: NextAuthConfig = {
  providers: [
    // Credentials provider for email/password
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          console.log('[Credentials Provider] Missing email or password');
          return null;
        }

        try {
          console.log('[Credentials Provider] Attempting login for:', credentials.email);
          
          const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: credentials.email,
              password: credentials.password,
            }),
          });

          const responseText = await response.text();
          console.log('[Credentials Provider] Response status:', response.status);
          console.log('[Credentials Provider] Response text:', responseText);

          if (!response.ok) {
            console.log('[Credentials Provider] Login failed with status', response.status);
            return null;
          }

          const data = JSON.parse(responseText);
          console.log('[Credentials Provider] Login successful, user:', data.user.email);

          return {
            id: data.user.id,
            email: data.user.email,
            name: data.user.fullName,
            accessToken: data.token,
          };
        } catch (error) {
          console.error('[Credentials Provider] Error:', error);
          return null;
        }
      },
    }),

    // Google provider
    GoogleProvider({
      clientId: GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      async profile(profile) {
        return {
          id: profile.sub,
          email: profile.email,
          name: profile.name,
          image: profile.picture,
        };
      },
    }),
  ],

  callbacks: {
    async jwt({ token, account, user }) {
      // On initial sign in or Google sign in
      if (account && account.provider === 'google') {
        try {
          // Get Google ID token for backend verification
          const idToken = account.id_token;

          if (!idToken) {
            throw new Error('No ID token from Google');
          }

          // Send to backend to verify and get JWT
          const response = await fetch(`${API_URL}/auth/google`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ idToken }),
          });

          if (!response.ok) {
            throw new Error('Backend Google auth failed');
          }

          const data = await response.json();
          token.accessToken = data.token;
          token.userId = data.user.userId;
        } catch (error) {
          console.error('JWT callback Google auth error:', error);
        }
      }

      // Handle credentials provider
      if (user && 'accessToken' in user) {
        console.log('[JWT Callback] User from credentials:', { id: user.id, email: user.email });
        token.accessToken = user.accessToken;
        token.userId = user.id;
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.userId as string;
        (session as any).accessToken = token.accessToken as string;
        console.log('[Session Callback] Session updated:', { userId: token.userId });
      }
      return session;
    },
  },

  pages: {
    signIn: '/login',
    signOut: '/login',
    error: '/login',
  },

  session: {
    strategy: 'jwt',
    maxAge: 7 * 24 * 60 * 60, // 7 days
  },
};
