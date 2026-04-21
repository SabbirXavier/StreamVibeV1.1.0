import React, { useState } from 'react';
import { User, Copy, CheckCircle, Image as ImageIcon, Palette, Save, AlertTriangle, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Streamer } from '../../types';
import { streamerApi } from '../../lib/api';
import { cn } from '../../lib/utils';

export default function BrandingManager({ streamer }: { streamer: Streamer }) {
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [formData, setFormData] = useState({
     displayName: streamer.displayName || '',
     bio: streamer.bio || '',
     accentColor: streamer.accentColor || '#ea580c',
     profileImage: streamer.profileImage || '',
     coverImage: streamer.coverImage || '',
     preferredCurrency: streamer.preferredCurrency || 'INR'
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const publicPageUrl = `${window.location.origin}/t/${streamer.username}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(publicPageUrl);
    setCopiedUrl(true);
    toast.success("Page URL copied to clipboard");
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await streamerApi.update(formData);
      setSaved(true);
      toast.success("Branding updated successfully");
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      toast.error(`Update failed: ${err.message}`);
    }
    setSaving(false);
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    try {
      await streamerApi.delete();
      toast.success("Account deleted successfully.");
      window.location.reload(); 
    } catch (err: any) {
      console.error(err);
      toast.error(`Deletion failed: ${err.message}`);
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
      {/* Settings Form */}
      <div className="space-y-6">
        <div className="glass-panel p-6">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            <User size={24} className="text-[var(--accent)]" /> Your Public Page
          </h3>
          <p className="text-sm text-[var(--text-secondary)] mb-4 leading-relaxed">
            This is the link you share with viewers so they can tip you.
          </p>
          <div className="flex bg-[var(--bg-secondary)] border border-[var(--glass-border)] rounded-xl overflow-hidden focus-within:border-[var(--accent)] transition-colors">
            <div className="px-4 py-3 bg-[var(--bg-primary)] border-r border-[var(--glass-border)] text-[var(--text-secondary)] select-none">
              {window.location.origin}/t/
            </div>
            <input 
              type="text" 
              readOnly 
              value={streamer.username} 
              className="px-4 py-3 bg-transparent text-[var(--text-primary)] w-full outline-none font-bold"
            />
            <button 
              onClick={handleCopy}
              className="px-6 bg-[var(--accent)] text-white hover:bg-opacity-90 transition-colors font-bold uppercase tracking-wide text-sm flex items-center gap-2"
            >
              {copiedUrl ? <><CheckCircle size={16} /> Copied</> : <><Copy size={16} /> Copy</>}
            </button>
          </div>
        </div>

        <div className="glass-panel p-6 space-y-6">
          <h3 className="text-xl font-bold flex items-center gap-2 border-b border-[var(--glass-border)] pb-4">
            <Palette size={24} className="text-[var(--accent)]" /> Branding
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-[var(--text-secondary)]">Display Name</label>
              <input 
                type="text" 
                value={formData.displayName}
                onChange={(e) => setFormData({...formData, displayName: e.target.value})}
                className="w-full bg-[var(--bg-secondary)] border border-[var(--glass-border)] rounded-xl p-3 outline-none focus:border-[var(--accent)] transition-colors text-[var(--text-primary)]"
                placeholder="Awesome Streamer"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-[var(--text-secondary)]">Accent Color</label>
              <div className="flex items-center gap-3">
                <input 
                  type="color" 
                  value={formData.accentColor}
                  onChange={(e) => setFormData({...formData, accentColor: e.target.value})}
                  className="w-12 h-12 bg-transparent rounded-lg cursor-pointer border-0 p-0"
                />
                <span className="font-mono text-sm text-[var(--text-secondary)] uppercase">{formData.accentColor}</span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase text-[var(--text-secondary)]">Bio / Message</label>
            <textarea 
              rows={3}
              value={formData.bio}
              onChange={(e) => setFormData({...formData, bio: e.target.value})}
              className="w-full bg-[var(--bg-secondary)] border border-[var(--glass-border)] rounded-xl p-4 outline-none focus:border-[var(--accent)] transition-colors resize-none text-[var(--text-primary)] leading-relaxed"
              placeholder="Thanks for supporting the stream!"
            />
          </div>

          <div className="space-y-4 pt-4 border-t border-[var(--glass-border)]">
             <div className="flex items-start gap-4 p-4 rounded-xl border border-[var(--accent)] border-opacity-20 bg-[var(--accent)] bg-opacity-5">
                <ImageIcon className="text-[var(--accent)] shrink-0 mt-1" />
                <div>
                   <p className="text-sm font-bold text-[var(--text-primary)] mb-1">Image URLs</p>
                   <p className="text-xs text-[var(--text-secondary)] leading-relaxed">Paste direct links to images (imgur, discord, etc) ending in .png, .jpg, or .gif</p>
                </div>
             </div>
             
             <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-[var(--text-secondary)]">Profile Picture URL</label>
                <input 
                  type="text" 
                  value={formData.profileImage}
                  onChange={(e) => setFormData({...formData, profileImage: e.target.value})}
                  className="w-full bg-[var(--bg-secondary)] border border-[var(--glass-border)] rounded-xl p-3 outline-none focus:border-[var(--accent)] transition-colors text-[var(--text-primary)]"
                  placeholder="https://example.com/profile.png"
                />
             </div>
             
             <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-[var(--text-secondary)]">Cover Banner URL</label>
                <input 
                  type="text" 
                  value={formData.coverImage}
                  onChange={(e) => setFormData({...formData, coverImage: e.target.value})}
                  className="w-full bg-[var(--bg-secondary)] border border-[var(--glass-border)] rounded-xl p-3 outline-none focus:border-[var(--accent)] transition-colors text-[var(--text-primary)]"
                  placeholder="https://example.com/banner.png"
                />
             </div>
             
             <div className="space-y-2">
               <label className="text-xs font-bold uppercase tracking-widest text-neutral-500">Primary Currency</label>
               <select 
                 value={formData.preferredCurrency}
                 onChange={(e) => setFormData({ ...formData, preferredCurrency: e.target.value })}
                 className="w-full bg-[var(--bg-secondary)] border border-[var(--glass-border)] rounded-xl p-3 outline-none focus:border-[var(--accent)] transition-colors text-[var(--text-primary)] appearance-none cursor-pointer"
               >
                 <option value="INR">INR (₹) - Best for India</option>
                 <option value="USD">USD ($) - Global</option>
                 <option value="EUR">EUR (€) - Europe</option>
                 <option value="GBP">GBP (£) - UK</option>
               </select>
             </div>
          </div>

          <button 
            onClick={handleSave}
            disabled={saving}
            className="w-full bg-[var(--accent)] text-white py-4 rounded-xl font-bold uppercase tracking-widest hover:bg-opacity-90 transition-all flex items-center justify-center gap-2"
          >
             {saving ? 'Saving...' : saved ? <><CheckCircle size={18} /> Profile Updated</> : <><Save size={18} /> Save Branding</>}
          </button>
        </div>
        
        <div className="glass-panel p-6 border border-red-500/20">
            <h4 className="text-sm font-bold text-red-500 flex items-center gap-2 mb-2">
              <AlertTriangle size={16} /> Danger Zone
            </h4>
            <p className="text-xs text-neutral-500 mb-4">
              Deleting your account will remove your tipping page and reset all settings. This action cannot be undone.
            </p>
            
            {showDeleteConfirm ? (
              <div className="flex gap-3">
                <button 
                  onClick={handleDeleteAccount}
                  disabled={deleting}
                  className="flex-1 py-3 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold transition-all"
                >
                  {deleting ? 'Deleting...' : 'Confirm Delete'}
                </button>
                <button 
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 py-3 bg-[var(--bg-secondary)] hover:bg-[var(--glass-border)] text-[var(--text-primary)] rounded-xl text-xs font-bold transition-all border border-[var(--glass-border)]"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button 
                onClick={() => setShowDeleteConfirm(true)}
                className="w-full py-3 bg-red-600/10 hover:bg-red-600/20 text-red-500 border border-red-500/20 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2"
              >
                <Trash2 size={14} /> Delete Account
              </button>
            )}
          </div>
      </div>

      {/* Live Preview */}
      <div className="sticky top-24 h-fit">
        <h3 className="text-xs font-bold uppercase text-[var(--text-secondary)] mb-4 tracking-widest pl-2 flex items-center gap-2"><Palette size={14} /> Live Preview</h3>
        <div className="glass-panel overflow-hidden border border-[var(--glass-border)] shadow-2xl relative">
          
          <div className="absolute inset-0 z-0 opacity-10 pointer-events-none" style={{ background: 'radial-gradient(circle at center, var(--accent) 0%, transparent 70%)' }}></div>
          
          {/* Banner Hero */}
          <div 
            className="h-48 w-full bg-[var(--bg-secondary)] relative z-10"
            style={{ 
              backgroundImage: formData.coverImage ? `url(${formData.coverImage})` : `linear-gradient(135deg, ${formData.accentColor}40, var(--bg-primary))`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          >
             <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-primary)] to-transparent" />
          </div>

          {/* Profile Content */}
          <div className="relative -mt-20 px-8 pb-10 z-20">
             <div className="flex gap-6 items-end mb-6">
                <div 
                  className="w-32 h-32 rounded-3xl border-4 border-[var(--bg-primary)] bg-[var(--bg-secondary)] shadow-xl overflow-hidden shrink-0"
                  style={{ backgroundImage: formData.profileImage ? `url(${formData.profileImage})` : 'none', backgroundSize: 'cover', backgroundPosition: 'center' }}
                >
                   {!formData.profileImage && <div className="w-full h-full flex items-center justify-center bg-[var(--bg-secondary)]"><User size={48} className="text-[var(--text-secondary)] opacity-50" /></div>}
                </div>
                <div className="pb-2">
                   <h1 className="text-3xl font-black text-[var(--text-primary)] tracking-tight">{formData.displayName || streamer.username}</h1>
                   <div className="inline-flex items-center gap-2 mt-1 px-3 py-1 bg-[var(--accent)] bg-opacity-20 text-[var(--accent)] rounded-full text-xs font-bold uppercase">
                      <div className="w-2 h-2 rounded-full bg-[var(--accent)] animate-pulse" /> Tips Enabled
                   </div>
                </div>
             </div>

             {formData.bio && (
               <div className="p-4 bg-[var(--bg-secondary)] rounded-2xl border border-[var(--glass-border)] mb-8">
                 <p className="text-[var(--text-secondary)] italic leading-relaxed">"{formData.bio}"</p>
               </div>
             )}

             <div className="space-y-6 max-w-sm">
                <div>
                  <label className="text-xs font-bold uppercase text-[var(--text-secondary)] mb-2 block">Amount</label>
                  <div className="grid grid-cols-3 gap-2 mb-4">
                     {['₹50', '₹100', '₹500'].map(amt => (
                       <div key={amt} className="p-3 rounded-xl border border-[var(--glass-border)] bg-[var(--bg-secondary)] text-center font-black text-[var(--text-primary)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-all cursor-pointer">
                         {amt}
                       </div>
                     ))}
                  </div>
                  <input type="number" placeholder="Enter Custom Amount" className="w-full bg-[var(--bg-secondary)] border border-[var(--glass-border)] rounded-xl p-4 font-black outline-none text-[var(--text-primary)]" disabled />
                </div>
                
                <input type="text" placeholder="Your Name" className="w-full bg-[var(--bg-secondary)] border border-[var(--glass-border)] rounded-xl p-4 font-bold outline-none text-[var(--text-primary)]" disabled />
                <textarea placeholder="Say something nice..." rows={2} className="w-full bg-[var(--bg-secondary)] border border-[var(--glass-border)] rounded-xl p-4 font-medium outline-none resize-none text-[var(--text-primary)]" disabled />
                
                <button 
                  className="w-full py-5 rounded-2xl font-black text-white text-lg uppercase tracking-widest shadow-xl opacity-50 cursor-not-allowed transition-transform transform"
                  style={{ backgroundColor: formData.accentColor }}
                  disabled
                >
                   Support {formData.displayName || streamer.username}
                </button>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
