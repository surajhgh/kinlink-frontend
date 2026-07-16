'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { usersApi } from '@/lib/api';

interface ProfileForm {
  fullName: string;
  nickname: string;
  gender: string;
  dateOfBirth: string;
  placeOfBirth: string;
  bio: string;
  occupation: string;
  education: string;
  privacy: string;
}

const EMPTY_FORM: ProfileForm = {
  fullName: '',
  nickname: '',
  gender: '',
  dateOfBirth: '',
  placeOfBirth: '',
  bio: '',
  occupation: '',
  education: '',
  privacy: 'family_only',
};

function Section({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/60 bg-white p-6 shadow-sm">
      <h2 className="mb-5 flex items-center gap-2.5 text-base font-bold text-slate-800">
        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-violet-100 text-base">{icon}</span>
        {title}
      </h2>
      {children}
    </div>
  );
}

function FormField({
  label,
  required,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-semibold text-slate-700">
        {label}
        {required && <span className="ml-0.5 text-red-500">*</span>}
      </label>
      {children}
      {hint && <p className="text-xs text-slate-400">{hint}</p>}
    </div>
  );
}

const inputClass =
  'w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-medium text-slate-800 outline-none transition focus:border-violet-400 focus:bg-white focus:ring-2 focus:ring-violet-100 placeholder:text-slate-300';

