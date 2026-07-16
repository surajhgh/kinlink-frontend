'use client';

import { useSession } from 'next-auth/react';
import { AuthGuard } from '@/components/AuthGuard';
import { useEffect, useState } from 'react';
import axios from 'axios';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface DashboardStats {
  totalMembers: number;
  pendingRequests: number;
  verifiedMembers: number;
  familyBranches: number;
  personalCode: string;
  upcomingBirthdays: Array<{
    userId: string;
    fullName: string;
    dateOfBirth: string;
    daysUntilBirthday: number;
  }>;
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDashboardStats = async (): Promise<void> => {
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

        const response = await axios.get(`${apiUrl}/families/dashboard`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        setStats(response.data.stats);
      } catch (err) {
        console.error('Failed to fetch dashboard stats:', err);
        setError('Failed to load dashboard');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardStats();
  }, [session, status]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
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
              className="flex items-center gap-3 px-4 py-3 rounded-lg bg-indigo-600 text-white font-medium"
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
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-100 transition relative"
            >
              <span className="text-lg">📬</span>
              <span>Requests</span>
              {stats && stats.pendingRequests > 0 && (
                <span className="absolute right-3 top-3 h-5 w-5 rounded-full bg-purple-600 text-white text-xs flex items-center justify-center">
                  {stats.pendingRequests}
                </span>
              )}
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
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold">
                {session.user?.name?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">{session.user?.name}</p>
                <p className="text-xs text-gray-500 truncate">View Profile</p>
              </div>
              <button className="text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>

          {/* Collapse Button */}
          <button className="p-4 border-t border-gray-200 text-gray-500 hover:text-gray-700 hover:bg-gray-50 transition flex items-center justify-center">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
            </svg>
          </button>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          {/* Top Header */}
          <header className="bg-white border-b border-gray-200 px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                {/* Search can go here if needed */}
              </div>
              <div className="flex items-center gap-4">
                <button className="relative p-2 text-gray-400 hover:text-gray-600 transition">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  {stats && stats.pendingRequests > 0 && (
                    <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500"></span>
                  )}
                </button>
                <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
                  <div className="h-10 w-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold">
                    {session.user?.name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{session.user?.name}</p>
                    <p className="text-xs text-gray-500">Level 5 Family Builder</p>
                  </div>
                </div>
              </div>
            </div>
          </header>

          {/* Content Area */}
          <div className="p-8">
            {isLoading ? (
              <div className="flex justify-center py-16">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
              </div>
            ) : error ? (
              <div className="rounded-lg bg-red-50 p-4 text-red-700 border border-red-200">
                {error}
              </div>
            ) : stats ? (
              <div className="space-y-6">
                {/* Greeting Section */}
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 p-8">
                  <div className="relative z-10">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                      {getGreeting()}, {session.user?.name?.split(' ')[0]} 👋
                    </h1>
                    <p className="text-gray-600">Your family has grown stronger. Keep connecting!</p>
                  </div>
                  {/* Illustration placeholder */}
                  <div className="absolute right-8 top-1/2 -translate-y-1/2 opacity-20">
                    <span className="text-9xl">👨‍👩‍👧‍👦</span>
                  </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {/* Family Members Card */}
                  <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Family Members</p>
                        <p className="text-3xl font-bold text-gray-900">{stats.totalMembers}</p>
                      </div>
                      <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                        <span className="text-2xl">👥</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-green-600">↗ 3 this month</span>
                      <svg className="w-16 h-8" viewBox="0 0 80 30" fill="none">
                        <path d="M 0 15 Q 20 5, 40 10 T 80 5" stroke="#22c55e" strokeWidth="2" fill="none"/>
                      </svg>
                    </div>
                  </div>

                  {/* Pending Requests Card */}
                  <Link
                    href="/requests"
                    className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition group cursor-pointer"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Pending Requests</p>
                        <p className="text-3xl font-bold text-gray-900">{stats.pendingRequests}</p>
                      </div>
                      <div className="h-12 w-12 rounded-full bg-orange-100 flex items-center justify-center">
                        <span className="text-2xl">⏳</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-orange-600">↗ 1 new</span>
                      <svg className="w-16 h-8" viewBox="0 0 80 30" fill="none">
                        <path d="M 0 20 Q 20 15, 40 18 T 80 12" stroke="#f97316" strokeWidth="2" fill="none"/>
                      </svg>
                    </div>
                  </Link>

                  {/* Verified Relationships Card */}
                  <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Verified Relationships</p>
                        <p className="text-3xl font-bold text-gray-900">{stats.verifiedMembers}</p>
                      </div>
                      <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                        <span className="text-2xl">✓</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-green-600">↗ 2 this month</span>
                      <svg className="w-16 h-8" viewBox="0 0 80 30" fill="none">
                        <path d="M 0 25 Q 20 20, 40 15 T 80 8" stroke="#22c55e" strokeWidth="2" fill="none"/>
                      </svg>
                    </div>
                  </div>

                  {/* Family Branches Card */}
                  <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Family Branches</p>
                        <p className="text-3xl font-bold text-gray-900">{stats.familyBranches}</p>
                      </div>
                      <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center">
                        <span className="text-2xl">❄️</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-gray-600">No changes</span>
                      <svg className="w-16 h-8" viewBox="0 0 80 30" fill="none">
                        <path d="M 0 15 L 80 15" stroke="#9ca3af" strokeWidth="2" fill="none"/>
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                  <h2 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h2>
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    <button
                      onClick={() => router.push('/members')}
                      className="flex flex-col items-center gap-2 p-4 rounded-lg hover:bg-purple-50 transition group"
                    >
                      <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 text-xl group-hover:scale-110 transition">
                        👤
                      </div>
                      <span className="text-sm font-medium text-gray-700">Add Member</span>
                    </button>

                    <button
                      onClick={() => router.push('/invitations')}
                      className="flex flex-col items-center gap-2 p-4 rounded-lg hover:bg-blue-50 transition group"
                    >
                      <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-xl group-hover:scale-110 transition">
                        📧
                      </div>
                      <span className="text-sm font-medium text-gray-700">Invite Member</span>
                    </button>

                    <button
                      onClick={() => router.push('/tree')}
                      className="flex flex-col items-center gap-2 p-4 rounded-lg hover:bg-green-50 transition group"
                    >
                      <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center text-green-600 text-xl group-hover:scale-110 transition">
                        🌳
                      </div>
                      <span className="text-sm font-medium text-gray-700">View Tree</span>
                    </button>

                    <button
                      onClick={() => router.push('/birthdays')}
                      className="flex flex-col items-center gap-2 p-4 rounded-lg hover:bg-pink-50 transition group"
                    >
                      <div className="h-12 w-12 rounded-full bg-pink-100 flex items-center justify-center text-pink-600 text-xl group-hover:scale-110 transition">
                        🎂
                      </div>
                      <span className="text-sm font-medium text-gray-700">Birthdays</span>
                    </button>

                    <button
                      onClick={() => router.push('/requests')}
                      className="flex flex-col items-center gap-2 p-4 rounded-lg hover:bg-orange-50 transition group"
                    >
                      <div className="h-12 w-12 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 text-xl group-hover:scale-110 transition">
                        👥
                      </div>
                      <span className="text-sm font-medium text-gray-700">Pending Requests</span>
                    </button>

                    <button
                      onClick={() => router.push('/settings')}
                      className="flex flex-col items-center gap-2 p-4 rounded-lg hover:bg-indigo-50 transition group"
                    >
                      <div className="h-12 w-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 text-xl group-hover:scale-110 transition">
                        ⚙️
                      </div>
                      <span className="text-sm font-medium text-gray-700">Settings</span>
                    </button>
                  </div>
                </div>

                {/* Bottom Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Recent Activities */}
                  <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-lg font-bold text-gray-900">Recent Activities</h2>
                      <button className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">
                        View All
                      </button>
                    </div>
                    <div className="space-y-4">
                      <div className="flex items-start gap-3">
                        <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                          <span className="text-sm">✓</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900">Relationship verified</p>
                          <p className="text-xs text-gray-500">2 minutes ago</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <div className="h-8 w-8 rounded-full bg-pink-100 flex items-center justify-center flex-shrink-0">
                          <span className="text-sm">🎂</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900">Birthday today</p>
                          <p className="text-xs text-gray-500">1 hour ago</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                          <span className="text-sm">👤</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900">New member joined</p>
                          <p className="text-xs text-gray-500">3 hours ago</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                          <span className="text-sm">+</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900">New branch added</p>
                          <p className="text-xs text-gray-500">1 day ago</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Upcoming Birthdays */}
                  <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-lg font-bold text-gray-900">Upcoming Birthdays</h2>
                      <button className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">
                        View All
                      </button>
                    </div>
                    <div className="space-y-4">
                      {stats.upcomingBirthdays && stats.upcomingBirthdays.length > 0 ? (
                        stats.upcomingBirthdays.slice(0, 2).map((birthday) => {
                          const date = new Date(birthday.dateOfBirth);
                          const formattedDate = date.toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                          });
                          return (
                            <div key={birthday.userId} className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                                <span className="text-lg">🎁</span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">
                                  {birthday.fullName}
                                </p>
                                <p className="text-xs text-gray-500">{formattedDate}</p>
                              </div>
                              <button className="text-xs px-3 py-1 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition">
                                Wish
                              </button>
                            </div>
                          );
                        })
                      ) : (
                        <div className="text-center py-4">
                          <span className="text-4xl">🎂</span>
                          <p className="text-sm text-gray-500 mt-2">No upcoming birthdays</p>
                        </div>
                      )}

                      <div className="pt-4 border-t border-gray-100">
                        <div className="flex items-center gap-3 bg-pink-50 rounded-lg p-3">
                          <span className="text-2xl">🎉</span>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">2 birthdays this month</p>
                            <p className="text-xs text-gray-500">Don't forget to wish them!</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Family Tree Preview */}
                  <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-lg font-bold text-gray-900">Family Tree (Preview)</h2>
                      <button
                        onClick={() => router.push('/tree')}
                        className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                      >
                        View Full Tree
                      </button>
                    </div>
                    <div className="flex items-center justify-center py-8">
                      <div className="text-center">
                        <div className="flex justify-center gap-4 mb-4">
                          <div className="flex flex-col items-center">
                            <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center mb-2">
                              <span className="text-lg">👴</span>
                            </div>
                            <p className="text-xs text-gray-600">Grandfather</p>
                          </div>
                        </div>
                        <div className="flex justify-center gap-4 mb-4">
                          <div className="flex flex-col items-center">
                            <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center mb-2">
                              <span className="text-lg">👨</span>
                            </div>
                            <p className="text-xs text-gray-600">Father</p>
                          </div>
                          <div className="flex flex-col items-center">
                            <div className="h-12 w-12 rounded-full bg-pink-100 flex items-center justify-center mb-2">
                              <span className="text-lg">👩</span>
                            </div>
                            <p className="text-xs text-gray-600">Mother</p>
                          </div>
                        </div>
                        <div className="flex justify-center gap-4">
                          <div className="flex flex-col items-center">
                            <div className="h-12 w-12 rounded-full bg-indigo-600 flex items-center justify-center mb-2">
                              <span className="text-lg text-white">You</span>
                            </div>
                            <p className="text-xs text-gray-600 font-medium">
                              {session.user?.name?.split(' ')[0]}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </main>
      </div>
    </AuthGuard>
  );
}
