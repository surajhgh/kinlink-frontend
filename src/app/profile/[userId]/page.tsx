'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { usersApi, relationshipsApi } from '@/lib/api';
import { User, Relationship } from '@/lib/types';

interface ProfileData extends Partial<User> {
  livingStatus?: string;
}

interface ProfileResponse {
  user: ProfileData;
  restricted: boolean;
  reason?: string;
}

function PrivacyBadge({ privacy }: { privacy?: string }) {
  const config =
    privacy === 'public'
      ? { label: 'Public', bg: 'bg-emerald-100', text: 'text-emerald-700', icon: '🌍' }
      : privacy === 'family_only'
      ? { label: 'Family Only', bg: 'bg-violet-100', text: 'text-violet-700', icon: '👨‍👩‍👧‍👦' }
      : { label: 'Private', bg: 'bg-gray-100', text: 'text-gray-600', icon: '🔒' };

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${config.bg} ${config.text}`}>
      <span>{config.icon}</span>
      {config.label}
    </span>
  );
}

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div className="group flex flex-col gap-0.5">
      <dt className="text-xs font-semibold uppercase tracking-widest text-slate-400">{label}</dt>
      <dd className="text-sm font-medium text-slate-800">{value}</dd>
    </div>
  );
}

function RelationshipPill({ rel, profileUserId }: { rel: Relationship; profileUserId: string }) {
  const isFrom = rel.fromUserId === profileUserId;
  const other = isFrom ? rel.toUser : rel.fromUser;
  const type = rel.relationshipType.replace(/_/g, ' ');

  return (
    <div className="flex items-center gap-3 rounded-xl border border-violet-100 bg-violet-50 px-4 py-3 transition hover:bg-violet-100">
      {other?.profilePhotoUrl ? (
        <img src={other.profilePhotoUrl} alt={other.fullName} className="h-9 w-9 rounded-full object-cover ring-2 ring-white" />
      ) : (
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-violet-200 text-sm font-bold text-violet-700">
          {other?.fullName?.charAt(0) ?? '?'}
        </div>
      )}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-violet-500">{type}</p>
        {other && (
          <Link href={`/profile/${other.userId}`} className="text-sm font-semibold text-slate-800 hover:text-violet-700 hover:underline">
            {other.fullName}
          </Link>
        )}
      </div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="flex items-center gap-6">
        <div className="h-28 w-28 rounded-full bg-slate-200" />
        <div className="flex-1 space-y-3">
          <div className="h-6 w-48 rounded bg-slate-200" />
          <div className="h-4 w-32 rounded bg-slate-200" />
        </div>
      </div>
      <div className="h-px bg-slate-100" />
      <div className="grid grid-cols-2 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="space-y-1.5">
            <div className="h-3 w-16 rounded bg-slate-200" />
            <div className="h-4 w-28 rounded bg-slate-200" />
          </div>
        ))}
      </div>
    </div>
  );
}

import * as React from 'react';

// ... (rest of imports/helpers keep as is, we replace starting from line 95)
export default function ProfilePage({ params }: { params: Promise<{ userId: string }> }) {
  const resolvedParams = React.use(params);
  const userId = resolvedParams.userId;

  const { data: session, status } = useSession();
  const router = useRouter();
  const [profileResp, setProfileResp] = useState<ProfileResponse | null>(null);
  const [relationships, setRelationships] = useState<Relationship[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const myUserId = (session as any)?.user?.id ?? (session as any)?.user?.userId ?? '';
  const isOwnProfile = myUserId === userId;

  useEffect(() => {
    if (status === 'loading') return;
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }

    const load = async () => {
      try {
        const [prof, rels] = await Promise.all([
          usersApi.getUserProfile(userId),
          relationshipsApi.getVerifiedRelationshipsForUser(userId),
        ]);
        setProfileResp(prof as ProfileResponse);
        setRelationships(rels);
      } catch (err) {
        console.error(err);
        setError('Could not load this profile.');
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, [status, userId, router]);


  const user = profileResp?.user;
  const restricted = profileResp?.restricted ?? false;

  const formatDate = (d?: string | Date) => {
    if (!d) return null;
    try {
      return new Date(d as string).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    } catch {
      return String(d);
    }
  };

  const capitalize = (s?: string) => {
    if (!s) return null;
    return s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-violet-50 to-indigo-50">
      {/* Top nav bar */}
      <nav className="sticky top-0 z-30 border-b border-white/60 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
          <span className="text-sm font-bold tracking-tight text-slate-800">KinLink</span>
          <div className="flex items-center gap-2">
            {isOwnProfile && (
              <Link
                href="/settings/profile"
                className="rounded-lg bg-violet-600 px-4 py-1.5 text-sm font-semibold text-white shadow-sm transition hover:bg-violet-700"
              >
                Edit Profile
              </Link>
            )}
            <Link href="/dashboard" className="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100">
              Dashboard
            </Link>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-4xl px-4 py-8">
        {isLoading ? (
          <div className="rounded-2xl border border-white/60 bg-white p-8 shadow-sm">
            <SkeletonCard />
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-red-100 bg-red-50 p-8 text-center">
            <p className="text-lg font-semibold text-red-700">⚠️ {error}</p>
            <button onClick={() => router.back()} className="mt-4 text-sm text-red-600 underline">
              Go back
            </button>
          </div>
        ) : user ? (
          <div className="space-y-6">
            {/* Hero Card */}
            <div className="relative overflow-hidden rounded-2xl border border-white/60 bg-white shadow-sm">
              {/* Gradient banner */}
              <div className="h-28 w-full bg-gradient-to-r from-violet-500 via-purple-500 to-indigo-500" />

              <div className="px-6 pb-6">
                {/* Avatar + actions row */}
                <div className="flex items-end justify-between" style={{ marginTop: '-3.5rem' }}>
                  <div className="relative">
                    {user.profilePhotoUrl ? (
                      <img
                        src={user.profilePhotoUrl}
                        alt={user.fullName}
                        className="h-28 w-28 rounded-full border-4 border-white object-cover shadow-md"
                      />
                    ) : (
                      <div className="flex h-28 w-28 items-center justify-center rounded-full border-4 border-white bg-gradient-to-br from-violet-400 to-indigo-500 text-4xl font-bold text-white shadow-md">
                        {user.fullName?.charAt(0).toUpperCase()}
                      </div>
                    )}
                    {isOwnProfile && (
                      <Link
                        href="/settings/profile"
                        title="Change photo"
                        className="absolute bottom-1 right-1 flex h-7 w-7 items-center justify-center rounded-full bg-violet-600 text-white shadow transition hover:bg-violet-700"
                      >
                        <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536M9 11l6-6m0 0l3 3M9 11l-4 4v3h3l4-4" />
                        </svg>
                      </Link>
                    )}
                  </div>
                  {user.privacy && <PrivacyBadge privacy={user.privacy} />}
                </div>

                {/* Name */}
                <div className="mt-3">
                  <h1 className="text-2xl font-bold text-slate-900">
                    {user.fullName}
                    {user.nickname && (
                      <span className="ml-2 text-lg font-normal text-slate-400">"{user.nickname}"</span>
                    )}
                  </h1>
                  {user.bio && (
                    <p className="mt-2 text-sm leading-relaxed text-slate-500">{user.bio}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Restricted notice */}
            {restricted && (
              <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-5">
                <span className="text-xl">🔒</span>
                <div>
                  <p className="font-semibold text-amber-800">Limited Profile View</p>
                  <p className="mt-0.5 text-sm text-amber-700">
                    {profileResp?.reason === 'private'
                      ? 'This user has set their profile to private. Only they can see the full details.'
                      : 'This profile is visible to family members only. Join their family to see more.'}
                  </p>
                </div>
              </div>
            )}

            {/* Personal Info */}
            {!restricted && (
              <div className="rounded-2xl border border-white/60 bg-white p-6 shadow-sm">
                <h2 className="mb-5 flex items-center gap-2 text-base font-bold text-slate-800">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-100 text-sm">👤</span>
                  Personal Information
                </h2>
                <dl className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  <InfoRow label="Gender" value={capitalize(user.gender)} />
                  <InfoRow label="Date of Birth" value={formatDate(user.dateOfBirth as any)} />
                  <InfoRow label="Place of Birth" value={user.placeOfBirth} />
                  <InfoRow label="Living Status" value={capitalize(user.livingStatus)} />
                  <InfoRow label="Occupation" value={user.occupation} />
                  <InfoRow label="Education" value={user.education} />
                </dl>
                {/* Empty state if no fields */}
                {!user.gender && !user.dateOfBirth && !user.placeOfBirth && !user.occupation && !user.education && (
                  <p className="text-sm text-slate-400 italic">No personal details added yet.</p>
                )}
              </div>
            )}

            {/* Verified Relationships */}
            {relationships.length > 0 && (
              <div className="rounded-2xl border border-white/60 bg-white p-6 shadow-sm">
                <h2 className="mb-5 flex items-center gap-2 text-base font-bold text-slate-800">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-100 text-sm">👨‍👩‍👧‍👦</span>
                  Verified Family Relationships
                </h2>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {relationships.map((rel) => (
                    <RelationshipPill key={rel.id} rel={rel} profileUserId={userId} />
                  ))}
                </div>
              </div>
            )}

            {/* Own profile CTA */}
            {isOwnProfile && (
              <div className="rounded-2xl border border-violet-200 bg-gradient-to-r from-violet-50 to-indigo-50 p-5">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-semibold text-slate-800">This is your profile</p>
                    <p className="mt-0.5 text-sm text-slate-500">Keep it up to date so your family can find you.</p>
                  </div>
                  <Link
                    href="/settings/profile"
                    className="shrink-0 rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-violet-700"
                  >
                    Edit Profile
                  </Link>
                </div>
              </div>
            )}
          </div>
        ) : null}
      </main>
    </div>
  );
}
