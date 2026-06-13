"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { User, Bell, Shield, Key, Palette, Save } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { GlassCard } from "@/components/ui/GlassCard";
import { NeonButton } from "@/components/ui/NeonButton";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { defaultSettings } from "@/lib/dummy-data";

type TabId = "PROFILE" | "NOTIFICATIONS" | "RISK" | "API_KEYS" | "THEME";

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

const tabVariants = {
  hidden: { opacity: 0, x: -10 },
  show: { opacity: 1, x: 0 },
};

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<TabId>("PROFILE");

  // Profile States
  const [profileName, setProfileName] = useState(defaultSettings.profile.name);
  const [profileEmail, setProfileEmail] = useState(defaultSettings.profile.email);
  const [profilePhone, setProfilePhone] = useState("+91 98765 43210");

  // Notification States
  const [sigAlerts, setSigAlerts] = useState(defaultSettings.notifications.signalAlerts);
  const [tradeExecuted, setTradeExecuted] = useState(defaultSettings.notifications.tradeExecuted);
  const [dailySummary, setDailySummary] = useState(defaultSettings.notifications.dailySummary);
  const [riskAlerts, setRiskAlerts] = useState(defaultSettings.notifications.riskAlerts);
  const [emailNotif, setEmailNotif] = useState(defaultSettings.notifications.emailNotifications);
  const [pushNotif, setPushNotif] = useState(defaultSettings.notifications.pushNotifications);

  // Risk States
  const [maxPositionSize, setMaxPositionSize] = useState(defaultSettings.risk.maxPositionSize);
  const [maxDailyLoss, setMaxDailyLoss] = useState(defaultSettings.risk.maxDailyLoss);
  const [maxOpenPositions, setMaxOpenPositions] = useState(defaultSettings.risk.maxOpenPositions);
  const [riskPerTrade, setRiskPerTrade] = useState(defaultSettings.risk.riskPerTrade);
  const [emergencyStop, setEmergencyStop] = useState(defaultSettings.risk.emergencyStopEnabled);
  const [trailingStop, setTrailingStop] = useState(defaultSettings.risk.trailingStopEnabled);

  const handleSaveSettings = () => {
    alert("Settings saved successfully.");
  };

  const tabs = [
    { id: "PROFILE", label: "Profile", icon: User },
    { id: "NOTIFICATIONS", label: "Notifications", icon: Bell },
    { id: "RISK", label: "Risk Management", icon: Shield },
    { id: "API_KEYS", label: "API Keys", icon: Key },
    { id: "THEME", label: "Theme & Styling", icon: Palette },
  ];

  return (
    <div className="flex flex-col flex-1">
      <Header title="Settings" subtitle="Platform configuration" />

      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Tab Navigation Sidebar */}
          <div className="lg:col-span-3 flex flex-col gap-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as TabId)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-xs font-semibold uppercase tracking-wider rounded-xl border transition-all duration-300 cursor-pointer ${
                    isActive
                      ? "text-neon-blue bg-neon-blue/10 border-neon-blue/20"
                      : "text-text-secondary hover:text-text-primary border-transparent bg-transparent hover:bg-white/5"
                  }`}
                >
                  <Icon size={14} className={isActive ? "text-neon-blue" : "text-text-secondary"} />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Tab Content Panel */}
          <div className="lg:col-span-9 flex flex-col">
            <GlassCard className="flex-1 border border-glass-border p-6 flex flex-col justify-between" glow="none">
              <div className="space-y-6">
                <AnimatePresence mode="wait">
                  {/* PROFILE TAB */}
                  {activeTab === "PROFILE" && (
                    <motion.div
                      key="profile"
                      variants={containerVariants}
                      initial="hidden"
                      animate="show"
                      exit="hidden"
                      className="space-y-4"
                    >
                      <h3 className="text-xs font-semibold text-text-primary uppercase tracking-wider mb-2">
                        Account Profile settings
                      </h3>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[10px] text-text-secondary uppercase">Full Name</label>
                          <input
                            type="text"
                            value={profileName}
                            onChange={(e) => setProfileName(e.target.value)}
                            className="bg-white/5 border border-glass-border rounded-xl px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-neon-blue/50"
                          />
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[10px] text-text-secondary uppercase">Email Address</label>
                          <input
                            type="email"
                            value={profileEmail}
                            onChange={(e) => setProfileEmail(e.target.value)}
                            className="bg-white/5 border border-glass-border rounded-xl px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-neon-blue/50"
                          />
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[10px] text-text-secondary uppercase">Phone Number</label>
                          <input
                            type="text"
                            value={profilePhone}
                            onChange={(e) => setProfilePhone(e.target.value)}
                            className="bg-white/5 border border-glass-border rounded-xl px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-neon-blue/50"
                          />
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[10px] text-text-secondary uppercase">Subscription Tier</label>
                          <div className="flex items-center gap-2 mt-1">
                            <StatusBadge variant="info">
                              {defaultSettings.profile.plan.toUpperCase()}
                            </StatusBadge>
                            <span className="text-[10px] text-text-muted">Linked through billing profile</span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* NOTIFICATIONS TAB */}
                  {activeTab === "NOTIFICATIONS" && (
                    <motion.div
                      key="notifications"
                      variants={containerVariants}
                      initial="hidden"
                      animate="show"
                      exit="hidden"
                      className="space-y-4"
                    >
                      <h3 className="text-xs font-semibold text-text-primary uppercase tracking-wider mb-2">
                        Communication Alerts & Routings
                      </h3>

                      <div className="space-y-3 divide-y divide-glass-border/30">
                        {/* Signal Alerts */}
                        <div className="flex justify-between items-center py-2 text-xs">
                          <div>
                            <span className="font-semibold text-text-primary block">Signal Alert Notifications</span>
                            <span className="text-[10px] text-text-muted mt-0.5">Alert immediately when strategy calculates a new BUY/SELL setup.</span>
                          </div>
                          <div onClick={() => setSigAlerts(!sigAlerts)} className={`toggle-switch ${sigAlerts ? "active" : ""}`} />
                        </div>

                        {/* Trade Executed */}
                        <div className="flex justify-between items-center py-2 pt-3 text-xs">
                          <div>
                            <span className="font-semibold text-text-primary block">Trade Execution Logs</span>
                            <span className="text-[10px] text-text-muted mt-0.5">Alert when auto routing completes a transaction fill.</span>
                          </div>
                          <div onClick={() => setTradeExecuted(!tradeExecuted)} className={`toggle-switch ${tradeExecuted ? "active" : ""}`} />
                        </div>

                        {/* Risk Alerts */}
                        <div className="flex justify-between items-center py-2 pt-3 text-xs">
                          <div>
                            <span className="font-semibold text-text-primary block">Risk Drawdown Alerts</span>
                            <span className="text-[10px] text-text-muted mt-0.5">Warn immediately if net metrics approach daily drawdown limits.</span>
                          </div>
                          <div onClick={() => setRiskAlerts(!riskAlerts)} className={`toggle-switch ${riskAlerts ? "active" : ""}`} />
                        </div>

                        {/* Email */}
                        <div className="flex justify-between items-center py-2 pt-3 text-xs">
                          <div>
                            <span className="font-semibold text-text-primary block">Email Summaries</span>
                            <span className="text-[10px] text-text-muted mt-0.5">Receive daily performance PDF summaries via email.</span>
                          </div>
                          <div onClick={() => setEmailNotif(!emailNotif)} className={`toggle-switch ${emailNotif ? "active" : ""}`} />
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* RISK MANAGEMENT TAB */}
                  {activeTab === "RISK" && (
                    <motion.div
                      key="risk"
                      variants={containerVariants}
                      initial="hidden"
                      animate="show"
                      exit="hidden"
                      className="space-y-4"
                    >
                      <h3 className="text-xs font-semibold text-text-primary uppercase tracking-wider mb-2">
                        Engine Risk Parameters
                      </h3>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[10px] text-text-secondary uppercase">Max Capital Position (₹)</label>
                          <input
                            type="number"
                            value={maxPositionSize}
                            onChange={(e) => setMaxPositionSize(parseFloat(e.target.value))}
                            className="bg-white/5 border border-glass-border rounded-xl px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-neon-blue/50"
                          />
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[10px] text-text-secondary uppercase">Max Daily Drawdown (₹)</label>
                          <input
                            type="number"
                            value={maxDailyLoss}
                            onChange={(e) => setMaxDailyLoss(parseFloat(e.target.value))}
                            className="bg-white/5 border border-glass-border rounded-xl px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-neon-blue/50"
                          />
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[10px] text-text-secondary uppercase">Risk Per Trade (%)</label>
                          <input
                            type="number"
                            step="0.1"
                            value={riskPerTrade}
                            onChange={(e) => setRiskPerTrade(parseFloat(e.target.value))}
                            className="bg-white/5 border border-glass-border rounded-xl px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-neon-blue/50"
                          />
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[10px] text-text-secondary uppercase">Max Parallel Positions</label>
                          <input
                            type="number"
                            value={maxOpenPositions}
                            onChange={(e) => setMaxOpenPositions(parseInt(e.target.value))}
                            className="bg-white/5 border border-glass-border rounded-xl px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-neon-blue/50"
                          />
                        </div>
                      </div>

                      <div className="h-[1px] bg-glass-border/40 my-4" />

                      <div className="space-y-3.5 text-xs">
                        <div className="flex justify-between items-center">
                          <div>
                            <span className="font-semibold text-text-primary block">Automatic Trailing Stop Loss</span>
                            <span className="text-[10px] text-text-muted mt-0.5">Trailing logic tracks open position highs dynamically.</span>
                          </div>
                          <div onClick={() => setTrailingStop(!trailingStop)} className={`toggle-switch ${trailingStop ? "active" : ""}`} />
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* API KEYS TAB */}
                  {activeTab === "API_KEYS" && (
                    <motion.div
                      key="api"
                      variants={containerVariants}
                      initial="hidden"
                      animate="show"
                      exit="hidden"
                      className="space-y-4"
                    >
                      <h3 className="text-xs font-semibold text-text-primary uppercase tracking-wider mb-2">
                        Broker Connections APIs Keys
                      </h3>

                      <div className="space-y-4">
                        {["Dhan Connection", "Zerodha Connect", "Angel One Smart", "Shoonya API"].map((brokerName, idx) => (
                          <div key={idx} className="flex items-center justify-between p-3 rounded-xl border border-glass-border bg-white/[0.01]">
                            <div className="flex flex-col gap-0.5">
                              <span className="text-xs font-bold text-text-primary">{brokerName}</span>
                              <span className="text-[10px] font-mono text-text-muted">KEY: ***************************29f8</span>
                            </div>

                            <div className="flex gap-2">
                              <button className="text-[10px] font-semibold uppercase text-neon-blue bg-neon-blue/5 border border-neon-blue/20 px-2.5 py-1 rounded-lg hover:bg-neon-blue/15 transition-all cursor-pointer">
                                Rotate
                              </button>
                              <button className="text-[10px] font-semibold uppercase text-neon-red bg-neon-red/5 border border-neon-red/20 px-2.5 py-1 rounded-lg hover:bg-neon-red/15 transition-all cursor-pointer">
                                Delete
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {/* THEME TAB */}
                  {activeTab === "THEME" && (
                    <motion.div
                      key="theme"
                      variants={containerVariants}
                      initial="hidden"
                      animate="show"
                      exit="hidden"
                      className="space-y-4"
                    >
                      <h3 className="text-xs font-semibold text-text-primary uppercase tracking-wider mb-2">
                        Styling & Terminal Accent Color
                      </h3>

                      <div className="space-y-4 text-xs">
                        {/* Radios */}
                        <div className="space-y-2">
                          <span className="font-semibold text-text-primary block">Terminal Theme Mode</span>
                          <div className="flex gap-4">
                            <label className="flex items-center gap-1.5 cursor-pointer text-text-primary">
                              <input type="radio" checked className="accent-neon-blue" />
                              <span>Dark (Hedge-fund terminal)</span>
                            </label>
                            <label className="flex items-center gap-1.5 text-text-muted cursor-not-allowed opacity-50">
                              <input type="radio" disabled className="accent-neon-blue" />
                              <span>Light (Coming soon)</span>
                            </label>
                          </div>
                        </div>

                        {/* Accent selector */}
                        <div className="space-y-2">
                          <span className="font-semibold text-text-primary block">Accent Highlight Color</span>
                          <div className="flex items-center gap-3">
                            <div className="w-6 h-6 rounded-full bg-neon-blue border-2 border-white cursor-pointer shadow-[0_0_10px_#00d4ff]" />
                            <div className="w-6 h-6 rounded-full bg-neon-green border border-transparent cursor-not-allowed opacity-40" />
                            <div className="w-6 h-6 rounded-full bg-neon-purple border border-transparent cursor-not-allowed opacity-40" />
                            <div className="w-6 h-6 rounded-full bg-neon-amber border border-transparent cursor-not-allowed opacity-40" />
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Save Button */}
              <div className="mt-8 pt-4 border-t border-glass-border/30 flex justify-end">
                <NeonButton variant="blue" size="sm" onClick={handleSaveSettings} className="flex items-center gap-1.5 font-bold">
                  <Save size={14} />
                  Save Settings
                </NeonButton>
              </div>
            </GlassCard>
          </div>
        </div>
      </div>
    </div>
  );
}
