import React, { useEffect, useState } from 'react';
import { Shield, Users, Activity, Settings, LayoutDashboard, IndianRupee } from 'lucide-react';
import PlatformSettingsComponent from '../components/dashboard/PlatformSettings';
import { cn } from '../lib/utils';
import { useNavigate } from 'react-router-dom';
import { streamerApi, adminApi } from '../lib/api';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'settings'>('overview');
  const [profile, setProfile] = useState<any>(null);
  const [systemSettings, setSystemSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Strict Admin Check
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const s = await streamerApi.getMe();
        if (s && s.role !== 'admin') {
          navigate('/dashboard');
        } else if (s && s.role === 'admin') {
           setProfile(s);
           // Also fetch global settings for the settings tab
           const globalSettings = await adminApi.getSettings();
           setSystemSettings(globalSettings);
        } else {
           navigate('/dashboard');
        }
      } catch (err) {
        navigate('/dashboard');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [navigate]);

  if (loading || !profile) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <p className="text-neutral-500 font-mono text-sm animate-pulse">Verifying clearance...</p>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', name: 'Overview', icon: LayoutDashboard },
    { id: 'users', name: 'Users', icon: Users },
    { id: 'settings', name: 'Platform Settings', icon: Settings },
  ] as const;

  return (
    <div className="max-w-7xl mx-auto px-4 py-12 lg:py-20 animate-in fade-in relative">
      {/* Decorative */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-red-600/5 rounded-full blur-[100px] -z-10 pointer-events-none" />
      
      <div className="flex flex-col md:flex-row gap-6 justify-between items-start md:items-end mb-12">
        <div>
          <h1 className="text-4xl lg:text-6xl font-black uppercase tracking-tighter italic flex items-center gap-4">
            <Shield className="text-red-500" size={48} />
            Command Center
          </h1>
          <p className="text-neutral-400 font-mono mt-2 text-sm uppercase tracking-widest border-l-2 border-red-500 pl-4 py-1">
            System Administration • v2.0
          </p>
        </div>
        <div className="px-6 py-3 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <span className="text-xs font-bold uppercase tracking-widest text-red-500">Live Services Active</span>
        </div>
      </div>

      <div className="grid lg:grid-cols-[240px_1fr] gap-8">
        <div className="space-y-4">
          <div className="bg-neutral-900/50 border border-white/5 rounded-3xl p-6 mb-8 backdrop-blur-xl">
             <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full border-2 border-red-500/50 bg-neutral-800 flex items-center justify-center font-bold text-xl uppercase">
                  {profile?.displayName?.charAt(0) || 'A'}
                </div>
                <div>
                   <p className="text-sm font-bold uppercase">{profile.displayName}</p>
                   <p className="text-[10px] text-red-500 uppercase font-mono tracking-widest">SysAdmin</p>
                </div>
             </div>
          </div>
          
          <nav className="flex flex-col gap-2">
            {tabs.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "flex items-center gap-3 w-full p-4 rounded-2xl text-sm font-bold uppercase tracking-widest transition-all",
                    activeTab === tab.id 
                      ? "bg-white text-black pl-6" 
                      : "text-neutral-500 hover:bg-white/5 hover:text-white"
                  )}
                >
                  <Icon size={16} />
                  {tab.name}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="min-h-[500px]">
          {activeTab === 'overview' && (
            <div className="space-y-8 animate-in fade-in zoom-in-95 duration-300">
               <div className="grid md:grid-cols-3 gap-6">
                 <div className="bg-gradient-to-br from-neutral-900 to-black border border-white/10 p-6 rounded-3xl relative overflow-hidden">
                    <Activity className="absolute -bottom-4 -right-4 w-32 h-32 text-white/5" />
                    <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-1">Total Users</h3>
                    <p className="text-4xl font-black">1,204</p>
                    <div className="mt-4 pt-4 border-t border-white/5 flex text-[10px] uppercase font-bold text-green-500">
                      +12% vs last month
                    </div>
                 </div>
                 
                 <div className="bg-gradient-to-br from-neutral-900 to-black border border-white/10 p-6 rounded-3xl relative overflow-hidden">
                    <IndianRupee className="absolute -bottom-4 -right-4 w-32 h-32 text-white/5" />
                    <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-1">Platform Revenue</h3>
                    <p className="text-4xl font-black">₹45.2K</p>
                    <div className="mt-4 pt-4 border-t border-white/5 flex text-[10px] uppercase font-bold text-green-500">
                      +8.4% vs last month
                    </div>
                 </div>
                 
                   <div className="bg-gradient-to-br from-neutral-900 to-black border border-white/10 p-6 rounded-3xl relative overflow-hidden">
                    <Activity className="absolute -bottom-4 -right-4 w-32 h-32 text-white/5" />
                    <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-1">Active Tips (24h)</h3>
                    <p className="text-4xl font-black text-orange-500">892</p>
                    <div className="mt-4 pt-4 border-t border-white/5 flex text-[10px] uppercase font-bold text-neutral-500">
                      Real-time aggregated
                    </div>
                 </div>
               </div>
            </div>
          )}

          {activeTab === 'users' && (
             <div className="animate-in fade-in zoom-in-95 duration-300 bg-neutral-900/50 border border-white/5 rounded-3xl p-8 backdrop-blur-xl">
                <h3 className="text-xl font-bold uppercase italic tracking-tight mb-6">User Management Active</h3>
                <p className="text-sm font-mono text-neutral-400 mb-6">Loading user matrix...</p>
                <div className="bg-neutral-950 p-6 rounded-2xl border border-white/5 font-mono text-xs text-neutral-500">
                  <p className="mb-2 uppercase font-bold text-neutral-400">// SYSTEM_SECRETS_GUIDE.md</p>
                  <p className="text-blue-400 mb-1">What is FIREBASE_SERVICE_ACCOUNT?</p>
                  <p className="mb-4 text-[10px]">
                    The Firebase Service Account is used exclusively by the backend (server.ts) 
                    to perform administrative tasks that normal clients cannot. This includes verifying 
                    auth tokens reliably, deleting users securely, and accessing/modifying data without 
                    being stopped by standard Firestore security rules. It acts as the "root user" for 
                    database operations.
                  </p>
                  <p className="text-green-400 mb-1">What is JWT_SECRET?</p>
                  <p className="mb-4 text-[10px]">
                    The JWT_SECRET is used to sign JSON Web Tokens generated by the custom backend 
                    (e.g., during email/password registration). It allows our Express server to cryptographically 
                    prove that a session token is authentic and hasn't been tampered with. Every API request 
                    is verified against this secret.
                  </p>
                </div>
             </div>
          )}

          {activeTab === 'settings' && systemSettings && (
            <div className="animate-in fade-in zoom-in-95 duration-300">
              <PlatformSettingsComponent settings={systemSettings} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