export default function ProfileSettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [userId, setUserId] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [photoPreview, setPhotoPreview] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [form, setForm] = useState<ProfileForm>(EMPTY_FORM);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Redirect if unauthenticated
  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
  }, [status, router]);

  // Load profile on mount
  useEffect(() => {
    if (status !== 'authenticated' || !session) return;

    const load = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
        const accessToken = (session as any).accessToken;
        const res = await fetch(`${apiUrl}/auth/me`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        const { user } = await res.json();

        setUserId(user.userId ?? '');
        setPhotoUrl(user.profilePhotoUrl ?? '');
        setPhotoPreview(user.profilePhotoUrl ?? '');
        setForm({
          fullName: user.fullName ?? '',
          nickname: user.nickname ?? '',
          gender: user.gender ?? '',
          dateOfBirth: user.dateOfBirth ? user.dateOfBirth.split('T')[0] : '',
          placeOfBirth: user.placeOfBirth ?? '',
          bio: user.bio ?? '',
          occupation: user.occupation ?? '',
          education: user.education ?? '',
          privacy: user.privacy ?? 'family_only',
        });
      } catch {
        toast.error('Failed to load profile');
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, [status, session]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  // Handle file selection — show preview immediately
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  // Upload photo (file → Cloudinary or URL fallback)
  const handlePhotoSave = async () => {
    if (!selectedFile && !photoUrl) {
      toast.error('Select a photo or enter a URL first');
      return;
    }
    setIsUploadingPhoto(true);
    try {
      let newUrl: string;
      if (selectedFile) {
        try {
          newUrl = await usersApi.uploadProfilePhotoFile(selectedFile);
          toast.success('Photo uploaded to Cloudinary!');
        } catch (err: any) {
          // If Cloudinary not configured, fallback to manual URL
          if (err?.response?.status === 503 || err?.response?.data?.error?.includes('Cloudinary')) {
            toast.error('Cloudinary not configured. Using URL fallback.');
            if (photoUrl) {
              newUrl = await usersApi.updateProfilePhotoUrl(photoUrl);
            } else {
              setIsUploadingPhoto(false);
              return;
            }
          } else {
            throw err;
          }
        }
      } else {
        newUrl = await usersApi.updateProfilePhotoUrl(photoUrl);
        toast.success('Photo URL saved!');
      }
      setPhotoUrl(newUrl);
      setPhotoPreview(newUrl);
      setSelectedFile(null);
    } catch {
      toast.error('Failed to update photo');
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  // Save profile info
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.fullName.trim()) {
      toast.error('Full name is required');
      return;
    }
    setIsSaving(true);
    try {
      await usersApi.updateProfile(form);
      toast.success('Profile saved successfully!');
    } catch {
      toast.error('Failed to save profile');
    } finally {
      setIsSaving(false);
    }
  };

  if (status === 'loading' || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-violet-50 to-indigo-50">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-violet-600 border-t-transparent" />
          <p className="text-sm font-medium text-slate-500">Loading your profile…</p>
        </div>
      </div>
    );
  }

  const initials = form.fullName?.charAt(0)?.toUpperCase() || '?';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-violet-50 to-indigo-50">
      {/* Top nav */}
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
          <span className="text-sm font-bold tracking-tight text-slate-800">Profile Settings</span>
          <div className="flex items-center gap-2">
            {userId && (
              <Link
                href={`/profile/${userId}`}
                className="rounded-lg px-3 py-1.5 text-sm font-medium text-violet-700 transition hover:bg-violet-50"
              >
                View Profile →
              </Link>
            )}
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-4xl space-y-6 px-4 py-8">
        {/* Page title */}
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Edit Your Profile</h1>
          <p className="mt-1 text-sm text-slate-500">
            Changes you make here are reflected on your public profile page.
          </p>
        </div>

        {/* Photo section */}
        <Section title="Profile Photo" icon="📷">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
            {/* Preview */}
            <div className="flex shrink-0 flex-col items-center gap-3">
              {photoPreview ? (
                <img
                  src={photoPreview}
                  alt="Profile preview"
                  className="h-28 w-28 rounded-full border-4 border-violet-100 object-cover shadow-md"
                />
              ) : (
                <div className="flex h-28 w-28 items-center justify-center rounded-full border-4 border-violet-100 bg-gradient-to-br from-violet-400 to-indigo-500 text-4xl font-bold text-white shadow-md">
                  {initials}
                </div>
              )}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-xs font-semibold text-violet-600 transition hover:text-violet-800 hover:underline"
              >
                Choose file
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileSelect}
                id="photo-file-input"
              />
            </div>

            {/* Controls */}
            <div className="flex flex-1 flex-col gap-4">
              {selectedFile && (
                <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2.5">
                  <svg className="h-4 w-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <p className="text-sm font-medium text-emerald-700">
                    {selectedFile.name}{' '}
                    <span className="text-emerald-500">({(selectedFile.size / 1024).toFixed(0)} KB)</span>
                  </p>
                  <button
                    type="button"
                    onClick={() => { setSelectedFile(null); setPhotoPreview(photoUrl); }}
                    className="ml-auto text-emerald-400 transition hover:text-emerald-600"
                  >
                    ×
                  </button>
                </div>
              )}

              <div>
                <FormField label="Or enter a photo URL" hint="Direct link to an image (https://...)">
                  <input
                    type="url"
                    value={photoUrl}
                    onChange={(e) => { setPhotoUrl(e.target.value); if (!selectedFile) setPhotoPreview(e.target.value); }}
                    placeholder="https://example.com/photo.jpg"
                    className={inputClass}
                    disabled={!!selectedFile}
                  />
                </FormField>
              </div>

              <button
                type="button"
                onClick={handlePhotoSave}
                disabled={isUploadingPhoto || (!selectedFile && !photoUrl)}
                className="self-start rounded-xl bg-violet-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isUploadingPhoto ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                    Uploading…
                  </span>
                ) : (
                  'Save Photo'
                )}
              </button>
            </div>
          </div>
        </Section>

        {/* Personal info form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <Section title="Personal Information" icon="👤">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <FormField label="Full Name" required>
                <input
                  name="fullName"
                  type="text"
                  value={form.fullName}
                  onChange={handleChange}
                  required
                  placeholder="John Doe"
                  className={inputClass}
                />
              </FormField>

              <FormField label="Nickname">
                <input
                  name="nickname"
                  type="text"
                  value={form.nickname}
                  onChange={handleChange}
                  placeholder="Johnny"
                  className={inputClass}
                />
              </FormField>

              <FormField label="Gender">
                <select name="gender" value={form.gender} onChange={handleChange} className={inputClass}>
                  <option value="">Select gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                  <option value="prefer_not_to_say">Prefer not to say</option>
                </select>
              </FormField>

              <FormField label="Date of Birth">
                <input
                  name="dateOfBirth"
                  type="date"
                  value={form.dateOfBirth}
                  onChange={handleChange}
                  className={inputClass}
                />
              </FormField>

              <FormField label="Place of Birth" hint="City, Country">
                <input
                  name="placeOfBirth"
                  type="text"
                  value={form.placeOfBirth}
                  onChange={handleChange}
                  placeholder="Kathmandu, Nepal"
                  className={inputClass}
                />
              </FormField>

              <FormField label="Occupation">
                <input
                  name="occupation"
                  type="text"
                  value={form.occupation}
                  onChange={handleChange}
                  placeholder="Software Engineer"
                  className={inputClass}
                />
              </FormField>

              <FormField label="Education" hint="Highest qualification">
                <input
                  name="education"
                  type="text"
                  value={form.education}
                  onChange={handleChange}
                  placeholder="B.Sc. Computer Science"
                  className={inputClass}
                />
              </FormField>

              <div className="sm:col-span-2">
                <FormField label="Bio" hint="A short description about yourself (max 500 characters)">
                  <textarea
                    name="bio"
                    value={form.bio}
                    onChange={handleChange}
                    rows={4}
                    maxLength={500}
                    placeholder="Tell your family about yourself…"
                    className={`${inputClass} resize-none`}
                  />
                  <p className="text-right text-xs text-slate-300">{form.bio.length}/500</p>
                </FormField>
              </div>
            </div>
          </Section>

          <Section title="Privacy Setting" icon="🔒">
            <p className="mb-4 text-sm text-slate-500">
              Control who can view your profile details. Your name and photo are always visible.
            </p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {[
                {
                  value: 'public',
                  label: 'Public',
                  icon: '🌍',
                  desc: 'Anyone can view your full profile',
                },
                {
                  value: 'family_only',
                  label: 'Family Only',
                  icon: '👨‍👩‍👧‍👦',
                  desc: 'Only people in your family group',
                },
                {
                  value: 'private',
                  label: 'Private',
                  icon: '🔒',
                  desc: 'Only you can see your details',
                },
              ].map((opt) => (
                <label
                  key={opt.value}
                  className={`flex cursor-pointer flex-col gap-1.5 rounded-xl border-2 p-4 transition ${
                    form.privacy === opt.value
                      ? 'border-violet-400 bg-violet-50'
                      : 'border-slate-200 hover:border-violet-200 hover:bg-violet-50/50'
                  }`}
                >
                  <input
                    type="radio"
                    name="privacy"
                    value={opt.value}
                    checked={form.privacy === opt.value}
                    onChange={handleChange}
                    className="sr-only"
                  />
                  <span className="text-xl">{opt.icon}</span>
                  <span className="font-semibold text-slate-800">{opt.label}</span>
                  <span className="text-xs text-slate-500">{opt.desc}</span>
                </label>
              ))}
            </div>
          </Section>

          {/* Save button */}
          <div className="flex items-center justify-between rounded-2xl border border-white/60 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">
              {userId && (
                <>
                  <Link href={`/profile/${userId}`} className="font-medium text-violet-600 hover:underline">
                    View your public profile →
                  </Link>
                </>
              )}
            </p>
            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-8 py-3 text-sm font-semibold text-white shadow-md transition hover:from-violet-700 hover:to-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSaving ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                  Saving…
                </>
              ) : (
                <>
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
