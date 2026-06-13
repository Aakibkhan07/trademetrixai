"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { useAuth } from "@/components/providers/AuthContext";
import { Eye, EyeOff, Loader2, Zap, ArrowRight, Shield } from "lucide-react";
import { cn } from "@/lib/utils";

export default function LoginPage() {
  const { signInWithGoogle, signInWithEmail, signUpWithEmail, error, loading } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    setSubmitting(true);
    try {
      if (isSignUp) {
        await signUpWithEmail(email, password, displayName || email.split("@")[0]);
      } else {
        await signInWithEmail(email, password);
      }
    } catch {
      // Error is handled by AuthContext
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLocalError(null);
    setSubmitting(true);
    try {
      await signInWithGoogle();
    } catch {
      // Error handled by AuthContext
    } finally {
      setSubmitting(false);
    }
  };

  const displayError = localError || error;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center relative overflow-hidden p-4">
      {/* Ambient background effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-neon-blue/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-neon-purple/5 rounded-full blur-[100px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-neon-green/3 rounded-full blur-[150px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, type: "spring", stiffness: 100 }}
        className="w-full max-w-md relative z-10"
      >
        {/* Logo & Branding */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="flex items-center justify-center gap-3 mb-4"
          >
            <div className="w-12 h-12 rounded-2xl overflow-hidden border border-neon-blue/20 bg-white/5 backdrop-blur-md p-1.5 shadow-[0_0_20px_rgba(0,212,255,0.15)]">
              <img src="/logo-icon.png" alt="Trade Metrix" className="w-full h-full object-contain" />
            </div>
            <div className="flex flex-col items-start">
              <span className="text-lg font-bold tracking-wide text-text-primary">TRADE METRIX</span>
              <span className="text-[10px] font-medium text-neon-blue tracking-[0.25em]">AI TERMINAL</span>
            </div>
          </motion.div>
          <p className="text-sm text-text-secondary mt-2">
            {isSignUp ? "Create your trading account" : "Sign in to your trading terminal"}
          </p>
        </div>

        {/* Auth Card */}
        <div className="glass-card p-6 space-y-5">
          {/* Google Sign-In */}
          <button
            onClick={handleGoogleSignIn}
            disabled={submitting}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl border border-glass-border bg-white/5 hover:bg-white/8 text-text-primary font-medium text-sm transition-all duration-300 hover:border-neon-blue/20 hover:shadow-[0_0_15px_rgba(0,212,255,0.08)] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-glass-border" />
            <span className="text-xs text-text-muted uppercase tracking-wider">or</span>
            <div className="flex-1 h-px bg-glass-border" />
          </div>

          {/* Email Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
              >
                <label className="block text-xs text-text-secondary font-medium mb-1.5 uppercase tracking-wider">
                  Display Name
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Your trading alias"
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-glass-border text-text-primary text-sm placeholder:text-text-muted focus:outline-none focus:border-neon-blue/40 focus:shadow-[0_0_10px_rgba(0,212,255,0.1)] transition-all"
                />
              </motion.div>
            )}

            <div>
              <label className="block text-xs text-text-secondary font-medium mb-1.5 uppercase tracking-wider">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="trader@example.com"
                required
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-glass-border text-text-primary text-sm placeholder:text-text-muted focus:outline-none focus:border-neon-blue/40 focus:shadow-[0_0_10px_rgba(0,212,255,0.1)] transition-all"
              />
            </div>

            <div>
              <label className="block text-xs text-text-secondary font-medium mb-1.5 uppercase tracking-wider">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  className="w-full px-4 py-3 pr-12 rounded-xl bg-white/5 border border-glass-border text-text-primary text-sm placeholder:text-text-muted focus:outline-none focus:border-neon-blue/40 focus:shadow-[0_0_10px_rgba(0,212,255,0.1)] transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Error display */}
            {displayError && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="px-3 py-2.5 rounded-xl bg-neon-red/10 border border-neon-red/20 text-neon-red text-xs font-medium"
              >
                {displayError}
              </motion.div>
            )}

            <button
              type="submit"
              disabled={submitting || !email || !password}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-neon-blue/20 to-neon-purple/20 border border-neon-blue/30 text-neon-blue font-semibold text-sm hover:from-neon-blue/30 hover:to-neon-purple/30 hover:shadow-[0_0_20px_rgba(0,212,255,0.15)] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {submitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  {isSignUp ? "Creating Account..." : "Signing In..."}
                </>
              ) : (
                <>
                  {isSignUp ? "Create Account" : "Sign In"}
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          {/* Toggle Sign In / Sign Up */}
          <div className="text-center">
            <button
              onClick={() => { setIsSignUp(!isSignUp); setLocalError(null); }}
              className="text-xs text-text-secondary hover:text-neon-blue transition-colors cursor-pointer"
            >
              {isSignUp ? "Already have an account? Sign in" : "Don't have an account? Create one"}
            </button>
          </div>
        </div>

        {/* Security note */}
        <div className="flex items-center justify-center gap-2 mt-4 text-[10px] text-text-muted">
          <Shield size={12} className="text-neon-green" />
          <span>256-bit SSL Encrypted • SOC-2 Compliant Infrastructure</span>
        </div>

        {/* Features */}
        <div className="grid grid-cols-3 gap-3 mt-6">
          {[
            { icon: Zap, label: "AI-Powered Signals", color: "text-neon-blue" },
            { icon: Shield, label: "Secure Trading", color: "text-neon-green" },
            { icon: ArrowRight, label: "One-Click Deploy", color: "text-neon-purple" },
          ].map((feat, i) => (
            <motion.div
              key={feat.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + i * 0.1 }}
              className="flex flex-col items-center gap-1.5 text-center"
            >
              <feat.icon size={16} className={feat.color} />
              <span className="text-[9px] text-text-muted font-medium">{feat.label}</span>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
