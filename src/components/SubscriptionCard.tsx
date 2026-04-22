import React from 'react';
import { Check } from 'lucide-react';

interface SubscriptionCardProps {
  title: string;
  price: string;
  features: string[];
  highlight?: boolean;
  onSubscribe?: () => void;
}

export function SubscriptionCard({ title, price, features, highlight, onSubscribe }: SubscriptionCardProps) {
  return (
    <div className={`relative flex flex-col p-8 rounded-[2rem] transition-all duration-500 overflow-hidden ${
      highlight 
        ? 'glass-panel border-t border-[#7C3AED]/50 border-b-0 border-l-0 border-r-0 shadow-[0_0_50px_rgba(124,58,237,0.15)] scale-105 z-10' 
        : 'bg-white/[0.02] border border-white/10 hover:border-white/20 hover:bg-white/[0.04]'
    }`}>
      {/* Background gradients */}
      {highlight && (
        <div className="absolute inset-0 bg-gradient-to-b from-[#7C3AED]/20 via-transparent to-transparent pointer-events-none" />
      )}
      
      <div className="relative z-10 flex flex-col h-full">
        <h3 className="text-2xl font-black text-chrome uppercase tracking-tighter mb-2">{title}</h3>
        <div className="flex items-baseline gap-1 mb-8">
          <span className="text-4xl font-bold text-white">{price.split('/')[0]}</span>
          <span className="text-zinc-500 font-medium">/mo</span>
        </div>
        
        <div className="h-px border-b border-dashed border-white/10 w-full mb-8" />
        
        <ul className="flex flex-col gap-4 mb-10 flex-grow">
          {features.map((feature, idx) => (
            <li key={idx} className="flex items-start gap-3">
              <div className={`mt-0.5 w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${highlight ? 'bg-[#7C3AED]/20 text-[#00FFFF]' : 'bg-white/5 text-zinc-400'}`}>
                <Check size={12} strokeWidth={3} />
              </div>
              <span className="text-zinc-300 text-sm font-medium">{feature}</span>
            </li>
          ))}
        </ul>
        
        <button onClick={onSubscribe} className={`w-full py-4 mt-auto rounded-xl font-bold uppercase tracking-widest text-sm transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#0D0D14] ${
          highlight 
            ? 'bg-gradient-to-r from-[#7C3AED] to-[#00FFFF] text-black hover:opacity-90 shadow-[0_0_20px_rgba(124,58,237,0.3)]' 
            : 'bg-white/5 text-white hover:bg-white/10 border border-white/10'
        }`}>
          Subscribe Now
        </button>
      </div>
    </div>
  );
}
