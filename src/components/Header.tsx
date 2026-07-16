'use client';

import Link from 'next/link';
import { useSession } from 'next-auth/react';

export default function Header() {
  const { data: session } = useSession();

  return (
    <header className="bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="text-2xl font-bold text-indigo-600">👨‍👩‍👧‍👦</div>
            <span className="text-xl font-bold text-gray-900">KinLink</span>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {session ? (
              <>
                <Link href="/dashboard" className="text-gray-600 hover:text-indigo-600 transition">
                  Dashboard
                </Link>
                <Link href="/tree" className="text-gray-600 hover:text-indigo-600 transition">
                  Family Tree
                </Link>
                <Link href="/settings" className="text-gray-600 hover:text-indigo-600 transition">
                  Settings
                </Link>
                <Link href="/profile" className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition">
                  Profile
                </Link>
              </>
            ) : (
              <>
                <Link href="/" className="text-gray-600 hover:text-indigo-600 transition">
                  Home
                </Link>
                <Link href="/login" className="text-gray-600 hover:text-indigo-600 transition">
                  Log In
                </Link>
                <Link
                  href="/signup"
                  className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition"
                >
                  Sign Up
                </Link>
              </>
            )}
          </nav>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500">
              <span className="sr-only">Open main menu</span>
              <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
