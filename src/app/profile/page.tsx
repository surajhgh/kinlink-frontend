'use client';

import { useSession, signOut } from 'next-auth/react';
import { AuthGuard } from '@/components/AuthGuard';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';

interface UserProfile {
  id: string;
  fullName: string;
  email: string;
  personalCode: string;
  personalQRCode?: string;
  profilePhoto?: string;
  bio?: string;
  dateOfBirth?: string;
}

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchProfile = async (): Promise<void> => {
      if (status !== 'authenticated') {
        return;
      }

      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
        const accessToken = (session as any)?.accessToken;

        if (!accessToken) {
          setError('No access token found');
          return;
        }

        const response = await axios.get(`${apiUrl}/families/me`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        setProfile(response.data.user);
      } catch (err) {
        console.error('Failed to fetch profile:', err);
        setError('Failed to load profile');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [session, status]);

  const handleLogout = async (): Promise<void> => {
    await signOut({ redirect: true, callbackUrl: '/login' });
  };

  const copyPersonalCode = () => {
    if (profile?.personalCode) {
      navigator.clipboard.writeText(profile.personalCode);
      setCopied(true);
      toast.success('Personal code copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!session) {
    return <div></div>;
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50 flex">
        {/* Sidebar */}
        <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
          {/* Logo */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <span className="text-2xl">👨‍👩‍👧‍👦</span>
              <span className="text-xl font-bold text-gray-900">KinLink</span>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1">
            <Link
              href="/dashboard"
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-100 transition"
            >
              <span className="text-lg">📊</span>
              <span>Dashboard</span>
            </Link>

            <Link
              href="/tree"
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-100 transition"
            >
              <span className="text-lg">🌳</span>
              <span>Family Tree</span>
            </Link>

            <Link
              href="/members"
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-100 transition"
            >
              <span className="text-lg">👥</span>
              <span>Members</span>
            </Link>

            <Link
              href="/invitations"
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-100 transition"
            >
              <span className="text-lg">📧</span>
              <span>Invitations</span>
            </Link>

            <Link
              href="/requests"
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-100 transition"
            >
              <span className="text-lg">📬</span>
              <span>Requests</span>
            </Link>

            <Link
              href="/birthdays"
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-100 transition"
            >
              <span className="text-lg">🎂</span>
              <span>Birthdays</span>
            </Link>

            <Link
              href="/branches"
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-100 transition"
            >
              <span className="text-lg">🌿</span>
              <span>Branches</span>
            </Link>

            <Link
              href="/messages"
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-100 transition"
            >
              <span className="text-lg">💬</span>
              <span>Messages</span>
            </Link>

            <Link
              href="/settings"
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-100 transition"
            >
              <span className="text-lg">⚙️</span>
              <span>Settings</span>
            </Link>
          </nav>

          {/* Upgrade Section */}
          <div className="p-4 m-4 bg-gradient-to-br from-orange-50 to-yellow-50 rounded-lg border border-orange-200">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">👑</span>
              <span className="font-bold text-sm text-gray-900">Upgrade to Premium</span>
            </div>
            <p className="text-xs text-gray-600 mb-3">Unlock advanced features and insights</p>
            <button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium py-2 rounded-lg transition">
              Upgrade Now
            </button>
          </div>

          {/* User Profile */}
          <div className="p-4 border-t border-gray-200">
            <div className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition">
              <div className="h-10 w-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold">
                {session?.user?.name?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">{session?.user?.name}</p>
                <p className="text-xs text-gray-500 truncate">View Profile</p>
              </div>
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          {/* Top Navigation */}
          <div className="bg-white border-b border-gray-200 px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex-1"></div>
              <div className="flex items-center gap-4">
                <Link href="/dashboard" className="text-sm text-gray-600 hover:text-gray-900">
                  Dashboard
                </Link>
                <Link href="/tree" className="text-sm text-gray-600 hover:text-gray-900">
                  Family Tree
                </Link>
                <Link href="/settings" className="text-sm text-gray-600 hover:text-gray-900">
                  Settings
                </Link>
              </div>
              <div className="flex items-center gap-4 ml-8">
                <button className="relative p-2 text-gray-400 hover:text-gray-600 transition">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                </button>
                <button className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition">
                  Profile
                </button>
                <div className="h-10 w-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold">
                  {session?.user?.name?.charAt(0).toUpperCase() || 'U'}
                </div>
              </div>
            </div>
          </div>

          {/* Page Header */}
          <div className="relative px-8 py-8 bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 border-b border-gray-200 overflow-hidden">
            <div className="relative z-10">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">My Profile</h1>
              <p className="text-gray-600">View and manage your personal information</p>
            </div>
            {/* Decorative illustration */}
            <div className="absolute right-8 top-1/2 -translate-y-1/2 opacity-60">
              <div className="relative w-48 h-32">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-200 to-purple-300 rounded-2xl transform rotate-6"></div>
                <div className="absolute top-4 left-4 w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-lg">
                  <span className="text-3xl">👤</span>
                </div>
                <div className="absolute top-6 right-6 w-12 h-12 bg-indigo-500 rounded-lg flex items-center justify-center shadow-lg">
                  <span className="text-xl">✓</span>
                </div>
                <div className="absolute bottom-4 right-12">
                  <span className="text-4xl">🌿</span>
                </div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-8">
            {isLoading ? (
              <div className="flex items-center justify-center py-16">
                <div className="h-12 w-12 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
              </div>
            ) : error ? (
              <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-red-700">
                {error}
              </div>
            ) : profile ? (
              <div className="space-y-6">
                {/* Main Profile Card */}
                <div className="bg-white rounded-xl border border-gray-200 p-8 shadow-sm">
                  <div className="flex flex-col md:flex-row items-start gap-8">
                    {/* Avatar */}
                    <div className="relative flex-shrink-0">
                      {profile.profilePhoto ? (
                        <img
                          src={profile.profilePhoto}
                          alt={profile.fullName}
                          className="h-32 w-32 rounded-full object-cover border-4 border-indigo-100"
                        />
                      ) : (
                        <div className="h-32 w-32 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-5xl font-bold border-4 border-indigo-100">
                          {profile.fullName.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <button className="absolute bottom-0 right-0 h-10 w-10 bg-white rounded-full flex items-center justify-center shadow-lg border-2 border-gray-200 hover:bg-gray-50 transition">
                        <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </button>
                    </div>

                    {/* Profile Info */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h2 className="text-2xl font-bold text-gray-900 mb-1">{profile.fullName}</h2>
                          <p className="text-gray-600 mb-2">{profile.email}</p>
                          <span className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm font-medium">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                            </svg>
                            Member
                          </span>
                        </div>
                        <button
                          onClick={() => router.push('/settings/profile')}
                          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                          Edit Profile
                        </button>
                      </div>

                      {/* Profile Details Grid */}
                      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center">
                            <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                          <div>
                            <p className="text-xs text-gray-600">Member Since</p>
                            <p className="text-sm font-semibold text-gray-900">May 15, 2024</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                          </div>
                          <div>
                            <p className="text-xs text-gray-600">Family</p>
                            <p className="text-sm font-semibold text-gray-900">Not joined yet</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center">
                            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                          <div>
                            <p className="text-xs text-gray-600">Status</p>
                            <p className="text-sm font-semibold text-green-600 flex items-center gap-1">
                              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                              Active
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center">
                            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                          <div>
                            <p className="text-xs text-gray-600">Last Login</p>
                            <p className="text-sm font-semibold text-gray-900">May 15, 2024 • 2:45 PM</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Personal Code Card */}
                <div className="bg-white rounded-xl border border-gray-200 p-8 shadow-sm">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="h-12 w-12 rounded-full bg-yellow-100 flex items-center justify-center">
                      <span className="text-2xl">🔑</span>
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">Personal Code</h3>
                      <p className="text-sm text-gray-600">Share this code with family members so they can find you and send relationship requests.</p>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-6 border-2 border-indigo-200">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <span className="text-4xl font-mono font-bold text-indigo-600 tracking-wider">
                            {profile.personalCode}
                          </span>
                          <div className="flex gap-1">
                            <span className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse"></span>
                            <span className="w-2 h-2 bg-purple-400 rounded-full animate-pulse delay-75"></span>
                            <span className="w-2 h-2 bg-pink-400 rounded-full animate-pulse delay-150"></span>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={copyPersonalCode}
                        className="flex items-center gap-2 px-4 py-3 bg-white border-2 border-indigo-300 text-indigo-700 rounded-lg hover:bg-indigo-50 transition font-medium shadow-sm"
                      >
                        {copied ? (
                          <>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <span>Copied!</span>
                          </>
                        ) : (
                          <>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                            </svg>
                            <span>Copy Code</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* How it works */}
                  <div className="mt-8 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-6 border border-blue-100">
                    <div className="flex items-start gap-4 mb-6">
                      <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                        <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900 mb-2">How it works?</h4>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="flex gap-3">
                        <div className="h-8 w-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
                          1
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 mb-1">Share your code</p>
                          <p className="text-sm text-gray-600">Share this code with your family members.</p>
                        </div>
                      </div>

                      <div className="flex gap-3">
                        <div className="h-8 w-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
                          2
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 mb-1">They find you</p>
                          <p className="text-sm text-gray-600">They can search and find you using this code.</p>
                        </div>
                      </div>

                      <div className="flex gap-3">
                        <div className="h-8 w-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
                          3
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 mb-1">Send request</p>
                          <p className="text-sm text-gray-600">They will send you a relationship request to connect.</p>
                        </div>
                      </div>
                    </div>

                    {/* Illustration */}
                    <div className="mt-6 flex justify-end">
                      <div className="relative w-48 h-32">
                        <span className="text-8xl opacity-40">👨‍👩‍👧‍👦</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <button
                    onClick={() => router.push('/settings')}
                    className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition text-left"
                  >
                    <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center mb-4">
                      <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <h3 className="font-bold text-gray-900 mb-1">Account Settings</h3>
                    <p className="text-sm text-gray-600">Manage your preferences</p>
                  </button>

                  <button
                    onClick={() => router.push('/requests')}
                    className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition text-left"
                  >
                    <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center mb-4">
                      <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                    </div>
                    <h3 className="font-bold text-gray-900 mb-1">View Requests</h3>
                    <p className="text-sm text-gray-600">Pending relationships</p>
                  </button>

                  <button
                    onClick={handleLogout}
                    className="bg-white rounded-xl border-2 border-red-200 p-6 shadow-sm hover:shadow-md hover:border-red-300 transition text-left"
                  >
                    <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center mb-4">
                      <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                    </div>
                    <h3 className="font-bold text-red-700 mb-1">Sign Out</h3>
                    <p className="text-sm text-red-600">Log out of your account</p>
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 text-yellow-700">
                No profile data available
              </div>
            )}
          </div>
        </main>
      </div>
    </AuthGuard>
  );
}
