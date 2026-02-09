'use client';

import { useState, useRef, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { User, LogOut, Settings, Shield, ChevronDown, Trash2, CheckCircle } from 'lucide-react';
import { clearAllCaches } from '@/hooks/useDashboardData';

export function UserMenu() {
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const [cacheCleared, setCacheCleared] = useState(false);
  const [clearingCache, setClearingCache] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!session?.user) {
    return null;
  }

  const isAdmin = session.user.role === 'ADMIN';

  const handleSignOut = () => {
    signOut({ callbackUrl: '/login' });
  };

  const handleClearCache = async () => {
    setClearingCache(true);
    try {
      await clearAllCaches();
      setCacheCleared(true);
      // Reset the success message after 2 seconds
      setTimeout(() => {
        setCacheCleared(false);
      }, 2000);
    } catch (error) {
      console.error('Error clearing cache:', error);
    } finally {
      setClearingCache(false);
    }
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition-colors"
      >
        <div className="w-6 h-6 bg-slate-600 rounded-full flex items-center justify-center">
          <User className="h-3.5 w-3.5 text-slate-300" />
        </div>
        <span className="text-sm text-slate-200 hidden sm:inline">
          {session.user.name || session.user.email?.split('@')[0]}
        </span>
        <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-lg shadow-lg border border-slate-200 overflow-hidden z-50">
          {/* User Info */}
          <div className="px-4 py-3 border-b border-slate-100">
            <p className="text-sm font-medium text-slate-900 truncate">
              {session.user.name || 'No name'}
            </p>
            <p className="text-xs text-slate-500 truncate">{session.user.email}</p>
            <div className="mt-1.5 flex items-center gap-1.5">
              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                session.user.role === 'ADMIN'
                  ? 'bg-purple-100 text-purple-700'
                  : session.user.role === 'MANAGER'
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-slate-100 text-slate-700'
              }`}>
                {session.user.role}
              </span>
            </div>
          </div>

          {/* Menu Items */}
          <div className="py-1">
            {isAdmin && (
              <Link
                href="/admin/users"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <Shield className="h-4 w-4 text-slate-400" />
                User Management
              </Link>
            )}
            {/* Target Settings - 只對 ADMIN 和 MANAGER 顯示 */}
            {(session.user.role === 'ADMIN' || session.user.role === 'MANAGER') && (
              <Link
                href="/settings/targets"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <Settings className="h-4 w-4 text-slate-400" />
                Target Settings
              </Link>
            )}

            {/* Clear Cache */}
            <button
              onClick={handleClearCache}
              disabled={clearingCache}
              className="flex items-center gap-2 w-full px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50"
            >
              {cacheCleared ? (
                <>
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-green-600">Cache Cleared!</span>
                </>
              ) : (
                <>
                  <Trash2 className={`h-4 w-4 text-slate-400 ${clearingCache ? 'animate-spin' : ''}`} />
                  {clearingCache ? 'Clearing...' : 'Clear Cache'}
                </>
              )}
            </button>
          </div>

          {/* Sign Out */}
          <div className="py-1 border-t border-slate-100">
            <button
              onClick={handleSignOut}
              className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
