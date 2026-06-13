"use client";

import { useState } from "react";
import { useDemo, UserRole } from "@/components/providers/DemoContext";
import { useAuth } from "@/components/providers/AuthContext";
import { GlassCard } from "@/components/ui/GlassCard";
import { NeonButton } from "@/components/ui/NeonButton";
import { Shield, User, Lock, ArrowRight, ShieldCheck, Loader2, Eye, EyeOff } from "lucide-react";
import { motion } from "motion/react";

interface AuthWrapperProps {
  children: React.ReactNode;
}

export function AuthWrapper({ children }: AuthWrapperProps) {
  const { isLoggedIn: isDemoLoggedIn, login: demoLogin } = useDemo();
  const { user, loading: authLoading, signInWithGoogle, signInWithEmail, signUpWithEmail, error: authError, firebaseReady } = useAuth();

  // Determine if Firebase is configured
  const firebaseConfigured = firebaseReady;

  // Auth state: Firebase user takes priority, then demo login
  const isAuthenticated = firebaseConfigured ? !!user : isDemoLoggedIn;

  if (authLoading && firebaseConfigured) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-2xl overflow-hidden border border-neon-blue/20 bg-white/5 backdrop-blur-md p-1.5 shadow-[0_0_20px_rgba(0,212,255,0.15)]">
            <img src="/logo-icon.png" alt="Trade Metrix" className="w-full h-full object-contain" />
          </div>
          <Loader2 size={24} className="animate-spin text-neon-blue" />
          <p className="text-xs text-text-secondary">Initializing secure session...</p>
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <>{children}</>;
  }

  // Show auth screen
  return firebaseConfigured ? <FirebaseLoginScreen /> : <DemoLoginScreen demoLogin={demoLogin} />;
}

// ============================================================
// FIREBASE LOGIN SCREEN (Real Auth)
// ============================================================

function FirebaseLoginScreen() {
  const { signInWithGoogle, signInWithEmail, signUpWithEmail, error } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (isSignUp) {
        await signUpWithEmail(email, password, displayName || email.split("@")[0]);
      } else {
        await signInWithEmail(email, password);
      }
    } catch {} finally {
      setSubmitting(false);
    }
  };

  const handleGoogle = async () => {
    setSubmitting(true);
    try { await signInWithGoogle(); } catch {} finally { setSubmitting(false); }
  };

  return (
    <div className="min-h-screen bg-background text-foreground relative overflow-hidden flex flex-col justify-center items-center px-4 py-12">
      <div className="absolute top-[15%] left-[20%] w-[500px] h-[500px] rounded-full bg-neon-blue/5 blur-[140px] pointer-events-none z-0 animate-pulse" />
      <div className="absolute bottom-[15%] right-[20%] w-[500px] h-[500px] rounded-full bg-neon-purple/5 blur-[140px] pointer-events-none z-0" />

      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="text-center mb-8 relative z-10 space-y-3">
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 rounded-2xl overflow-hidden border border-neon-blue/20 bg-white/5 backdrop-blur-md p-2 shadow-2xl">
            <img src="/logo-icon.png" alt="Trade Metrix" className="w-full h-full object-contain" />
          </div>
        </div>
        <h1 className="text-3xl font-extrabold tracking-wider text-text-primary font-display uppercase">
          TRADE METRIX <span className="text-neon-blue">AI</span>
        </h1>
        <p className="text-xs font-mono text-neon-blue tracking-[0.2em] uppercase">Precision • Clarity • Control</p>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }} className="w-full max-w-md relative z-10">
        <GlassCard className="border border-glass-border/40 p-6 space-y-5" hover>
          <button
            onClick={handleGoogle}
            disabled={submitting}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl border border-glass-border bg-white/5 hover:bg-white/8 text-text-primary font-medium text-sm transition-all duration-300 hover:border-neon-blue/20 disabled:opacity-50 cursor-pointer"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>

          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-glass-border" />
            <span className="text-xs text-text-muted uppercase tracking-wider">or</span>
            <div className="flex-1 h-px bg-glass-border" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <div>
                <label className="block text-xs text-text-secondary font-medium mb-1.5 uppercase tracking-wider">Name</label>
                <input type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Your trading alias" className="w-full px-4 py-3 rounded-xl bg-white/5 border border-glass-border text-text-primary text-sm placeholder:text-text-muted focus:outline-none focus:border-neon-blue/40 transition-all" />
              </div>
            )}
            <div>
              <label className="block text-xs text-text-secondary font-medium mb-1.5 uppercase tracking-wider">Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="trader@example.com" required className="w-full px-4 py-3 rounded-xl bg-white/5 border border-glass-border text-text-primary text-sm placeholder:text-text-muted focus:outline-none focus:border-neon-blue/40 transition-all" />
            </div>
            <div>
              <label className="block text-xs text-text-secondary font-medium mb-1.5 uppercase tracking-wider">Password</label>
              <div className="relative">
                <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required minLength={6} className="w-full px-4 py-3 pr-12 rounded-xl bg-white/5 border border-glass-border text-text-primary text-sm placeholder:text-text-muted focus:outline-none focus:border-neon-blue/40 transition-all" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary cursor-pointer">
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="px-3 py-2.5 rounded-xl bg-neon-red/10 border border-neon-red/20 text-neon-red text-xs font-medium">{error}</div>
            )}

            <button type="submit" disabled={submitting || !email || !password} className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-neon-blue/20 to-neon-purple/20 border border-neon-blue/30 text-neon-blue font-semibold text-sm hover:from-neon-blue/30 hover:to-neon-purple/30 transition-all disabled:opacity-50 cursor-pointer">
              {submitting ? <Loader2 size={16} className="animate-spin" /> : null}
              {isSignUp ? "Create Account" : "Sign In"}
              <ArrowRight size={16} />
            </button>
          </form>

          <div className="text-center">
            <button onClick={() => setIsSignUp(!isSignUp)} className="text-xs text-text-secondary hover:text-neon-blue transition-colors cursor-pointer">
              {isSignUp ? "Already have an account? Sign in" : "Don't have an account? Create one"}
            </button>
          </div>
        </GlassCard>
      </motion.div>

      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="text-[10px] text-text-muted mt-8 text-center max-w-md font-mono">
        Trade Metrix AI Institutional Portal. 256-bit SSL Encrypted.
      </motion.p>
    </div>
  );
}

