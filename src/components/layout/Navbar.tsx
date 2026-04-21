import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'motion/react';
import { toast } from 'sonner';
import { LayoutDashboard, LogOut, Zap, Moon, Sun } from 'lucide-react';
import { cn } from '../../lib/utils';
import { auth } from '../../lib/firebase';
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut, User } from 'firebase/auth';
import { adminApi } from '../../lib/api';

export default function Navbar() {
  const [platformName, setPlatformName] = useState('StreamVibe');
  const [user, setUser] = useState<User | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const location = useLocation();
  const isDashboard = location.pathname.startsWith('/dashboard');

  useEffect(() => {
    // Check initial theme
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') {
      setIsDarkMode(false);
      document.documentElement.classList.remove('dark');
    } else {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    }

    const unsubAuth = onAuthStateChanged(auth, (u) => {
      const nativeToken = localStorage.getItem('nativeToken');
      if (nativeToken) {
        setUser({ isNative: true } as any);
      } else {
        setUser(u);
      }
    });

    adminApi.getSettings().then(settings => {
      if (settings?.platformName) {
        setPlatformName(settings.platformName);
      }
    }).catch(err => console.error("Could not fetch settings", err));
    return () => {
      unsubAuth();
    };
  }, []);

  const toggleTheme = () => {
    if (isDarkMode) {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
      setIsDarkMode(false);
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
      setIsDarkMode(true);
    }
  };

  const handleSignIn = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (err: any) {
      if (err.code === 'auth/unauthorized-domain') {
        toast.error(`LOGIN BLOCKED: This domain is not authorized in your Firebase console.\n\n1. Go to Google Cloud / Firebase Console\n2. Auth > Settings > Authorized Domains\n3. Add: ${window.location.host}`);
      } else {
        toast.error("Login Error: " + err.message);
      }
    }
  };

  const handleSignOut = () => {
    localStorage.removeItem('nativeToken');
    signOut(auth);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-[var(--glass-border)] glass-panel bg-[var(--glass-bg)]">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="w-9 h-9 bg-orange-600 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform shadow-lg shadow-orange-600/20">
             <span className="text-white font-black text-xl italic leading-none select-none pr-0.5">
               {platformName.charAt(0).toUpperCase()}
             </span>
          </div>
          <span className="font-bold text-xl tracking-tight bg-gradient-to-r from-orange-500 to-orange-300 bg-clip-text text-transparent italic uppercase pr-1">
            {platformName}
          </span>
        </Link>

        <div className="flex items-center gap-4 sm:gap-6">
          <button 
            onClick={toggleTheme}
            className="p-2 rounded-full hover:bg-[var(--text-primary)] hover:text-[var(--bg-primary)] transition-colors text-[var(--text-secondary)]"
            title="Toggle Theme"
          >
            {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          {user ? (
            <div className="flex items-center gap-4">
               <Link 
                to="/dashboard" 
                className={cn(
                  "text-sm font-bold transition-colors hover:text-orange-500 flex items-center gap-2",
                  isDashboard ? "text-orange-500" : "text-[var(--text-primary)]"
                )}
              >
                <LayoutDashboard size={16} />
                <span className="hidden sm:inline">Dashboard</span>
              </Link>
              <button 
                onClick={handleSignOut}
                className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                title="Sign Out"
              >
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <button 
              onClick={handleSignIn}
              className="bg-[var(--text-primary)] text-[var(--bg-primary)] px-4 py-2 rounded-full text-sm font-semibold hover:opacity-80 transition-opacity shadow-lg active:scale-95"
            >
              Sign In
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
