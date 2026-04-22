import React, { useEffect, useState } from 'react';
import { ShieldCheck, Search, Users, CreditCard, Calendar } from 'lucide-react';
import { adminApi, streamerApi } from '../lib/api';

export default function AdminDashboard() {
  const [streamers, setStreamers] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi.listStreamers()
      .then(setStreamers)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filteredStreamers = streamers.filter(s => 
    s.username.toLowerCase().includes(search.toLowerCase()) || 
    s.email?.toLowerCase().includes(search.toLowerCase())
  );

  const mrr = streamers.reduce((acc, curr) => {
    if (curr.planId === 'legend' && !curr.isTrial) return acc + 999;
    if (curr.planId === 'elite') return acc + 599;
    if (curr.planId === 'rookie') return acc + 299;
    return acc;
  }, 0);

  if (loading) {
    return <div className="min-h-screen pt-32 flex justify-center text-cyan-400">Loading Secure Dashboard...</div>;
  }

  return (
    <main className="pt-32 pb-20 max-w-7xl mx-auto px-4">
       <div className="flex items-center gap-4 mb-10">
         <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 shadow-[0_0_20px_rgba(0,255,255,0.1)]">
            <ShieldCheck size={32} />
         </div>
         <div>
           <h1 className="text-4xl font-black text-chrome">Director Interface</h1>
           <p className="text-zinc-400">Streamer CRM & Platform Economics</p>
         </div>
       </div>

       <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
         <MetricCard title="Total Creators" value={streamers.length} icon={<Users />} />
         <MetricCard title="Active Trials" value={streamers.filter(s => s.isTrial).length} icon={<Calendar />} />
         <MetricCard title="Platform MRR" value={`₹${mrr}`} icon={<CreditCard />} highlight />
       </div>

       <div className="glass-panel p-6 rounded-3xl">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-white">Creator Hub</h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
              <input 
                 type="text" 
                 placeholder="Search by username or email..." 
                 className="bg-[#1A1A24] border border-white/10 rounded-full py-2 pl-10 pr-4 text-sm w-64 focus:outline-none focus:border-cyan-500/50 text-white placeholder-zinc-500"
                 value={search}
                 onChange={e => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-zinc-400">
              <thead className="text-xs uppercase bg-[#1A1A24] text-zinc-500">
                <tr>
                  <th className="px-6 py-4 rounded-tl-xl">Streamer</th>
                  <th className="px-6 py-4">Status / Plan</th>
                  <th className="px-6 py-4">Platform Margin</th>
                  <th className="px-6 py-4 rounded-tr-xl">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredStreamers.map(s => (
                  <tr key={s.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4 font-medium text-white flex flex-col">
                       <span>{s.displayName || s.username}</span>
                       <span className="text-xs text-zinc-500">@{s.username}</span>
                    </td>
                    <td className="px-6 py-4">
                      {s.isTrial ? (
                        <span className="px-2 py-1 rounded bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-bold uppercase tracking-wider">Legend Trial</span>
                      ) : (
                        <span className="px-2 py-1 rounded bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold uppercase tracking-wider">{s.planId || 'Free'}</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                       0% Fees 
                    </td>
                    <td className="px-6 py-4">
                       <button className="text-cyan-400 hover:text-cyan-300 transition-colors bg-cyan-500/10 px-3 py-1.5 rounded-lg border border-cyan-500/20">Manage</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
       </div>
    </main>
  );
}

function MetricCard({ title, value, icon, highlight }: { title: string, value: string | number, icon: any, highlight?: boolean }) {
  return (
    <div className={`glass-panel p-6 rounded-[2rem] flex items-center gap-6 ${highlight ? 'border-cyan-500/30 bg-cyan-500/5' : ''}`}>
       <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${highlight ? 'bg-cyan-500/20 text-cyan-400' : 'bg-white/5 text-zinc-400'}`}>
          {icon}
       </div>
       <div>
         <p className="text-sm font-medium text-zinc-500 mb-1">{title}</p>
         <h3 className={`text-3xl font-black ${highlight ? 'text-white' : 'text-zinc-200'}`}>{value}</h3>
       </div>
    </div>
  )
}
