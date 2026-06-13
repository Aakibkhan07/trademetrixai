"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Loader2, CheckCircle2, Zap, ShieldCheck, HeartHandshake, PhoneCall } from "lucide-react";
import { useDemo } from "@/components/providers/DemoContext";
import { GlassCard } from "./GlassCard";
import { NeonButton } from "./NeonButton";

export function LeadCaptureModal() {
  const { isLeadModalOpen, leadModalContext, closeLeadModal, submitLead, capital } = useDemo();
  
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [broker, setBroker] = useState("Dhan");
  const [selectedCapital, setSelectedCapital] = useState(capital);
  
  const [step, setStep] = useState<"form" | "animating" | "success">("form");
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);

  // Automatically update capital if user capital changes
  useEffect(() => {
    if (isLeadModalOpen) {
      setSelectedCapital(capital);
      setStep("form");
      setProgress(0);
      setLogs([]);
    }
  }, [isLeadModalOpen, capital]);

  if (!isLeadModalOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !phone) {
      alert("Please fill in all details to proceed.");
      return;
    }
    
    setStep("animating");
    setProgress(0);
    setLogs([]);

    const animationLogs = [
      "📡 Pinging private VPS container at Mumbai (Nxtra Data Center)...",
      "🛡️ Validating API credentials & security token handshake...",
      "⚙️ Pre-compiling risk rules for strategy: " + leadModalContext,
      "⚡ Establishing high-speed options execution queue line...",
      "🟢 Connection thread established successfully!"
    ];

    let logIndex = 0;
    const interval = setInterval(() => {
      if (logIndex < animationLogs.length) {
        setLogs((prev) => [...prev, animationLogs[logIndex]]);
        setProgress((prev) => Math.min(95, prev + 22));
        logIndex++;
      } else {
        clearInterval(interval);
        setProgress(100);
        setTimeout(() => {
          submitLead(name, email, phone, selectedCapital, broker, leadModalContext);
          setStep("success");
        }, 800);
      }
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="w-full max-w-md relative"
      >
        {/* Close Button */}
        {step !== "animating" && (
          <button
            onClick={closeLeadModal}
            className="absolute top-4 right-4 z-50 p-1.5 rounded-lg bg-white/5 border border-glass-border text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
          >
            <X size={15} />
          </button>
        )}

        <GlassCard
          className="border border-neon-blue/20 p-6 flex flex-col gap-5 overflow-hidden"
          glow={step === "success" ? "green" : "blue"}
        >
          {/* Header */}
          <div className="border-b border-glass-border pb-3 flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-neon-blue/10 border border-neon-blue/20 flex items-center justify-center text-neon-blue animate-pulse">
              <Zap size={16} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-text-primary uppercase tracking-wide">
                Live Broker API Linker
              </h3>
              <p className="text-[10px] text-text-secondary mt-0.5">
                Strategy Context: <span className="text-neon-blue font-mono font-bold">{leadModalContext}</span>
              </p>
            </div>
          </div>

          {/* Form Step */}
          {step === "form" && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] text-text-secondary uppercase font-semibold">Your Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Rahul Sharma"
                  className="w-full bg-white/5 border border-glass-border rounded-xl px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-neon-blue transition-colors"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] text-text-secondary uppercase font-semibold">Email Address</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full bg-white/5 border border-glass-border rounded-xl px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-neon-blue transition-colors"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] text-text-secondary uppercase font-semibold">WhatsApp Phone Number</label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. +91 98765 43210"
                  className="w-full bg-white/5 border border-glass-border rounded-xl px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-neon-blue transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] text-text-secondary uppercase font-semibold">Target Broker</label>
                  <select
                    value={broker}
                    onChange={(e) => setBroker(e.target.value)}
                    className="w-full bg-surface-elevated border border-glass-border rounded-xl px-3 py-2 text-xs text-text-primary focus:outline-none"
                  >
                    <option value="Dhan">Dhan</option>
                    <option value="Zerodha">Zerodha (Kite)</option>
                    <option value="Angel One">Angel One</option>
                    <option value="Fyers">Fyers</option>
                    <option value="Upstox">Upstox</option>
                    <option value="Groww">Groww</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] text-text-secondary uppercase font-semibold">Allocated Capital</label>
                  <input
                    type="text"
                    value={`₹${selectedCapital.toLocaleString("en-IN")}`}
                    onChange={(e) => {
                      const val = parseInt(e.target.value.replace(/[^0-9]/g, ""));
                      if (!isNaN(val)) setSelectedCapital(val);
                    }}
                    className="w-full bg-white/5 border border-glass-border rounded-xl px-3 py-2 text-xs text-text-primary focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-2">
                <NeonButton variant="blue" glow fullWidth type="submit">
                  Connect Account & Deploy Algo
                </NeonButton>
              </div>
            </form>
          )}

          {/* Animating Step */}
          {step === "animating" && (
            <div className="py-4 space-y-4">
              <div className="flex items-center justify-between text-xs text-text-secondary">
                <span className="flex items-center gap-2">
                  <Loader2 size={13} className="text-neon-blue animate-spin" />
                  Linking broker account via API...
                </span>
                <span className="font-mono text-neon-blue font-bold">{progress}%</span>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-white/5 border border-glass-border h-2 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-neon-blue to-neon-purple shadow-[0_0_10px_#00d4ff] transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>

              {/* Server Console Logs */}
              <div className="p-3 bg-black/75 border border-glass-border/40 rounded-xl font-mono text-[9px] text-neon-blue h-36 overflow-y-auto space-y-1.5 leading-normal">
                {logs.map((log, idx) => (
                  <div key={idx} className="flex gap-1.5 items-start">
                    <span className="text-text-muted select-none">&gt;</span>
                    <span>{log}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Success Step */}
          {step === "success" && (
            <div className="py-2 text-center space-y-4 flex flex-col items-center">
              <div className="w-12 h-12 rounded-full bg-neon-green/10 border border-neon-green/30 flex items-center justify-center text-neon-green mb-1">
                <CheckCircle2 size={24} className="animate-bounce" />
              </div>

              <h4 className="text-base font-bold text-text-primary tracking-tight">
                Connection Thread Secured!
              </h4>

              <p className="text-xs text-text-secondary leading-relaxed max-w-sm">
                Congratulations! Your deployment request for strategy <strong className="text-neon-green">{leadModalContext}</strong> has been registered with our Algo Desk.
              </p>

              <div className="w-full bg-white/[0.02] border border-glass-border p-3.5 rounded-xl space-y-2 text-left font-mono text-[10px] text-text-secondary">
                <div className="flex justify-between">
                  <span>Routing User:</span>
                  <span className="text-text-primary font-bold">{name}</span>
                </div>
                <div className="flex justify-between">
                  <span>Target Node:</span>
                  <span className="text-neon-blue font-bold">{broker} Console</span>
                </div>
                <div className="flex justify-between">
                  <span>Clearing Cap:</span>
                  <span className="text-neon-green font-bold">₹{selectedCapital.toLocaleString()}</span>
                </div>
              </div>

              <div className="w-full pt-2 space-y-2.5">
                <div className="flex items-center justify-center gap-1.5 text-[10px] text-text-muted">
                  <ShieldCheck size={12} className="text-neon-green" />
                  <span>Secure 256-Bit Broker API Clearing</span>
                </div>
                
                <div className="border-t border-glass-border/40 pt-4 flex flex-col gap-2 w-full">
                  <a
                    href="https://wa.me/919876543210"
                    target="_blank"
                    className="flex items-center justify-center gap-2 w-full py-2 rounded-xl bg-neon-green/10 hover:bg-neon-green/15 text-neon-green text-xs font-bold border border-neon-green/20 transition-all text-center"
                  >
                    <PhoneCall size={13} />
                    WhatsApp Algo Support Desk
                  </a>
                  <NeonButton variant="ghost" size="sm" onClick={closeLeadModal}>
                    Return to Dashboard
                  </NeonButton>
                </div>
              </div>
            </div>
          )}
        </GlassCard>
      </motion.div>
    </div>
  );
}
