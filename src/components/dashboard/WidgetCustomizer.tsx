import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Palette, Play, Save, Info, AlertCircle, Volume2, Mic, Headphones, IndianRupee, Trash2 } from 'lucide-react';
import { Widget } from '../../types';
import { widgetApi } from '../../lib/api';
import { cn } from '../../lib/utils';
import { toast } from 'sonner';

interface Props {
  widget: Widget;
  onUpdate?: () => void;
  onDelete?: () => void;
}

  export default function WidgetCustomizer({ widget, onUpdate, onDelete }: Props) {
  const [config, setConfig] = useState(widget.config);
  const [saving, setSaving] = useState(false);
  const [previewingVoice, setPreviewingVoice] = useState(false);
  const [testAlert, setTestAlert] = useState(false);
  const [deleting, setDeleting] = useState(false);

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
    // Avoid window.confirm in iframe environments
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
    if (previewingVoice) return;
    if (!window.speechSynthesis) {
      toast.error("TTS not supported in this browser.");
      return;
    }
    
    setPreviewingVoice(true);
    try {
      const voiceName = config.ttsVoice || 'Zephyr';
      const text = `Hello! This is a preview of your alert message. Settings: ${voiceName}.`;
      
      const utterance = new SpeechSynthesisUtterance(text);
      const voices = window.speechSynthesis.getVoices();
      
      // Basic mapping for legacy AI names to system voices
      let voice;
      if (voiceName === 'Charon') {
        voice = voices.find(v => v.name.toLowerCase().includes('male') || v.name.toLowerCase().includes('david'));
      } else if (voiceName === 'Kore' || voiceName === 'Zephyr') {
        voice = voices.find(v => v.name.toLowerCase().includes('female') || v.name.toLowerCase().includes('zira'));
      }

      if (voice) utterance.voice = voice;
      utterance.rate = 0.9;
      utterance.pitch = config.ttsPitch || 1.0;
      utterance.volume = config.ttsVolume || 1.0;
      
      utterance.onend = () => setPreviewingVoice(false);
      utterance.onerror = () => setPreviewingVoice(false);
      
      window.speechSynthesis.speak(utterance);
      
      // Fallback if end never triggers
      setTimeout(() => setPreviewingVoice(false), 5000);
    } catch (err: any) {
      console.error(err);
      toast.error("TTS Preview failed.");
      setPreviewingVoice(false);
    }
  };

  const triggerTestAlert = () => {
    setTestAlert(true);
    setTimeout(() => setTestAlert(false), 5000);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      {/* Preview */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase text-neutral-500 flex items-center gap-2">
            <Play size={12} /> Live Preview
          </h3>
          {widget.type === 'alert' && (
            <button 
              onClick={triggerTestAlert}
              className="text-[10px] font-black uppercase text-orange-500 hover:underline"
            >
              Test Alert
            </button>
          )}
        </div>
        <div 
          className="aspect-video w-full rounded-3xl border border-white/5 relative overflow-hidden flex items-center justify-center p-8 border-dashed border-2"
          style={{ background: 'repeating-conic-gradient(#171717 0% 25%, #0a0a0a 0% 50%) 50% / 20px 20px' }}
        >
          {widget.type === 'alert' && (
            <AnimatePresence>
              {testAlert && (
                <motion.div 
                   initial={{ y: 20, opacity: 0, scale: 0.9 }}
                   animate={{ y: 0, opacity: 1, scale: 1 }} 
                   exit={{ opacity: 0, scale: 0.8 }}
                   className="bg-black/90 p-6 rounded-3xl border border-white/10 text-center shadow-2xl relative z-10"
                >
                  <div className="w-12 h-12 rounded-xl mx-auto mb-4 animate-bounce" style={{ backgroundColor: config.primaryColor }} />
                  <p className="font-black text-white uppercase italic text-lg tracking-tighter pr-1">DONOR Name Sent ₹50</p>
                  <p className="text-sm text-neutral-400 mt-2 italic">"Example message for {widget.type}!"</p>
                </motion.div>
              )}
              {!testAlert && <p className="text-[10px] text-neutral-700 uppercase italic font-bold">Waiting for test signal...</p>}
            </AnimatePresence>
          )}
          
          {widget.type === 'goal' && (
            <div 
              className="w-full max-w-sm space-y-3 p-6 rounded-3xl border border-[var(--glass-border)] shadow-2xl transition-all"
              style={{
                background: config.boxGradient || `rgba(0, 0, 0, ${(config.backgroundOpacity !== undefined ? config.backgroundOpacity : 80) / 100})`,
                backgroundColor: config.boxGradient ? undefined : config.backgroundColor || '#000000',
              }}
            >
               <div className="flex justify-between text-xs font-black uppercase italic tracking-tight">
                 <span className="text-white">{config.goalTitle || 'New PC Goal'}</span>
                 <span style={{ color: config.primaryColor }}>
                    {Math.round((((config.goalStartingAmount || 0) + (config.currentProgress || 0)) / (config.goalAmount || 1000)) * 100)}%
                 </span>
               </div>
               <div className="h-5 bg-white/10 rounded-full overflow-hidden p-1">
                 <motion.div 
                   initial={{ width: 0 }}
                   animate={{ width: `${Math.min(100, (((config.goalStartingAmount || 0) + (config.currentProgress || 0)) / (config.goalAmount || 1000)) * 100)}%` }}
                   className="h-full rounded-full transition-all" 
                   style={{ 
                     background: config.progressGradient || config.progressColor || config.primaryColor,
                     boxShadow: `0 0 15px ${config.progressColor || config.primaryColor}80` 
                   }} 
                 />
               </div>
               <div className="flex justify-between text-[9px] font-bold text-neutral-400 uppercase tracking-widest px-1">
                  <span>₹{(config.goalStartingAmount || 0) + (config.currentProgress || 0)}</span>
                  <span>₹{config.goalAmount || 1000}</span>
               </div>
            </div>
          )}
          {widget.type === 'ticker' && (
            <div className="w-full h-full flex flex-col justify-start overflow-hidden pt-4 relative">
              <div className="w-full max-w-[250px] mx-auto relative h-16 flex items-center justify-center">
                 <AnimatePresence mode="wait">
                    <motion.div 
                      key="preview"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="w-full flex items-center justify-between p-3 rounded-2xl shadow-lg absolute backdrop-blur-md"
                      style={{
                        background: config.boxGradient || `rgba(0,0,0,${(config.backgroundOpacity !== undefined ? config.backgroundOpacity : 80) / 100})`,
                        backgroundColor: config.boxGradient ? undefined : config.backgroundColor || '#000000',
                        border: `1px solid ${config.boxGradient ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.1)'}`
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs uppercase bg-black/50 border border-white/10 text-white">
                          #1
                        </div>
                        <span className="text-base font-black text-white italic uppercase">DONOR_1</span>
                      </div>
                      <span className="text-base font-black" style={{ color: config.primaryColor }}>₹1000</span>
                    </motion.div>
                 </AnimatePresence>
              </div>
            </div>
          )}
        </div>
        {widget.type === 'alert' && (
          <p className="text-[10px] text-neutral-500 italic text-center">Tip: Click "Test Alert" to simulate a real contribution.</p>
        )}
      </div>

      {/* Settings */}
      <div className="space-y-6">
         <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-neutral-500">Accent Color</label>
              <div className="flex items-center gap-2">
                <input 
                  type="color" 
                  value={config.primaryColor}
                  onChange={(e) => setConfig({ ...config, primaryColor: e.target.value })}
                  className="w-10 h-10 bg-transparent rounded cursor-pointer"
                />
                <span className="text-sm font-mono uppercase text-neutral-400">{config.primaryColor}</span>
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-neutral-500">Pause Widget</label>
              <div className="flex items-center h-10">
                <button 
                  onClick={() => setConfig({ ...config, isPaused: !config.isPaused })}
                  className={cn(
                    "w-12 h-6 rounded-full transition-colors relative",
                    config.isPaused ? "bg-amber-500" : "bg-neutral-800"
                  )}
                >
                  <div className={cn(
                    "absolute top-1 w-4 h-4 bg-white rounded-full transition-all",
                    config.isPaused ? "right-1" : "left-1"
                  )} />
                </button>
              </div>
            </div>
         </div>

         <div className="space-y-4 pt-4 border-t border-white/5">
            <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
               <div>
                 <p className="text-sm font-bold">TTS Enabled</p>
                 <p className="text-[10px] text-neutral-500">Read donor messages using AI</p>
               </div>
               <button 
                 onClick={() => setConfig({ ...config, ttsEnabled: !config.ttsEnabled })}
                 className={cn(
                   "w-12 h-6 rounded-full transition-colors relative",
                   config.ttsEnabled ? "bg-orange-600" : "bg-neutral-800"
                 )}
               >
                 <div className={cn(
                   "absolute top-1 w-4 h-4 bg-white rounded-full transition-all",
                   config.ttsEnabled ? "right-1" : "left-1"
                 )} />
               </button>
            </div>

            {config.ttsEnabled && (
               <motion.div 
                 initial={{ opacity: 0, height: 0 }}
                 animate={{ opacity: 1, height: 'auto' }}
                 className="space-y-2"
               >
                  <label className="text-xs font-bold uppercase text-neutral-500 flex items-center gap-2">
                    <Mic size={12} /> AI Voice Selection
                  </label>
                  <div className="flex gap-2">
                    <select 
                      value={config.ttsVoice || 'Zephyr'}
                      onChange={(e) => setConfig({ ...config, ttsVoice: e.target.value })}
                      className="grow bg-neutral-950 border border-white/10 rounded-xl p-3 outline-none text-sm font-bold appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%23666%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C/polyline%3E%3C/svg%3E')] bg-[length:20px] bg-[right_12px_center] bg-no-repeat"
                    >
                      <option value="Zephyr">Deep/Male (System)</option>
                      <option value="Kore">Natural/Female (System)</option>
                      <option value="Puck">Playful/High (System)</option>
                      <option value="Charon">Slow/Serious (System)</option>
                      <option value="Standard">Default OS Voice</option>
                    </select>
                    <button 
                      onClick={handlePreviewVoice}
                      disabled={previewingVoice}
                      className="p-3 bg-white/5 rounded-xl border border-white/5 hover:bg-white/10 transition-all text-orange-500 disabled:opacity-50"
                      title="Play Preview"
                    >
                      {previewingVoice ? <div className="w-5 h-5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" /> : <Volume2 size={20} />}
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <label className="text-[10px] font-bold uppercase text-neutral-500">Pitch</label>
                        <span className="text-[10px] font-mono text-orange-500">{config.ttsPitch || 1.0}</span>
                      </div>
                      <input 
                        type="range" min="0.5" max="2.0" step="0.1"
                        value={config.ttsPitch || 1.0}
                        onChange={(e) => setConfig({ ...config, ttsPitch: parseFloat(e.target.value) })}
                        className="w-full accent-orange-500 h-1 bg-neutral-800 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <label className="text-[10px] font-bold uppercase text-neutral-500">Volume</label>
                        <span className="text-[10px] font-mono text-orange-500">{Math.round((config.ttsVolume || 1.0) * 100)}%</span>
                      </div>
                      <input 
                        type="range" min="0.1" max="1.0" step="0.1"
                        value={config.ttsVolume || 1.0}
                        onChange={(e) => setConfig({ ...config, ttsVolume: parseFloat(e.target.value) })}
                        className="w-full accent-orange-500 h-1 bg-neutral-800 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>
                  </div>
               </motion.div>
            )}
         </div>

         {(widget.type === 'goal' || widget.type === 'ticker') && (
           <div className="space-y-4 pt-4 border-t border-white/5">
              <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-2">
                   <label className="text-xs font-bold uppercase text-neutral-500">Box Background</label>
                   <div className="relative">
                      <input 
                        type="text" 
                        placeholder="#000000 or linear-gradient(...)"
                        value={config.boxGradient || config.backgroundColor || '#000000'}
                        onChange={(e) => setConfig({ ...config, boxGradient: e.target.value, backgroundColor: e.target.value })}
                        className="w-full bg-neutral-950 border border-white/10 rounded-xl p-3 outline-none text-xs font-mono"
                      />
                   </div>
                   <div className="flex gap-2 mt-2">
                     <button onClick={() => setConfig({...config, boxGradient: 'linear-gradient(135deg, rgba(0,0,0,0.8), rgba(20,20,0,0.9))', backgroundColor: ''})} className="text-[10px] bg-white/5 px-2 py-1 rounded hover:bg-white/10">Try Dark Glass</button>
                     <button onClick={() => setConfig({...config, boxGradient: 'linear-gradient(to bottom, rgba(15,23,42,0.9), rgba(0,0,0,0.95))', backgroundColor: ''})} className="text-[10px] bg-white/5 px-2 py-1 rounded hover:bg-white/10">Try Midnight</button>
                   </div>
                 </div>
                 <div className="space-y-2">
                    <div className="flex justify-between">
                       <label className="text-xs font-bold uppercase text-neutral-500">Box Opacity</label>
                       <span className="text-xs font-mono text-neutral-400">{config.backgroundOpacity !== undefined ? config.backgroundOpacity : 80}%</span>
                    </div>
                    <input 
                      type="range" min="0" max="100" step="5"
                      value={config.backgroundOpacity !== undefined ? config.backgroundOpacity : 80}
                      onChange={(e) => setConfig({ ...config, backgroundOpacity: parseInt(e.target.value) })}
                      className="w-full h-2 bg-neutral-800 rounded-lg appearance-none cursor-pointer mt-3"
                    />
                 </div>
              </div>
           </div>
         )}

         {widget.type === 'goal' && (
           <div className="space-y-4 pt-4 border-t border-white/5">
              <div className="space-y-2">
                 <label className="text-xs font-bold uppercase text-neutral-500">Goal Title</label>
                 <input 
                   type="text"
                   value={config.goalTitle}
                   onChange={(e) => setConfig({ ...config, goalTitle: e.target.value })}
                   className="w-full bg-neutral-950 border border-white/10 rounded-xl p-2 outline-none"
                 />
               </div>
               
               <div className="space-y-2">
                 <label className="text-xs font-bold uppercase text-neutral-500">Progress Bar Style</label>
                 <input 
                   type="text" 
                   placeholder="#f97316 or linear-gradient(...)"
                   value={config.progressGradient || config.progressColor || config.primaryColor}
                   onChange={(e) => setConfig({ ...config, progressGradient: e.target.value, progressColor: e.target.value })}
                   className="w-full bg-neutral-950 border border-white/10 rounded-xl p-3 outline-none text-xs font-mono"
                 />
                 <div className="flex gap-2 mt-2">
                   <button onClick={() => setConfig({...config, progressGradient: 'linear-gradient(90deg, #f97316, #f59e0b)'})} className="text-[10px] bg-orange-500/20 text-orange-500 px-2 py-1 rounded">Sunset Warm</button>
                   <button onClick={() => setConfig({...config, progressGradient: 'linear-gradient(90deg, #3b82f6, #8b5cf6)'})} className="text-[10px] bg-blue-500/20 text-blue-500 px-2 py-1 rounded">Neon Cyber</button>
                   <button onClick={() => setConfig({...config, progressGradient: 'linear-gradient(90deg, #10b981, #3b82f6)'})} className="text-[10px] bg-emerald-500/20 text-emerald-500 px-2 py-1 rounded">Emerald Ocean</button>
                 </div>
               </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-neutral-500">Goal Target</label>
                  <input 
                    type="number"
                    value={config.goalAmount}
                    onChange={(e) => setConfig({ ...config, goalAmount: parseInt(e.target.value) || 0 })}
                    className="w-full bg-neutral-950 border border-white/10 rounded-xl p-3 outline-none focus:border-orange-500 transition-colors font-bold"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-neutral-500">Starting Point</label>
                  <input 
                    type="number"
                    title="Amount you started with before widget creation"
                    value={config.goalStartingAmount || 0}
                    onChange={(e) => setConfig({ ...config, goalStartingAmount: parseInt(e.target.value) || 0 })}
                    className="w-full bg-neutral-950 border border-white/10 rounded-xl p-3 outline-none focus:border-orange-500 transition-colors font-bold text-orange-500"
                  />
                </div>
              </div>
           </div>
         )}
         
         {widget.type === 'ticker' && (
           <div className="space-y-4 pt-4 border-t border-white/5">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-neutral-500">Top Tippers to Show</label>
                   <select 
                     value={config.tickerCount || 5}
                     onChange={(e) => setConfig({ ...config, tickerCount: parseInt(e.target.value) || 5 })}
                     className="w-full bg-neutral-950 border border-white/10 rounded-xl p-3 outline-none focus:border-orange-500 transition-colors"
                   >
                     <option value="3">Top 3</option>
                     <option value="5">Top 5</option>
                     <option value="10">Top 10</option>
                     <option value="15">Top 15</option>
                     <option value="20">Top 20</option>
                   </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-neutral-500">Slide Delay (Seconds)</label>
                  <input 
                    type="number"
                    value={config.tickerInterval || 5}
                    onChange={(e) => setConfig({ ...config, tickerInterval: parseInt(e.target.value) || 5 })}
                    className="w-full bg-neutral-950 border border-white/10 rounded-xl p-3 outline-none focus:border-orange-500 transition-colors"
                    step="1"
                  />
                </div>
              </div>
           </div>
         )}

         <div className="pt-4 border-t border-white/5 flex gap-3">
            <button 
              onClick={handleSave}
              disabled={saving}
              className="flex-1 bg-white text-black py-3 rounded-xl font-bold text-sm hover:bg-neutral-200 transition-colors flex items-center justify-center gap-2"
            >
              <Save size={16} /> {saving ? 'Saving...' : 'Save Changes'}
            </button>
            <button 
              onClick={handleDelete}
              disabled={deleting}
              className="px-4 bg-red-600/10 hover:bg-red-600 text-red-500 hover:text-white border border-red-500/20 rounded-xl transition-all flex items-center justify-center"
              title="Delete Widget"
            >
              <Trash2 size={18} />
            </button>
         </div>
      </div>
   </div>
  );
}
