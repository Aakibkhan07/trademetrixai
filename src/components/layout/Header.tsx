"use client";

import { useState, useRef, useEffect } from "react";
import { Bell, Search, User, ChevronDown, Shield, Sliders, RefreshCw, UserCheck, LogOut } from "lucide-react";
import { GlowingPulse } from "@/components/ui/GlowingPulse";
import { useDemo } from "@/components/providers/DemoContext";
import { useMarketData } from "@/components/providers/MarketDataContext";

interface HeaderProps {
  title: string;
  subtitle?: string;
}

export function Header({ title, subtitle }: HeaderProps) {
  const { role, username, setRole, setDemoControlOpen, resetAll, logout } = useDemo();
  const { latency, openAlgoConfig, openAlgoStatus } = useMarketData();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="flex items-center justify-between h-16 px-6 border-b border-glass-border bg-background/50 backdrop-blur-xl sticky top-0 z-30">
      <div>
        <h1 className="text-lg font-bold text-text-primary">{title}</h1>
        {subtitle && (
          <p className="text-xs text-text-secondary">{subtitle}</p>
        )}
      </div>

      <div className="flex items-center gap-3">
        {/* Search */}
        <div className="hidden md:flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-glass-border text-text-secondary text-sm w-56">
          <Search size={15} />
          <span className="text-text-muted text-xs">Search...</span>
          <kbd className="ml-auto text-[10px] px-1.5 py-0.5 rounded bg-white/5 border border-glass-border text-text-muted">
            ⌘K
          </kbd>
        </div>

        {/* Notifications */}
        <button className="relative p-2 rounded-xl hover:bg-white/5 text-text-secondary hover:text-text-primary transition-colors">
          <Bell size={18} />
          <GlowingPulse
            color="blue"
            size="sm"
            className="absolute top-1.5 right-1.5"
          />
        </button>

        {/* OpenAlgo connection status */}
        {openAlgoConfig?.enabled && (
          <div className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-mono select-none ${
            openAlgoStatus === "connected"
              ? "bg-neon-blue/5 border border-neon-blue/10"
              : openAlgoStatus === "connecting"
              ? "bg-neon-yellow/5 border border-neon-yellow/10"
              : "bg-neon-red/5 border border-neon-red/10"
          }`}>
            <GlowingPulse 
              color={
                openAlgoStatus === "connected"
                  ? "blue"
                  : openAlgoStatus === "connecting"
                  ? "amber"
                  : "red"
              } 
              size="sm" 
            />
            <span className="text-text-muted font-bold">OPENALGO:</span>
            <span className={`font-bold uppercase ${
              openAlgoStatus === "connected"
                ? "text-neon-blue"
                : openAlgoStatus === "connecting"
                ? "text-neon-yellow animate-pulse"
                : "text-neon-red"
            }`}>
              {openAlgoStatus}
            </span>
          </div>
        )}

        {/* Server Latency status */}
        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neon-green/5 border border-neon-green/10 text-[10px] font-mono select-none">
          <GlowingPulse color="green" size="sm" />
          <span className="text-text-muted font-bold">VPS:</span>
          <span className="text-neon-green font-bold">{latency}ms</span>
        </div>

        {/* User profile dropdown container */}
        <div className="relative" ref={dropdownRef}>
          <button 
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 p-1 rounded-xl hover:bg-white/5 border border-transparent hover:border-glass-border/30 transition-all duration-200"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-neon-blue/30 to-neon-purple/30 flex items-center justify-center border border-neon-blue/20">
              {role === "admin" ? (
                <Shield size={15} className="text-neon-purple" />
              ) : (
                <User size={15} className="text-neon-blue" />
              )}
            </div>
            <div className="hidden sm:flex flex-col items-start text-left">
              <span className="text-[11px] font-bold text-text-primary leading-tight">{username}</span>
              <span className="text-[9px] font-mono text-text-muted leading-tight uppercase tracking-wider">
                {role === "admin" ? "Institutional Admin" : "Retail Client"}
              </span>
            </div>
            <ChevronDown size={12} className="text-text-muted shrink-0 mr-1" />
          </button>

          {/* Dropdown list */}
          {dropdownOpen && (
            <div className="absolute right-0 mt-2.5 w-60 rounded-xl bg-surface-elevated/95 backdrop-blur-xl border border-glass-border shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-top-3 duration-200">
              
              {/* Profile card summary */}
              <div className="p-3 border-b border-glass-border mb-2">
                <span className="text-[9px] font-mono text-text-muted uppercase tracking-wider block">Currently Signed In</span>
                <span className="text-xs font-bold text-text-primary block mt-0.5">{username}</span>
                <div className="mt-1.5 flex items-center gap-1.5">
                  <span className={`w-1.5 h-1.5 rounded-full ${role === "admin" ? "bg-neon-purple animate-pulse" : "bg-neon-blue"}`} />
                  <span className="text-[9px] font-mono uppercase text-text-secondary">
                    {role === "admin" ? "Administrator Access" : "Standard Client Access"}
                  </span>
                </div>
              </div>

              {/* Action options */}
              <div className="space-y-1">
                {/* Switch roles */}
                <button
                  onClick={() => {
                    setRole(role === "admin" ? "user" : "admin");
                    setDropdownOpen(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-text-secondary hover:text-text-primary hover:bg-white/5 rounded-lg text-left transition-colors"
                >
                  <UserCheck size={14} className="text-neon-blue" />
                  <span>Switch to {role === "admin" ? "Retail Client" : "Institutional Admin"}</span>
                </button>

                {/* System Control Center (Admin only) */}
                {role === "admin" && (
                  <button
                    onClick={() => {
                      setDemoControlOpen(true);
                      setDropdownOpen(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-neon-purple hover:bg-neon-purple/5 rounded-lg text-left transition-colors font-medium"
                  >
                    <Sliders size={14} className="text-neon-purple" />
                    <span>System Control Panel</span>
                  </button>
                )}

                {/* Reset presets */}
                <button
                  onClick={() => {
                    resetAll();
                    setDropdownOpen(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-text-secondary hover:text-text-primary hover:bg-white/5 rounded-lg text-left transition-colors"
                >
                  <RefreshCw size={13} className="text-text-secondary" />
                  <span>Reset Environment</span>
                </button>

                {/* Sign Out */}
                <button
                  onClick={() => {
                    logout();
                    setDropdownOpen(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-text-muted hover:text-neon-red hover:bg-neon-red/5 rounded-lg text-left transition-colors"
                >
                  <LogOut size={13} />
                  <span>Sign Out Session</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
