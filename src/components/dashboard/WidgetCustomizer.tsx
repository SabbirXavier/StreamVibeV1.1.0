import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Palette, Play, Save, Info, AlertCircle, Volume2, Mic, Headphones, IndianRupee, Trash2 } from 'lucide-react';
import { Widget } from '../../types';
import { widgetApi } from '../../lib/api';
import { cn } from '../../lib/utils';
import { toast } from 'sonner';
import { GlassCard } from '../ui/GlassCard';

interface ColorSystemProps {
  config: any;
  onChange: (newConfig: any) => void;
  label?: string;
}

function ColorSystem({ config, onChange, label }: ColorSystemProps) {
  const PRESET_SOLID_COLORS = ['#ea580c', '#3b82f6', '#10b981', '#ef4444', '#a855f7', '#ffffff', '#000000'];
  const PRESET_GRADIENTS = [
    'linear-gradient(135deg, #FF512F 0%, #DD2476 100%)',
    'linear-gradient(135deg, #13f1fc 0%, #0470dc 100%)',
    'linear-gradient(135deg, #a8c0ff 0%, #3f2b96 100%)',
    'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
    'linear-gradient(135deg, #f7ff00 0%, #db36a4 100%)',
    'linear-gradient(135deg, #000428 0%, #004e92 100%)',
  ];

  return (
    <div className="space-y-4">
      {label && <label className="text-xs font-black uppercase tracking-widest text-neutral-400">{label}</label>}
      
      <div className="space-y-2">
         <p className="text-[10px] font-bold uppercase text-neutral-600">Solid Colors</p>
         <div className="flex flex-wrap gap-2">
            {PRESET_SOLID_COLORS.map(color => (
               <button 
                  key={color}
                  onClick={() => onChange({...config, boxGradient: null, backgroundColor: color})}
                  className={cn("w-8 h-8 rounded-full border-2", config.backgroundColor === color && !config.boxGradient ? "border-white" : "border-white/10")}
                  style={{ backgroundColor: color }}
               />
            ))}
            <input 
               type="color"
               value={config.backgroundColor || '#000000'}
               onChange={(e) => onChange({...config, boxGradient: null, backgroundColor: e.target.value})}
               className="w-8 h-8 rounded-full cursor-pointer bg-transparent border border-white/10"
            />
         </div>
      </div>

      <div className="space-y-2">
         <p className="text-[10px] font-bold uppercase text-neutral-600">Gradients</p>
         <div className="grid grid-cols-3 gap-2">
            {PRESET_GRADIENTS.map((gradient, idx) => (
               <button
                  key={idx}
                  onClick={() => onChange({...config, boxGradient: gradient, backgroundColor: null})}
                  className={cn("w-full h-10 rounded-xl border-2 transition-transform hover:scale-105", config.boxGradient === gradient ? "border-white" : "border-white/10")}
                  style={{ background: gradient }}
               />
            ))}
         </div>
      </div>
    </div>
  );
}

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
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Preview */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-black uppercase tracking-widest text-neutral-500 dark:text-neutral-400 flex items-center gap-2">
            <Play size={12} /> Live Preview
          </h3>
          {widget.type === 'alert' && (
            <button 
              onClick={triggerTestAlert}
              className="text-[10px] font-black uppercase tracking-widest text-orange-600 dark:text-orange-500 hover:underline"
            >
              Test Alert
            </button>
          )}
        </div>
        <div className="glass-panel w-full aspect-video rounded-3xl border border-black/5 dark:border-white/5 relative overflow-hidden flex items-center justify-center p-8 border-dashed">
          {widget.type === 'alert' && (
            <AnimatePresence>
              {testAlert && (
                <motion.div 
                   initial={{ y: 20, opacity: 0, scale: 0.9 }}
                   animate={{ y: 0, opacity: 1, scale: 1 }} 
                   exit={{ opacity: 0, scale: 0.8 }}
                   className="bg-black/90 p-6 rounded-3xl border border-white/10 text-center shadow-2xl relative z-10"
                   style={{ 
                     padding: `${config.alertPadding || 16}px`,
                     fontSize: `${config.alertFontSize || 16}px`,
                     borderRadius: `${config.alertBorderRadius || 24}px`
                   }}
                >
                  <div className="w-12 h-12 rounded-xl mx-auto mb-4 animate-bounce" style={{ backgroundColor: config.primaryColor }} />
                  <p className="font-black text-white uppercase italic text-lg tracking-tighter pr-1">DONOR Name Sent ₹50</p>
                  <p className="text-sm text-neutral-400 mt-2 italic">"Example message for {widget.type}!"</p>
                </motion.div>
              )}
              {!testAlert && <p className="text-[10px] text-neutral-700 dark:text-neutral-500 uppercase italic font-bold">Waiting for test signal...</p>}
            </AnimatePresence>
          )}
          
          {widget.type === 'goal' && (
            <div 
              className="w-full max-w-sm space-y-4 p-8 rounded-[2rem] border border-black/5 dark:border-white/10 shadow-2xl transition-all"
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
               <div className="h-6 bg-black/20 dark:bg-white/10 rounded-full overflow-hidden p-1">
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
               <div className="flex justify-between text-[10px] font-bold text-neutral-400 uppercase tracking-widest px-1">
                  <span>₹{(config.goalStartingAmount || 0) + (config.currentProgress || 0)}</span>
                  <span>₹{config.goalAmount || 1000}</span>
               </div>
            </div>
          )}
          {widget.type === 'ticker' && (
            <div className="w-full h-full flex flex-col justify-start overflow-hidden pt-4 relative">
              <div className="w-full max-w-[300px] mx-auto relative h-20 flex items-center justify-center">
                 <AnimatePresence mode="wait">
                    <motion.div 
                      key="preview"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="w-full flex items-center justify-between p-4 rounded-3xl shadow-lg absolute border border-black/5 dark:border-white/10"
                      style={{
                        background: config.boxGradient || `rgba(0,0,0,${(config.backgroundOpacity !== undefined ? config.backgroundOpacity : 80) / 100})`,
                        backgroundColor: config.boxGradient ? undefined : config.backgroundColor || '#000000',
                      }}
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center font-black text-sm uppercase bg-black/20 dark:bg-white/10 border border-black/5 dark:border-white/10 text-black dark:text-white">
                          #1
                        </div>
                        <span className="text-lg font-black text-black dark:text-white italic uppercase">DONOR_1</span>
                      </div>
                      <span className="text-lg font-black" style={{ color: config.primaryColor }}>₹1000</span>
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
      <div className="glass-panel p-8 rounded-[2.5rem] border border-black/5 dark:border-white/5 space-y-8">
         <div className="grid grid-cols-2 gap-6">
            <div className="space-y-4">
              <label className="text-xs font-black uppercase tracking-widest text-neutral-500 dark:text-neutral-400">Accent Color</label>
              <div className="flex items-center gap-3">
                <input 
                  type="color" 
                  value={config.primaryColor}
                  onChange={(e) => setConfig({ ...config, primaryColor: e.target.value })}
                  className="w-12 h-12 bg-transparent rounded-2xl cursor-pointer border-0"
                />
                <span className="text-sm font-black font-mono uppercase text-neutral-700 dark:text-neutral-300">{config.primaryColor}</span>
              </div>
            </div>
            
            <div className="space-y-4">
              <label className="text-xs font-black uppercase tracking-widest text-neutral-500 dark:text-neutral-400">Pause Widget</label>
              <div className="flex items-center h-12">
                <button 
                  onClick={() => setConfig({ ...config, isPaused: !config.isPaused })}
                  className={cn(
                    "w-16 h-8 rounded-full transition-colors relative",
                    config.isPaused ? "bg-orange-600" : "bg-neutral-300 dark:bg-neutral-700"
                  )}
                >
                  <div className={cn(
                    "absolute top-1 w-6 h-6 bg-white rounded-full transition-all shadow-md",
                    config.isPaused ? "right-1" : "left-1"
                  )} />
                </button>
              </div>
            </div>
         </div>

          {widget.type === 'alert' && (
            <div className="pt-6 border-t border-black/5 dark:border-white/5 space-y-6">
              <label className="text-xs font-black uppercase tracking-widest text-neutral-500 dark:text-neutral-400">Alert Settings</label>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500 dark:text-neutral-400">Padding</label>
                  <input type="number" value={config.alertPadding || 16} onChange={(e) => setConfig({...config, alertPadding: parseInt(e.target.value)})} className="w-full bg-black/5 dark:bg-black/20 border border-black/5 dark:border-white/5 rounded-2xl p-4 text-sm font-bold" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500 dark:text-neutral-400">Font Size (px)</label>
                  <input type="number" value={config.alertFontSize || 16} onChange={(e) => setConfig({...config, alertFontSize: parseInt(e.target.value)})} className="w-full bg-black/5 dark:bg-black/20 border border-black/5 dark:border-white/5 rounded-2xl p-4 text-sm font-bold" />
                </div>
              </div>
            </div>
          )}

         {/* --- Unified Styling: Color System & Opacity (Always enabled) --- */}
         <div className="space-y-8 pt-6 border-t border-black/5 dark:border-white/5">
           <ColorSystem 
             config={config} 
             onChange={setConfig} 
             label="Box Background" 
           />
           <div className="space-y-4 pt-2">
             <div className="flex justify-between">
               <label className="text-xs font-black uppercase tracking-widest text-neutral-500 dark:text-neutral-400">Opacity</label>
               <span className="text-xs font-black text-black dark:text-white">{config.backgroundOpacity || 80}%</span>
             </div>
             <input 
               type="range" min="0" max="100" step="5"
               value={config.backgroundOpacity !== undefined ? config.backgroundOpacity : 80}
               onChange={(e) => setConfig({ ...config, backgroundOpacity: parseInt(e.target.value) })}
               className="w-full h-2 bg-black/5 dark:bg-white/10 rounded-full appearance-none cursor-pointer"
             />
           </div>
         </div>
         {/* ------------------------------------------------------------- */}

         {widget.type === 'goal' && (
           <div className="space-y-6 pt-6 border-t border-black/5 dark:border-white/5">
              <div className="space-y-2">
                 <label className="text-xs font-black uppercase tracking-widest text-neutral-500 dark:text-neutral-400">Goal Title</label>
                 <input 
                   type="text"
                   value={config.goalTitle}
                   onChange={(e) => setConfig({ ...config, goalTitle: e.target.value })}
                   className="w-full bg-black/5 dark:bg-black/20 border border-black/5 dark:border-white/5 rounded-2xl p-4 outline-none font-bold"
                 />
               </div>
               
               <div className="space-y-2">
                 <label className="text-xs font-black uppercase tracking-widest text-neutral-500 dark:text-neutral-400">Progress Bar Style</label>
                 <input 
                   type="text" 
                   placeholder="#f97316 or linear-gradient(...)"
                   value={config.progressGradient || config.progressColor || config.primaryColor}
                   onChange={(e) => setConfig({ ...config, progressGradient: e.target.value, progressColor: e.target.value })}
                   className="w-full bg-black/5 dark:bg-black/20 border border-black/5 dark:border-white/5 rounded-2xl p-4 outline-none text-xs font-mono font-bold"
                 />
                 <div className="flex gap-2 mt-2">
                   <button onClick={() => setConfig({...config, progressGradient: 'linear-gradient(90deg, #f97316, #f59e0b)'})} className="text-[10px] font-black bg-orange-500/20 text-orange-600 dark:text-orange-500 px-3 py-1 rounded-full">Sunset Warm</button>
                   <button onClick={() => setConfig({...config, progressGradient: 'linear-gradient(90deg, #3b82f6, #8b5cf6)'})} className="text-[10px] font-black bg-blue-500/20 text-blue-600 dark:text-blue-500 px-3 py-1 rounded-full">Neon Cyber</button>
                   <button onClick={() => setConfig({...config, progressGradient: 'linear-gradient(90deg, #10b981, #3b82f6)'})} className="text-[10px] font-black bg-emerald-500/20 text-emerald-600 dark:text-emerald-500 px-3 py-1 rounded-full">Emerald Ocean</button>
                 </div>
               </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-neutral-500 dark:text-neutral-400">Goal Target</label>
                  <input 
                    type="number"
                    value={config.goalAmount}
                    onChange={(e) => setConfig({ ...config, goalAmount: parseInt(e.target.value) || 0 })}
                    className="w-full bg-black/5 dark:bg-black/20 border border-black/5 dark:border-white/5 rounded-2xl p-4 outline-none font-black text-lg"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-neutral-500 dark:text-neutral-400">Starting Point</label>
                  <input 
                    type="number"
                    value={config.goalStartingAmount || 0}
                    onChange={(e) => setConfig({ ...config, goalStartingAmount: parseInt(e.target.value) || 0 })}
                    className="w-full bg-black/5 dark:bg-black/20 border border-black/5 dark:border-white/5 rounded-2xl p-4 outline-none font-black text-lg text-orange-600 dark:text-orange-500"
                  />
                </div>
              </div>
           </div>
         )}
         
         {widget.type === 'ticker' && (
           <div className="space-y-6 pt-6 border-t border-black/5 dark:border-white/5">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-neutral-500 dark:text-neutral-400">Top Tippers to Show</label>
                   <select 
                     value={config.tickerCount || 5}
                     onChange={(e) => setConfig({ ...config, tickerCount: parseInt(e.target.value) || 5 })}
                     className="w-full bg-black/5 dark:bg-black/20 border border-black/5 dark:border-white/5 rounded-2xl p-4 outline-none font-black"
                   >
                     <option value="3">Top 3</option>
                     <option value="5">Top 5</option>
                     <option value="10">Top 10</option>
                     <option value="15">Top 15</option>
                     <option value="20">Top 20</option>
                   </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-neutral-500 dark:text-neutral-400">Slide Delay (Seconds)</label>
                  <input 
                    type="number"
                    value={config.tickerInterval || 5}
                    onChange={(e) => setConfig({ ...config, tickerInterval: parseInt(e.target.value) || 5 })}
                    className="w-full bg-black/5 dark:bg-black/20 border border-black/5 dark:border-white/5 rounded-2xl p-4 outline-none font-black"
                    step="1"
                  />
                </div>
              </div>
           </div>
         )}

         <div className="pt-8 border-t border-black/5 dark:border-white/5 flex gap-4">
            <button 
              onClick={handleSave}
              disabled={saving}
              className="flex-1 bg-black dark:bg-white text-white dark:text-black py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:opacity-80 transition-opacity flex items-center justify-center gap-3 shadow-xl"
            >
              <Save size={18} /> {saving ? 'Saving...' : 'Save Changes'}
            </button>
            <button 
              onClick={handleDelete}
              disabled={deleting}
              className="px-6 bg-red-500/10 hover:bg-red-600 text-red-600 hover:text-white border border-red-500/20 rounded-2xl transition-all flex items-center justify-center"
              title="Delete Widget"
            >
              <Trash2 size={22} />
            </button>
         </div>
      </div>
   </div>
  );

}
