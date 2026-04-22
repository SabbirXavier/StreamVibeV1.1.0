import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { Donation, Widget } from '../types';
import axios from 'axios';
import { socket } from '../lib/socket';

export default function OverlayPage() {
  const { widgetId } = useParams();
  const [widget, setWidget] = useState<Widget | null>(null);
  const [currentAlert, setCurrentAlert] = useState<{ donation: Donation, audioUrl: string | null } | null>(null);
  const [queue, setQueue] = useState<{ donation: Donation, audioUrl: string | null }[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Widget States
  const [goalTotal, setGoalTotal] = useState(0);
  const [recentDonations, setRecentDonations] = useState<Donation[]>([]);
  
  // 1. Fetch Initial Config & Status
  useEffect(() => {
    if (!widgetId) return;
    const fetchWidget = async () => {
      try {
        const res = await axios.get(`/api/public/widgets/${widgetId}`);
        setWidget(res.data);
        fetchStatus(res.data);
      } catch (err) {
        console.error("Widget fetch failed:", err);
      }
    };

    fetchWidget();
  }, [widgetId]);

  const fetchStatus = async (currentWidget: Widget) => {
    if (currentWidget.type === 'alert') return;
    try {
      const res = await axios.get(`/api/public/overlays/${widgetId}/donations`);
      const allDonations = res.data as Donation[];
      
      if (currentWidget.type === 'goal') {
        const startDate = currentWidget.config.goalStartDate ? new Date(currentWidget.config.goalStartDate).getTime() : 0;
        const relevant = allDonations.filter(d => new Date(d.createdAt).getTime() >= startDate);
        setGoalTotal(relevant.reduce((acc, d) => acc + (d.amount || 0), 0));
      } else if (currentWidget.type === 'ticker') {
         // Get the absolute highest donations? The spec says "Recent-5 Sliding Ticker with Notes"
         // So we sort by DATE descending to get the newest, not highest
         const topRecents = [...allDonations].sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5);
         setRecentDonations(topRecents);
      } else if (currentWidget.type === 'toptipper') {
         // Get exactly 1 top tipper
         const topTipper = [...allDonations].sort((a, b) => b.amount - a.amount)[0];
         if (topTipper) setRecentDonations([topTipper]);
      }
    } catch (err) {}
  }

  // 2. Connect via Sockets for Real-time
  useEffect(() => {
    if (!widgetId) return;
    socket.connect();
    socket.emit('join-widget', widgetId);

    const onAlert = (payload: { alertId: string, donation: Donation, audioUrl: string | null }) => {
      setQueue(prev => [...prev, payload]);
      // Also silently add to status lists to avoid polling
      if (widget?.type === 'goal') {
         setGoalTotal(prev => prev + payload.donation.amount);
      }
      if (widget?.type === 'ticker') {
         setRecentDonations(prev => [payload.donation, ...prev].slice(0, 5));
      }
      if (widget?.type === 'toptipper') {
         setRecentDonations(prev => {
            const isHigher = !prev[0] || payload.donation.amount > prev[0].amount;
            return isHigher ? [payload.donation] : prev;
         });
      }
    };

    const onConfigUpdate = () => {
      // Re-fetch config if someone edits it live in dashboard
      axios.get(`/api/public/widgets/${widgetId}`).then(res => setWidget(res.data));
    }

    socket.on('overlay_alert_enqueue', onAlert);
    socket.on('widget_update', onConfigUpdate);

    return () => {
      socket.off('overlay_alert_enqueue', onAlert);
      socket.off('widget_update', onConfigUpdate);
      socket.disconnect();
    };
  }, [widgetId, widget?.type]);

  // 3. Process Queue (Alerts)
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
      colors: [widget?.config.primaryColor || '#00FFFF', '#7C3AED']
    });

    if (nextAlert.audioUrl) {
       try {
         const audio = new Audio(nextAlert.audioUrl);
         await new Promise((resolve) => {
            audio.onended = resolve;
            audio.onerror = resolve;
            audio.play().catch(resolve);
         });
         await new Promise(r => setTimeout(r, 1000)); // padding
       } catch (e) {
         await new Promise(r => setTimeout(r, 5000));
       }
    } else {
       await new Promise(resolve => setTimeout(resolve, 5000));
    }

    setCurrentAlert(null);
    setIsProcessing(false);
  };

  if (!widget) return null;

  // Render logic based on type
  const paddingStr = widget.config.padding !== undefined ? `${widget.config.padding}px` : '16px';
  const widthStr = widget.config.width ? `${widget.config.width}px` : 'auto';
  const heightStr = widget.config.height ? `${widget.config.height}px` : 'auto';
  const boxBg = widget.config.boxGradient ? { background: widget.config.boxGradient } : { backgroundColor: widget.config.backgroundColor || '#0D0D14', opacity: (widget.config.backgroundOpacity !== undefined ? widget.config.backgroundOpacity : 80) / 100 };
  
  return (
    <>
      <style>{`
        body, html, :root { background-color: transparent !important; }
      `}</style>
      <div className="w-screen h-screen flex items-center justify-center overflow-hidden" style={{ background: 'transparent' }}>
        
        {/* --- ALERT WIDGET --- */}
        <AnimatePresence>
          {widget.type === 'alert' && currentAlert && (
            <motion.div
              initial={{ opacity: 0, y: 50, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.3 } }}
              className="flex flex-col items-center justify-center text-center backdrop-blur-[20px] shadow-[0_0_50px_rgba(0,0,0,0.5)] border border-white/10"
              style={{
                ...boxBg,
                padding: paddingStr,
                borderRadius: `${widget.config.alertBorderRadius || 24}px`,
                width: widthStr,
                height: heightStr,
                minWidth: '400px'
              }}
            >
               <h1 className="font-black text-chrome uppercase tracking-tight mb-2 drop-shadow-md" style={{ fontSize: `${(widget.config.alertFontSize || 16) * 1.5}px`}}>
                 {currentAlert.donation.donorName}
               </h1>
               <div className="font-bold bg-clip-text text-transparent bg-gradient-to-r mb-4" style={{ backgroundImage: `linear-gradient(to right, ${widget.config.primaryColor}, #ffffff)`, fontSize: `${widget.config.alertFontSize || 16}px` }}>
                 SENT {currentAlert.donation.currency === 'INR' ? '₹' : currentAlert.donation.currency}{currentAlert.donation.amount}
               </div>
               {currentAlert.donation.message && (
                 <p className="font-medium text-zinc-300 italic text-xl max-w-sm drop-shadow-sm" style={{ fontSize: `${(widget.config.alertFontSize || 16) * 0.8}px`}}>
                   "{currentAlert.donation.message}"
                 </p>
               )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* --- RECENT TICKER --- */}
        {widget.type === 'ticker' && !widget.config.isPaused && (
          <div className="absolute top-0 left-0 p-4" style={{ padding: paddingStr, width: widthStr, height: heightStr }}>
            <div className="flex bg-[#0D0D14]/80 backdrop-blur-[20px] rounded-full border border-white/10 overflow-hidden shadow-2xl h-12 items-center" style={boxBg}>
               {widget.config.stickyText && (
                  <div className="px-6 h-full flex items-center bg-white/5 font-black text-chrome uppercase tracking-widest text-sm border-r border-white/10 flex-shrink-0 z-10" style={{ color: widget.config.primaryColor }}>
                    {widget.config.stickyText}
                  </div>
               )}
               <div className="relative h-full flex items-center overflow-hidden w-[600px] pl-4">
                  <AnimatePresence>
                    {recentDonations.slice(0, widget.config.tickerCount || 5).map((d, i) => (
                      <motion.div
                        key={d._id || i}
                        initial={{ opacity: 0, x: -100 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, y: 50 }}
                        transition={{ layout: { type: "spring", bounce: 0.2, duration: 0.6 } }}
                        className="inline-flex items-center gap-2 mr-8 whitespace-nowrap"
                        layout
                      >
                         <span className="font-bold text-zinc-200">{d.donorName}</span>
                         <span className="text-zinc-600">-</span>
                         <span className="font-black" style={{ color: widget.config.primaryColor }}>
                           {d.currency === 'INR' ? '₹' : d.currency}{d.amount}
                         </span>
                      </motion.div>
                    ))}
                  </AnimatePresence>
               </div>
            </div>
          </div>
        )}

        {/* --- 1 TOP TIPPER WIDGET --- */}
        {widget.type === 'toptipper' && !widget.config.isPaused && recentDonations[0] && (
           <div className="absolute top-0 left-0" style={{ padding: paddingStr, width: widthStr, height: heightStr }}>
             <div className="inline-flex items-center gap-4 bg-[#0D0D14]/80 backdrop-blur-[20px] border border-white/10 rounded-2xl px-6 py-3 shadow-2xl" style={boxBg}>
               <div className="w-8 h-8 rounded-full flex items-center justify-center text-black font-black text-xs shadow-[0_0_15px_rgba(255,215,0,0.5)]" style={{ background: widget.config.primaryColor }}>
                 1
               </div>
               <div className="flex flex-col">
                 <span className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">King of the Stream</span>
                 <span className="text-lg font-black text-chrome" style={{ filter: `drop-shadow(0 0 5px ${widget.config.primaryColor}80)` }}>{recentDonations[0].donorName}</span>
                 {/* Financials hidden explicitly per spec */}
               </div>
             </div>
           </div>
        )}

        {/* --- PREMIUM GOAL BAR --- */}
        {widget.type === 'goal' && !widget.config.isPaused && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" style={{ padding: paddingStr, width: widthStr !== 'auto' ? widthStr : '24rem', height: heightStr }}>
             <div className="backdrop-blur-[20px] border border-white/10 rounded-3xl p-6 shadow-2xl relative overflow-hidden h-full flex flex-col justify-center" style={boxBg}>
                <div className="flex justify-between items-end mb-4 relative z-10">
                  <span className="text-white font-black uppercase tracking-widest text-sm drop-shadow-md">
                    {widget.config.goalTitle || 'DONATION GOAL'}
                  </span>
                  <span className="font-black text-2xl drop-shadow-md" style={{ color: widget.config.primaryColor }}>
                    {Math.min(100, Math.round(((goalTotal + (widget.config.goalStartingAmount || 0)) / (widget.config.goalAmount || 1000)) * 100))}%
                  </span>
                </div>

                <div className="w-full bg-white/5 rounded-full overflow-hidden border border-white/10 relative z-10 shadow-inner" style={{ height: `${widget.config.progressBarHeight || 32}px` }}>
                   <motion.div 
                     initial={{ width: 0 }}
                     animate={{ width: `${Math.min(100, Math.round(((goalTotal + (widget.config.goalStartingAmount || 0)) / (widget.config.goalAmount || 1000)) * 100))}%` }}
                     transition={{ duration: 1, type: 'spring' }}
                     className="h-full relative overflow-hidden"
                     style={{ background: widget.config.progressGradient || widget.config.progressColor || widget.config.primaryColor }}
                   >
                     {/* Liquid Animation Effect Layer for Gradients */}
                     {widget.config.progressGradient && (
                        <div className="absolute inset-0 w-full h-[200%] -top-[50%] bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiB2aWV3Qm94PSIwIDAgMjAwIDIwMCI+PHBhdGggZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjIpIiBkPSJNMCwxMDAgQzYwLDUwIDE0MCwxNTAgMjAwLDEwMCBMMjAwLDIwMCBMMCwyMDAgWiIgYW5pbWF0ZT0iZHVyYXRpb249JzJzJyByZXBlYXRDb3VudD0naW5kZWZpbml0ZScvPjwvc3ZnPg==')] opacity-30 animate-[spin_4s_linear_infinite]" />
                     )}
                   </motion.div>
                </div>
             </div>
          </div>
        )}
      </div>
    </>
  );
}