// ============================================================
// DEMO LOGIN SCREEN (Fallback when Firebase not configured)
// ============================================================

function DemoLoginScreen({ demoLogin }: { demoLogin: (role: UserRole) => void }) {
  const [loadingRole, setLoadingRole] = useState<UserRole | null>(null);

  const handleLogin = (role: UserRole) => {
    setLoadingRole(role);
    setTimeout(() => {
      demoLogin(role);
      setLoadingRole(null);
    }, 800);
  };

  return (
    <div className="min-h-screen bg-background text-foreground relative overflow-hidden flex flex-col justify-center items-center px-4 py-12">
      <div className="absolute top-[15%] left-[20%] w-[500px] h-[500px] rounded-full bg-neon-blue/5 blur-[140px] pointer-events-none z-0 animate-pulse" />
      <div className="absolute bottom-[15%] right-[20%] w-[500px] h-[500px] rounded-full bg-neon-purple/5 blur-[140px] pointer-events-none z-0" />

      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="text-center mb-10 relative z-10 space-y-3">
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 rounded-2xl overflow-hidden border border-neon-blue/20 bg-white/5 backdrop-blur-md p-2 shadow-2xl">
            <img src="/logo-icon.png" alt="Trade Metrix" className="w-full h-full object-contain" />
          </div>
        </div>
        <h1 className="text-3xl font-extrabold tracking-wider text-text-primary font-display uppercase">
          TRADE METRIX <span className="text-neon-blue">AI</span>
        </h1>
        <p className="text-xs font-mono text-neon-blue tracking-[0.2em] uppercase">Precision • Clarity • Control</p>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }} className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl relative z-10">
        {/* Client Access */}
        <GlassCard className="border border-glass-border/40 p-6 flex flex-col justify-between" hover>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-text-secondary text-xs uppercase tracking-wider font-semibold">
                <User size={15} className="text-neon-blue" />
                <span>Client Access</span>
              </div>
              <span className="text-[9px] bg-neon-blue/10 text-neon-blue border border-neon-blue/20 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">Standard Account</span>
            </div>
            <div className="space-y-1">
              <h2 className="text-xl font-bold text-text-primary font-display">Retail Desk</h2>
              <p className="text-xs text-text-secondary leading-relaxed">
                Access advanced options backtesting, AI market signals, stock analysis, and multi-broker setups. Automated execution for standard client parameters.
              </p>
            </div>
          </div>
          <div className="mt-8 pt-4 border-t border-glass-border/20">
            <NeonButton variant="blue" fullWidth glow disabled={loadingRole !== null} onClick={() => handleLogin("user")} className="font-bold uppercase tracking-wider flex items-center justify-center gap-2 h-11">
              {loadingRole === "user" ? (
                <div className="w-4 h-4 border-2 border-neon-blue border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Enter Trading Desk</span>
                  <ArrowRight size={14} />
                </>
              )}
            </NeonButton>
          </div>
        </GlassCard>

        {/* Admin Access */}
        <GlassCard className="border border-neon-purple/20 bg-neon-purple/5 p-6 flex flex-col justify-between" glow="purple" hover>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-neon-purple text-xs uppercase tracking-wider font-semibold">
                <Shield size={15} className="text-neon-purple" />
                <span>Institutional Suite</span>
              </div>
              <span className="text-[9px] bg-neon-purple/10 text-neon-purple border border-neon-purple/20 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">Full Admin Clearance</span>
            </div>
            <div className="space-y-1">
              <h2 className="text-xl font-bold text-text-primary font-display">Institutional Admin</h2>
              <p className="text-xs text-text-secondary leading-relaxed">
                Unlock full platform permissions. Deploy live option execution engines, adjust proprietary strategies, configure institutional broker routings, and manage compliance audits.
              </p>
            </div>
          </div>
          <div className="mt-8 pt-4 border-t border-glass-border/20">
            <NeonButton variant="purple" fullWidth glow disabled={loadingRole !== null} onClick={() => handleLogin("admin")} className="font-bold uppercase tracking-wider flex items-center justify-center gap-2 h-11">
              {loadingRole === "admin" ? (
                <div className="w-4 h-4 border-2 border-neon-purple border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Access Admin Console</span>
                  <ShieldCheck size={15} />
                </>
              )}
            </NeonButton>
          </div>
        </GlassCard>
      </motion.div>

      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="text-[10px] text-text-muted mt-12 text-center max-w-md font-mono">
        Trade Metrix AI Institutional Portal. Authorized users only. System operations are logged in compliance with exchange guidelines.
      </motion.p>
    </div>
  );
}
