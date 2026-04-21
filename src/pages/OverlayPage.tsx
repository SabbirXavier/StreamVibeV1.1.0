import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { Donation, Widget } from '../types';
import { IndianRupee } from 'lucide-react';
import axios from 'axios';

export default function OverlayPage() {
  const { widgetId } = useParams();
  const [widget, setWidget] = useState<Widget | null>(null);
  const [currentAlert, setCurrentAlert] = useState<Donation | null>(null);
  const [queue, setQueue] = useState<Donation[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [goalTotal, setGoalTotal] = useState(0);
  const [recentDonations, setRecentDonations] = useState<Donation[]>([]);
  const [currentDonationIndex, setCurrentDonationIndex] = useState(0);
  
  const lastCheckTime = useRef(new Date().toISOString());

  // 1. Fetch Widget Config
  useEffect(() => {
    if (!widgetId) return;
    const fetchWidget = async () => {
      try {
        const res = await axios.get(`/api/public/widgets/${widgetId}`);
        setWidget(res.data);
      } catch (err) {
        console.error("Widget fetch failed:", err);
      }
    };
    fetchWidget();
    // Poll for real-time config updates without needing OBS reload
    const interval = setInterval(fetchWidget, 5000);
    return () => clearInterval(interval);
  }, [widgetId]);

  // 2. Poll for New Donations (Alerts)
  useEffect(() => {
    if (!widgetId || !widget) return;

    const pollDonations = async () => {
      try {
        const res = await axios.get(`/api/public/overlays/${widgetId}/donations`, {
          params: { since: lastCheckTime.current }
        });
        
        const newDonations = res.data as Donation[];
        if (Array.isArray(newDonations) && newDonations.length > 0) {
          setQueue(prev => [...prev, ...newDonations]);
          // Set last check time to the latest donation time or now
          lastCheckTime.current = new Date().toISOString();
        }
      } catch (err) {
        console.error("Polling failed:", err);
      }
    };

    const interval = setInterval(pollDonations, 5000); 
    pollDonations(); // Initial check
    return () => clearInterval(interval);
  }, [widgetId, widget]);

  // 3. Process Queue
  useEffect(() => {
    if (queue.length > 0 && !isProcessing && !widget?.config.isPaused) {
      processNextAlert();
    }
  }, [queue, isProcessing, widget?.config.isPaused]);

  const processNextAlert = async () => {
    setIsProcessing(true);
    const nextAlert = queue[0];
    setQueue(prev => prev.slice(1));
    setCurrentAlert(nextAlert);

    // Confetti
    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 },
      colors: [widget?.config.primaryColor || '#ea580c', '#ffffff']
    });

    // Handle TTS
    if (widget?.config.ttsEnabled && nextAlert.message) {
      try {
        await speakText(nextAlert.message, widget.config.ttsVoice || 'Zephyr');
      } catch (err) {
        console.error("TTS failed:", err);
        // Fallback delay if TTS fails
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    } else {
      // Delay if no TTS
      await new Promise(resolve => setTimeout(resolve, 5000));
    }

    // Done with this alert
    setCurrentAlert(null);
    setIsProcessing(false);
  };

  const speakText = (text: string, voiceName: string): Promise<void> => {
    return new Promise((resolve) => {
      if (!window.speechSynthesis) return resolve();
      
      const startSpeaking = () => {
        const utterance = new SpeechSynthesisUtterance(text);
        
        // Language Detection (Devanagari for Hindi/Marathi)
        const hasDevanagari = /[\u0900-\u097F]/.test(text);
        utterance.lang = hasDevanagari ? 'hi-IN' : 'en-US';
        
        // Voice Selection
        const voices = window.speechSynthesis.getVoices();
        let voice = voices.find(v => v.name === widget?.config.ttsVoice);
        
        if (!voice) {
          voice = voices.find(v => v.name.includes(voiceName));
        }
        
        if (!voice && hasDevanagari) {
          voice = voices.find(v => v.lang.startsWith('hi'));
        }
        
        if (voice) utterance.voice = voice;
        
        utterance.rate = 0.9;
        utterance.pitch = widget?.config.ttsPitch || 1.0;
        utterance.volume = widget?.config.ttsVolume || 1.0;
        
        utterance.onend = () => resolve();
        utterance.onerror = (e) => {
          console.error("SpeechSynthesis Error:", e);
          resolve();
        };
        
        window.speechSynthesis.speak(utterance);
      };

      // In some browsers, voices are loaded asynchronously
      if (window.speechSynthesis.getVoices().length === 0) {
        window.speechSynthesis.onvoiceschanged = () => {
          startSpeaking();
          window.speechSynthesis.onvoiceschanged = null;
        };
      } else {
        startSpeaking();
      }
      
      // Safety timeout
      setTimeout(resolve, 15000);
    });
  };

  // 4. Poll for Goal/Ticker status
  useEffect(() => {
    if (!widgetId || !widget) return;
    if (widget.type === 'alert') return;

    const fetchStatus = async () => {
      try {
        const res = await axios.get(`/api/public/overlays/${widgetId}/donations`);
        const allDonations = res.data as Donation[];
        
        if (widget.type === 'goal') {
          // Filter donations that are after the widget's goalStartDate, or all if not set
          const startDate = widget.config.goalStartDate ? new Date(widget.config.goalStartDate).getTime() : 0;
          const relevantDonations = allDonations.filter(d => {
            const dTime = new Date(d.createdAt).getTime();
            return dTime >= startDate;
          });
          const total = relevantDonations.reduce((acc, d) => acc + (d.amount || 0), 0);
          setGoalTotal(total);
        } else if (widget.type === 'ticker') {
          // Sort donations by amount descending
          const topCount = widget.config.tickerCount || 5;
          const topDonations = [...allDonations].sort((a, b) => b.amount - a.amount).slice(0, topCount);
          setRecentDonations(prev => {
            // Only update if changed
            if (JSON.stringify(prev) !== JSON.stringify(topDonations)) {
              return topDonations;
            }
            return prev;
          });
        }
      } catch (err) {
        console.error("Status fetch failed:", err);
      }
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 30000); // Status updates slower (30s)
    return () => clearInterval(interval);
  }, [widgetId, widget]);

  // Cycle ticker items
  useEffect(() => {
    if (widget?.type === 'ticker' && recentDonations.length > 0 && !widget?.config.isPaused) {
      const ms = (widget.config.tickerInterval || 5) * 1000;
      const interval = setInterval(() => {
        setCurrentDonationIndex(prev => (prev + 1) % recentDonations.length);
      }, ms);
      return () => clearInterval(interval);
    }
  }, [widget, recentDonations]);

  if (!widget) return null;

  const currentGoalAmount = (widget.config.goalStartingAmount || 0) + goalTotal;
  const goalTarget = widget.config.goalAmount || 1000;
  const progressPercent = Math.min(100, Math.round((currentGoalAmount / goalTarget) * 100));

  return (
    <>
      <style>{`
        body, html, :root {
          background-color: transparent !important;
        }
      `}</style>
      <div className="w-screen h-screen flex items-center justify-center overflow-hidden" style={{ background: 'transparent' }}>
        {/* Alert Component */}
      <AnimatePresence>
        {widget.type === 'alert' && currentAlert && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.3 } }}
            className="flex flex-col items-center text-center p-8 rounded-[40px] bg-black/90 backdrop-blur-md border border-white/20 shadow-2xl max-w-2xl min-w-[400px]"
          >
             <div 
              className="w-24 h-24 rounded-3xl flex items-center justify-center mb-6 shadow-lg"
              style={{ backgroundColor: widget.config.primaryColor }}
             >
                <IndianRupee size={48} className="text-white" />
             </div>
             
             <h1 className="text-4xl font-black text-white mb-2 uppercase tracking-tight italic">
               {currentAlert.donorName} SENT {currentAlert.currency || '₹'}{currentAlert.amount}
             </h1>
             
             <div className="h-1 w-24 bg-white/20 rounded-full mb-6" />
             
             <p className="text-2xl font-bold text-orange-400 leading-relaxed max-w-md italic">
               "{currentAlert.message}"
             </p>

             <motion.div 
               className="mt-8 flex gap-1"
               animate={{ opacity: [0.4, 1, 0.4] }}
               transition={{ duration: 1.5, repeat: Infinity }}
             >
                {[...Array(5)].map((_, i) => (
                   <div key={i} className="w-1.5 h-1.5 rounded-full bg-white/20" />
                ))}
             </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Goal Component */}
      {widget.type === 'goal' && !widget.config.isPaused && (
        <div 
          className="absolute bottom-10 left-10 w-96 p-6 rounded-3xl shadow-2xl backdrop-blur-md"
          style={{
            background: widget.config.boxGradient || `rgba(0,0,0,${(widget.config.backgroundOpacity !== undefined ? widget.config.backgroundOpacity : 80) / 100})`,
            backgroundColor: widget.config.boxGradient ? undefined : widget.config.backgroundColor || '#000000',
            border: `1px solid ${widget.config.boxGradient ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.1)'}`
          }}
        >
          <div className="flex justify-between text-xs font-black uppercase tracking-widest mb-3 italic">
            <span className="text-white">{widget.config.goalTitle || 'DONATION GOAL'}</span>
            <span style={{ color: widget.config.primaryColor }}>
              {progressPercent}%
            </span>
          </div>
          <div className="h-5 w-full bg-white/10 rounded-full overflow-hidden p-1 shadow-inner">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              className="h-full rounded-full"
              style={{ 
                background: widget.config.progressGradient || widget.config.progressColor || widget.config.primaryColor, 
                boxShadow: `0 0 20px ${widget.config.progressColor || widget.config.primaryColor}80` 
              }}
            />
          </div>
          <div className="flex justify-between mt-3 text-[11px] font-bold font-mono text-neutral-400 uppercase tracking-tighter">
            <span>₹ {currentGoalAmount}</span>
            <span>₹ {goalTarget}</span>
          </div>
        </div>
      )}

      {/* Ticker Component */}
      {widget.type === 'ticker' && !widget.config.isPaused && (
        <div className="absolute top-0 left-0 w-full h-full flex flex-col justify-start">
          <div className="w-full max-w-sm p-4 bg-transparent mx-auto">
             <div className="space-y-3 relative h-16 w-full flex items-center justify-center">
               <AnimatePresence mode="wait">
                 {recentDonations.length > 0 ? (
                   <motion.div
                     key={currentDonationIndex}
                     initial={{ opacity: 0, x: -50 }}
                     animate={{ opacity: 1, x: 0 }}
                     exit={{ opacity: 0, x: 50 }}
                     transition={{ duration: 0.5, type: 'spring' }}
                     className="w-full flex items-center justify-between p-3 rounded-2xl shadow-lg absolute backdrop-blur-md"
                     style={{
                       background: widget.config.boxGradient || `rgba(0,0,0,${(widget.config.backgroundOpacity !== undefined ? widget.config.backgroundOpacity : 80) / 100})`,
                       backgroundColor: widget.config.boxGradient ? undefined : widget.config.backgroundColor || '#000000',
                       border: `1px solid ${widget.config.boxGradient ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.1)'}`
                     }}
                   >
                     <div className="flex items-center gap-3">
                       <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shadow-inner uppercase bg-black/50 border border-white/10 text-white">
                         #{currentDonationIndex + 1}
                       </div>
                       <span className="text-base font-black text-white italic uppercase">{recentDonations[currentDonationIndex].donorName}</span>
                     </div>
                     <span className="text-base font-black" style={{ color: widget.config.primaryColor }}>
                       {recentDonations[currentDonationIndex].currency === 'INR' ? '₹' : recentDonations[currentDonationIndex].currency}
                       {recentDonations[currentDonationIndex].amount}
                     </span>
                   </motion.div>
                 ) : (
                   <div className="text-xs font-bold text-neutral-500 uppercase tracking-widest text-center py-4 bg-black/40 rounded-xl">
                     Awaiting top tippers...
                   </div>
                 )}
               </AnimatePresence>
             </div>
          </div>
        </div>
      )}
    </div>
    </>
  );
}
