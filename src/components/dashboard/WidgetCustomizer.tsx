import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Palette, Play, Save, Info, AlertCircle, Volume2, Mic, Headphones, IndianRupee, Trash2 } from 'lucide-react';
import { Widget } from '../../types';
import { widgetApi } from '../../lib/api';
import { cn } from '../../lib/utils';
import { toast } from 'sonner';

interface ColorSystemProps {
  config: any;
  onChange: (newConfig: any) => void;
  label?: string;
}

function ColorSystem({ config, onChange, label }: ColorSystemProps) {
  const PRESET_SOLID_COLORS = ['#ea580c', '#3b82f6', '#10b981', '#ef4444', '#a855f7', '#ffffff', '#000000'];
  const PRESET_GRADIENTS = [
    { name: 'None (Solid Color)', value: '' },
    { name: 'Sunset Warm', value: 'linear-gradient(135deg, #FF512F 0%, #DD2476 100%)' },
    { name: 'Neon Cyber', value: 'linear-gradient(135deg, #13f1fc 0%, #0470dc 100%)' },
    { name: 'Deep Space', value: 'linear-gradient(135deg, #a8c0ff 0%, #3f2b96 100%)' },
    { name: 'Emerald Ocean', value: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)' },
    { name: 'Candy Pink', value: 'linear-gradient(135deg, #f7ff00 0%, #db36a4 100%)' },
    { name: 'Midnight Blue', value: 'linear-gradient(135deg, #000428 0%, #004e92 100%)' },
  ];

  return (
    <div className="space-y-6 bg-black/40 p-6 rounded-3xl border border-white/5">
      {label && <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">{label}</label>}
      
      <div className="space-y-3">
         <p className="text-[10px] font-bold uppercase text-zinc-500">Solid Colors</p>
         <div className="flex flex-wrap gap-2">
            {PRESET_SOLID_COLORS.map(color => (
               <button 
                  key={color}
                  onClick={() => onChange({...config, boxGradient: null, backgroundColor: color})}
                  className={cn(
                    "w-9 h-9 rounded-full border-2 transition-transform hover:scale-110", 
                    config.backgroundColor === color && !config.boxGradient ? "border-white ring-2 ring-white/20" : "border-white/10"
                  )}
                  style={{ backgroundColor: color }}
               />
            ))}
            <input 
               type="color"
               value={config.backgroundColor || '#000000'}
               onChange={(e) => onChange({...config, boxGradient: null, backgroundColor: e.target.value})}
               className="w-9 h-9 rounded-full cursor-pointer bg-transparent border border-white/10"
            />
         </div>
      </div>

      <div className="space-y-3">
         <p className="text-[10px] font-bold uppercase text-zinc-500">Gradients</p>
         <select 
           value={config.boxGradient || ''}
           onChange={(e) => onChange({...config, boxGradient: e.target.value || null, backgroundColor: e.target.value ? null : config.backgroundColor})}
           className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 outline-none font-bold text-sm text-white"
         >
           {PRESET_GRADIENTS.map((gradient, idx) => (
             <option key={idx} value={gradient.value}>{gradient.name}</option>
           ))}
         </select>
         {config.boxGradient && (
           <div className="w-full h-8 rounded-xl mt-2" style={{ background: config.boxGradient }} />
         )}
      </div>
    </div>
  );
}

interface Props {
  widget: Widget;
  onUpdate?: () => void;
  onDelete?: () => void;
  allowedTTSVoices?: string[];
  allPlatformVoices?: string[];
}

export default function WidgetCustomizer({ widget, onUpdate, onDelete, allowedTTSVoices = [], allPlatformVoices = [] }: Props) {
  const [config, setConfig] = useState(widget.config);
  const [saving, setSaving] = useState(false);
  const [previewingVoice, setPreviewingVoice] = useState(false);
  const [testAlert, setTestAlert] = useState(false);
  const [ttsPreviewText, setTtsPreviewText] = useState('Hello! This is a preview of your Text-to-Speech alert on ProTip.');
  const [deleting, setDeleting] = useState(false);

  // Use platform voices if available, map to dropdown options
  const fallbackVoices = ['en-US', 'en-GB', 'en-AU', 'fr-FR', 'es-ES', 'ja-JP', 'hi-IN'];
  const voicesToDisplay = allPlatformVoices.length > 0 ? allPlatformVoices : fallbackVoices;

  const handleSave = async () => {
    setSaving(true);
    try {
      await widgetApi.update(widget.id, config);
      toast.success("Widget settings saved!");
      if (onUpdate) onUpdate();
    } catch (err) {
      console.error(err);
      toast.error("Failed to save widget settings.");
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await widgetApi.delete(widget.id);
      toast.success("Widget removed.");
      if (onDelete) onDelete();
    } catch (err: any) {
      console.error(err);
      toast.error(`Deletion failed: ${err.message}`);
    }
    setDeleting(false);
  };

  const handlePreviewVoice = async () => {
    if (previewingVoice || !config.ttsVoice) return;
    setPreviewingVoice(true);
    try {
      const response = await fetch('/api/tts/generate', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ text: ttsPreviewText, voice: config.ttsVoice })
      });
      const data = await response.json();
      if (data.audioUrl) {
         const audio = new Audio(data.audioUrl);
         audio.onended = () => setPreviewingVoice(false);
         audio.onerror = () => setPreviewingVoice(false);
         audio.play();
      } else {
         toast.error("Preview generation failed.");
         setPreviewingVoice(false);
      }
    } catch (err) {
      toast.error("TTS request error.");
      setPreviewingVoice(false);
    }
  };

  const triggerTestAlert = () => {
    setTestAlert(true);
    setTimeout(() => setTestAlert(false), 5000);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Preview */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-black uppercase tracking-widest text-zinc-500 flex items-center gap-2">
            <Play size={12} /> Live Preview
          </h3>
          {widget.type === 'alert' && (
            <button 
              onClick={triggerTestAlert}
              className="text-[10px] font-black uppercase tracking-widest text-[#00FFFF] hover:underline"
            >
              Test Alert
            </button>
          )}
        </div>
        <div className="glass-panel w-full aspect-video rounded-3xl border border-white/5 relative flex items-center justify-center p-8 bg-[#0D0D14]" style={{ overflow: 'hidden' }}>
          
          <div 
             className="relative transition-all" 
             style={{ 
               padding: `${config.padding !== undefined ? config.padding : 16}px`,
               width: config.width ? `${config.width}px` : 'auto',
               height: config.height ? `${config.height}px` : 'auto',
             }}
          >
             {widget.type === 'alert' && (
               <AnimatePresence>
                 {testAlert && (
                   <motion.div 
                      initial={{ y: 20, opacity: 0, scale: 0.9 }}
                      animate={{ y: 0, opacity: 1, scale: 1 }} 
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="bg-black/90 rounded-3xl border border-white/10 text-center shadow-[0_0_40px_rgba(0,0,0,0.8)] relative z-10"
                      style={{ 
                        padding: `${config.padding || 16}px`,
                        fontSize: `${config.alertFontSize || 16}px`,
                        borderRadius: `${config.alertBorderRadius || 24}px`
                      }}
                   >
                     <div className="w-12 h-12 rounded-xl mx-auto mb-4 animate-bounce shadow-[0_0_20px_var(--primary-glow)]" style={{ backgroundColor: config.primaryColor, '--primary-glow': config.primaryColor } as any} />
                     <p className="font-black text-chrome uppercase italic text-lg tracking-tighter">DONOR Name Sent <span style={{ color: config.primaryColor }}>₹50</span></p>
                     <p className="text-sm text-zinc-400 mt-2 italic">"{ttsPreviewText}"</p>
                   </motion.div>
                 )}
                 {!testAlert && <p className="text-[10px] text-zinc-600 uppercase italic font-bold">Waiting for signal...</p>}
               </AnimatePresence>
             )}
             
             {widget.type === 'goal' && (
               <div 
                 className="w-full min-w-[300px] flex flex-col justify-center rounded-[2rem] border border-white/10 shadow-[0_0_30px_rgba(0,0,0,0.5)] transition-all"
                 style={{
                    ...(config.boxGradient ? { background: config.boxGradient } : { backgroundColor: config.backgroundColor || '#000000', opacity: (config.backgroundOpacity !== undefined ? config.backgroundOpacity : 80) / 100 }),
                    padding: `${config.padding !== undefined ? config.padding : 24}px`
                 }}
               >
                  <div className="flex justify-between text-xs font-black uppercase italic tracking-tight mb-4">
                    <span className="text-white">{config.goalTitle || 'Premium Goal'}</span>
                    <span style={{ color: config.primaryColor }}>
                       {Math.round((((config.goalStartingAmount || 0) + (config.currentProgress || 0)) / (config.goalAmount || 1000)) * 100)}%
                    </span>
                  </div>
                  <div className="bg-white/5 rounded-full overflow-hidden p-1 border border-white/5" style={{ height: `${config.progressBarHeight || 20}px` }}>
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, (((config.goalStartingAmount || 0) + (config.currentProgress || 0)) / (config.goalAmount || 1000)) * 100)}%` }}
                      className="h-full rounded-full transition-all relative overflow-hidden" 
                      style={{ background: config.progressGradient || config.progressColor || config.primaryColor }} 
                    >
                       <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-[100%] animate-[shimmer_2s_infinite]" />
                    </motion.div>
                  </div>
                  <div className="flex justify-between text-[10px] font-bold text-zinc-500 uppercase tracking-widest px-1 mt-4">
                     <span>₹{(config.goalStartingAmount || 0) + (config.currentProgress || 0)}</span>
                     <span>₹{config.goalAmount || 1000}</span>
                  </div>
               </div>
             )}

             {widget.type === 'ticker' && (
               <div className="w-full flex-col justify-start relative w-[350px]">
                 <div className="w-full relative flex items-center justify-center">
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="w-full flex items-center justify-between rounded-xl shadow-[0_0_20px_rgba(0,0,0,0.5)] border border-white/10"
                      style={{
                         ...(config.boxGradient ? { background: config.boxGradient } : { backgroundColor: config.backgroundColor || '#000000', opacity: (config.backgroundOpacity !== undefined ? config.backgroundOpacity : 80) / 100 }),
                         padding: `${config.padding !== undefined ? config.padding : 16}px`
                      }}
                    >
                      <div className="flex items-center gap-4">
                        {config.stickyText && (
                            <span className="text-xs font-black text-zinc-500 uppercase tracking-widest bg-white/5 px-2 py-1 rounded-md">{config.stickyText}</span>
                        )}
                        <span className="text-sm font-black text-chrome italic uppercase">User_XYZ</span>
                      </div>
                      <span className="text-sm font-black" style={{ color: config.primaryColor }}>₹100</span>
                    </motion.div>
                 </div>
               </div>
             )}

             {widget.type === 'toptipper' && (
               <div className="w-full flex-col justify-start relative">
                 <div className="w-full relative flex items-center justify-center flex-col">
                    <span className="text-[10px] font-black uppercase tracking-widest mb-2" style={{ color: config.primaryColor }}>👑 King of the Stream</span>
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="px-8 py-4 rounded-3xl border border-white/10 shadow-[0_0_30px_rgba(0,0,0,0.8)]"
                      style={{
                         ...(config.boxGradient ? { background: config.boxGradient } : { backgroundColor: config.backgroundColor || '#0A0A0F', opacity: (config.backgroundOpacity !== undefined ? config.backgroundOpacity : 80) / 100 }),
                         padding: `${config.padding !== undefined ? config.padding : 16}px`
                      }}
                    >
                      <span className="text-2xl font-black text-chrome uppercase tracking-tighter drop-shadow-xl" style={{ filter: `drop-shadow(0 0 10px ${config.primaryColor}80)` }}>Kratos2026</span>
                    </motion.div>
                 </div>
               </div>
             )}
          </div>
        </div>
      </div>

      {/* Settings */}
      <div className="glass-panel p-8 rounded-[2.5rem] border border-white/5 space-y-8 bg-black/40">
         <div className="grid grid-cols-2 gap-6">
            <div className="space-y-4">
              <label className="text-xs font-black uppercase tracking-widest text-zinc-500">Accent Color</label>
              <div className="flex items-center gap-3">
                <input 
                  type="color" 
                  value={config.primaryColor}
                  onChange={(e) => setConfig({ ...config, primaryColor: e.target.value })}
                  className="w-12 h-12 bg-transparent rounded-2xl cursor-pointer border-0"
                />
                <span className="text-sm font-black font-mono uppercase text-zinc-300">{config.primaryColor}</span>
              </div>
            </div>
            
            <div className="space-y-4">
              <label className="text-xs font-black uppercase tracking-widest text-zinc-500">Custom Padding (px)</label>
              <input 
                type="range" min="0" max="50" step="1"
                value={config.padding !== undefined ? config.padding : 16}
                onChange={(e) => setConfig({ ...config, padding: parseInt(e.target.value) })}
                className="w-full h-2 bg-white/10 rounded-full appearance-none cursor-pointer"
              />
              <span className="text-[10px] font-black text-white">{config.padding !== undefined ? config.padding : 16}px</span>
            </div>
         </div>

         <div className="grid grid-cols-2 gap-6 border-t border-white/5 pt-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Width (Length px)</label>
              <input type="number" placeholder="Auto" value={config.width || ''} onChange={(e) => setConfig({...config, width: e.target.value ? parseInt(e.target.value) : undefined})} className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-sm font-bold text-white focus:border-[#00FFFF] outline-none" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Height (Breadth px)</label>
              <input type="number" placeholder="Auto" value={config.height || ''} onChange={(e) => setConfig({...config, height: e.target.value ? parseInt(e.target.value) : undefined})} className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-sm font-bold text-white focus:border-[#00FFFF] outline-none" />
            </div>
         </div>

         {widget.type === 'alert' && (
           <div className="pt-6 border-t border-white/5 space-y-6">
             <h3 className="text-xs font-black uppercase tracking-widest text-zinc-500 flex items-center gap-2"><Headphones size={14} /> TTS Configuration (Server-Side)</h3>
             <div className="space-y-4 bg-black/40 p-6 rounded-3xl border border-white/5">
                <div className="flex items-center gap-4">
                   <div className="flex-1 space-y-2">
                     <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">AI Voice Model</label>
                     <select 
                       value={config.ttsVoice || voicesToDisplay[0]}
                       onChange={(e) => setConfig({...config, ttsVoice: e.target.value})}
                       className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-sm font-bold text-white outline-none"
                     >
                       {voicesToDisplay.map(voiceId => {
                          const isAllowed = allowedTTSVoices.includes(voiceId);
                          return (
                            <option key={voiceId} value={voiceId} disabled={!isAllowed}>
                              {voiceId} {isAllowed ? '' : '(Locked by Plan)'}
                            </option>
                          );
                       })}
                     </select>
                     <p className="text-[9px] text-zinc-500">High-tier voices are unlocked via the Creator Plans tab.</p>
                   </div>
                </div>
                
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Preview Message</label>
                  <div className="flex gap-2">
                     <input 
                       type="text" 
                       value={ttsPreviewText}
                       onChange={(e) => setTtsPreviewText(e.target.value)}
                       className="flex-1 bg-black/40 border border-white/10 rounded-2xl p-4 text-sm font-bold text-white outline-none"
                     />
                     <button 
                       onClick={handlePreviewVoice}
                       disabled={previewingVoice}
                       className="px-6 bg-[#00FFFF]/20 text-[#00FFFF] font-bold rounded-2xl hover:bg-[#00FFFF]/30 transition-all flex items-center justify-center pointer-cursor"
                     >
                        {previewingVoice ? '...' : <Volume2 size={20} />}
                     </button>
                  </div>
                </div>
             </div>
           </div>
         )}

         {/* --- Unified Styling: Color System & Opacity --- */}
         <div className="space-y-8 pt-6 border-t border-white/5">
           <ColorSystem 
             config={config} 
             onChange={setConfig} 
             label="Widget Container Setup" 
           />
           <div className="space-y-4 pt-2">
             <div className="flex justify-between">
               <label className="text-xs font-black uppercase tracking-widest text-zinc-500">Background Opacity</label>
               <span className="text-xs font-black text-white">{config.backgroundOpacity || 80}%</span>
             </div>
             <input 
               type="range" min="0" max="100" step="5"
               value={config.backgroundOpacity !== undefined ? config.backgroundOpacity : 80}
               onChange={(e) => setConfig({ ...config, backgroundOpacity: parseInt(e.target.value) })}
               className="w-full h-2 bg-white/10 rounded-full appearance-none cursor-pointer"
             />
           </div>
         </div>

         {widget.type === 'goal' && (
           <div className="space-y-6 pt-6 border-t border-white/5">
              <div className="space-y-2">
                 <label className="text-xs font-black uppercase tracking-widest text-zinc-500">Goal Title</label>
                 <input 
                   type="text"
                   value={config.goalTitle || ''}
                   onChange={(e) => setConfig({ ...config, goalTitle: e.target.value })}
                   className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 outline-none font-bold text-white"
                 />
               </div>
               
               <div className="space-y-2">
                 <label className="text-xs font-black uppercase tracking-widest text-zinc-500">Liquid Fill Gradient</label>
                 <div className="flex gap-2">
                   <select 
                     value={config.progressGradient || ''}
                     onChange={(e) => setConfig({ ...config, progressGradient: e.target.value, progressColor: config.primaryColor })}
                     className="flex-1 bg-black/40 border border-white/10 rounded-2xl p-4 outline-none font-bold text-sm text-white"
                   >
                     <option value="">Solid Primary Color</option>
                     <option value="linear-gradient(90deg, #f97316, #f59e0b)">Sunset Warm</option>
                     <option value="linear-gradient(90deg, #3b82f6, #8b5cf6)">Neon Cyber</option>
                     <option value="linear-gradient(90deg, #10b981, #3b82f6)">Emerald Ocean</option>
                     <option value="linear-gradient(90deg, #00C9FF 0%, #92FE9D 100%)">Cyber Glitch</option>
                   </select>
                 </div>
               </div>

               <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Progress Bar Size Limit (Height px)</label>
                  <input type="number" placeholder="20" value={config.progressBarHeight || 20} onChange={(e) => setConfig({...config, progressBarHeight: parseInt(e.target.value) || 20})} className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-sm font-bold text-white outline-none" />
               </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-zinc-500">Goal Target</label>
                  <input 
                    type="number"
                    value={config.goalAmount}
                    onChange={(e) => setConfig({ ...config, goalAmount: parseInt(e.target.value) || 0 })}
                    className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 outline-none font-black text-lg text-white"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-zinc-500">Starting Point</label>
                  <input 
                    type="number"
                    value={config.goalStartingAmount || 0}
                    onChange={(e) => setConfig({ ...config, goalStartingAmount: parseInt(e.target.value) || 0 })}
                    className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 outline-none font-black text-lg text-[#00FFFF]"
                  />
                </div>
              </div>
           </div>
         )}
         
         {widget.type === 'ticker' && (
           <div className="space-y-6 pt-6 border-t border-white/5">
              <div className="space-y-4 bg-black/40 p-6 rounded-3xl border border-white/5">
                 <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-zinc-500">Sticky Command Note</label>
                    <input 
                      type="text"
                      placeholder="!protip"
                      value={config.stickyText || ''}
                      onChange={(e) => setConfig({ ...config, stickyText: e.target.value })}
                      className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 outline-none font-bold text-white text-sm"
                    />
                    <p className="text-[9px] text-zinc-500">A static label showing on the left to remind chat.</p>
                 </div>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Number of Tippers to hold</label>
                   <input 
                     type="number"
                     placeholder="5"
                     min="1"
                     max="50"
                     value={config.tickerCount || 5}
                     onChange={(e) => setConfig({ ...config, tickerCount: parseInt(e.target.value) || 5 })}
                     className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 outline-none font-black text-white"
                   />
                </div>
              </div>
           </div>
         )}

         <div className="pt-8 border-t border-white/5 flex gap-4">
            <button 
              onClick={handleSave}
              disabled={saving}
              className="flex-1 bg-gradient-to-r from-[#7C3AED] to-[#00FFFF] text-black py-4 rounded-xl font-black text-sm uppercase tracking-widest hover:opacity-90 transition-all flex items-center justify-center gap-3 shadow-[0_0_20px_rgba(0,255,255,0.2)] active:scale-95"
            >
              <Save size={18} /> {saving ? 'Saving...' : 'Save Component'}
            </button>
            <button 
              onClick={handleDelete}
              disabled={deleting}
              className="px-6 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white border border-red-500/20 rounded-xl transition-all flex items-center justify-center"
              title="Delete Widget"
            >
              <Trash2 size={22} />
            </button>
         </div>
      </div>
   </div>
  );

}
