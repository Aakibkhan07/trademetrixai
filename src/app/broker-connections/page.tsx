"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ShieldAlert, CheckCircle, RefreshCw, Key, HelpCircle, ChevronDown, ChevronUp, Lock, Server, Wifi, WifiOff, Database, AlertCircle } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { GlassCard } from "@/components/ui/GlassCard";
import { NeonButton } from "@/components/ui/NeonButton";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useDemo } from "@/components/providers/DemoContext";
import { useMarketData } from "@/components/providers/MarketDataContext";
import { brokerConfigs } from "@/lib/dummy-data";

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100 } as const },
};

export default function BrokerConnectionsPage() {
  const { role, injectNotification } = useDemo();
  const { openAlgoConfig, updateOpenAlgoConfig, openAlgoStatus } = useMarketData();
  const isAdmin = role === "admin";

  const [openAlgoHost, setOpenAlgoHost] = useState(openAlgoConfig.host);
  const [openAlgoHttpHost, setOpenAlgoHttpHost] = useState(openAlgoConfig.httpHost || "http://127.0.0.1:5000");
  const [openAlgoKey, setOpenAlgoKey] = useState(openAlgoConfig.apiKey);
  const [showOpenAlgoHelp, setShowOpenAlgoHelp] = useState(false);
  const [testingOpenAlgo, setTestingOpenAlgo] = useState(false);

  useEffect(() => {
    if (openAlgoConfig.host) setOpenAlgoHost(openAlgoConfig.host);
    if (openAlgoConfig.httpHost) setOpenAlgoHttpHost(openAlgoConfig.httpHost);
    if (openAlgoConfig.apiKey) setOpenAlgoKey(openAlgoConfig.apiKey);
  }, [openAlgoConfig]);

  const handleToggleOpenAlgo = () => {
    if (!isAdmin) {
      injectNotification("Permission Denied", "Admin permissions required to modify market feeds.", "warning");
      return;
    }
    
    const nextEnabled = !openAlgoConfig.enabled;
    updateOpenAlgoConfig({
      host: openAlgoHost,
      httpHost: openAlgoHttpHost,
      apiKey: openAlgoKey,
      enabled: nextEnabled
    });
    
    injectNotification(
      nextEnabled ? "Feed Connecting" : "Feed Disconnected",
      nextEnabled ? `Initiating WebSocket feed to ${openAlgoHost}` : "Reverted to local market feed.",
      nextEnabled ? "success" : "warning"
    );
  };

  const handleTestOpenAlgo = () => {
    if (!isAdmin) {
      injectNotification("Permission Denied", "Admin permissions required to trigger network handshakes.", "warning");
      return;
    }

    setTestingOpenAlgo(true);
    setTimeout(() => {
      setTestingOpenAlgo(false);
      updateOpenAlgoConfig({
        host: openAlgoHost,
        httpHost: openAlgoHttpHost,
        apiKey: openAlgoKey
      });
      injectNotification("Handshake Sent", "Pinging OpenAlgo WebSocket port. Status will update live.", "success");
    }, 1500);
  };

  const [brokersState, setBrokersState] = useState(
    brokerConfigs.map((b) => ({
      ...b,
      apiKey: "*********************",
      apiSecret: "*********************",
      clientId: b.id.replace("b-", "CL-"),
      lastConnected: "2026-06-12 15:30",
    }))
  );

  const [expandedRequirement, setExpandedRequirement] = useState<string | null>(null);
  const [testingId, setTestingId] = useState<string | null>(null);

  const handleTestConnection = (id: string) => {
    if (!isAdmin) {
      injectNotification("Permission Denied", "Admin permissions required to trigger network handshakes.", "warning");
      return;
    }

    setTestingId(id);
    setTimeout(() => {
      setTestingId(null);
      setBrokersState((prev) =>
        prev.map((b) =>
          b.id === id
            ? {
                ...b,
                status: "connected",
                lastConnected: new Date().toISOString().replace("T", " ").substring(0, 16),
              }
            : b
        )
      );
      injectNotification("Connection Verified", `Successfully synced API channels.`, "success");
    }, 1500);
  };

  const handleSaveCredentials = (id: string) => {
    if (!isAdmin) {
      injectNotification("Permission Denied", "Admin credentials required to save new API key bindings.", "warning");
      return;
    }
    injectNotification("Credentials Saved", "Broker API keys securely encrypted and committed.", "success");
  };

  const handleInputChange = () => {
    if (!isAdmin) {
      injectNotification("Fields Locked", "Administrator clearances required to edit API credentials.", "warning");
    }
  };

  const connectionRequirements = [
    {
      id: "dhan",
      name: "Dhan API Setup Guide",
      steps: [
        "Login to Dhan web portal (web.dhan.co).",
        "Navigate to Profile > DhanHQ API Console.",
        "Generate a new Access Token with trade permissions.",
        "Copy and paste the Client ID and Access Token here.",
      ],
    },
    {
      id: "zerodha",
      name: "Zerodha Kite Connect Setup Guide",
      steps: [
        "Create an account on Zerodha Developer console (developers.kite.trade).",
        "Create a new App (Note: subscription charges may apply).",
        "Copy the API Key and API Secret from app dashboard.",
        "Input credentials along with Client ID and save.",
      ],
    },
    {
      id: "angel",
      name: "Angel One SmartAPI Setup Guide",
      steps: [
        "Register on Angel One SmartAPI platform (smartapi.angelbroking.com).",
        "Create an app inside the dashboard to get API Key.",
        "Input Client ID, password, API key, and generate TOTP.",
      ],
    },
    {
      id: "shoonya",
      name: "Shoonya Finvasia API Setup Guide",
      steps: [
        "Request API enablement via Shoonya customer support.",
        "Once approved, you will receive Client ID, API Key, and Secret.",
        "Input credentials along with vendor code and save.",
      ],
    },
  ];

  return (
    <div className="flex flex-col flex-1">
      <Header title="Broker Connections" subtitle="Manage your broker API connections" />

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="p-6 space-y-6"
      >
        {/* User/Admin Role warning banner */}
        {!isAdmin && (
          <GlassCard className="border border-neon-purple/20 bg-neon-purple/5 p-4 flex items-center gap-3 text-xs">
            <Lock className="text-neon-purple shrink-0 animate-pulse font-bold" size={16} />
            <span className="text-text-secondary leading-relaxed">
              <strong>Administrative Clearance Required:</strong> Standard users can view synchronized status metrics but cannot edit credentials, swap API keys, or fire connection handshakes. Switch to Prop Desk Admin profile to manage credentials.
            </span>
          </GlassCard>
        )}

        {/* OpenAlgo Bridge Card */}
        <motion.div variants={itemVariants}>
          <GlassCard className={`border border-glass-border p-6 flex flex-col justify-between relative overflow-hidden transition-all duration-300 ${!isAdmin ? "opacity-80" : ""}`} glow={openAlgoConfig.enabled && openAlgoStatus === "connected" ? "green" : openAlgoStatus === "error" ? "red" : "none"}>
            {!isAdmin && (
              <div className="absolute top-3 right-4 flex items-center gap-1 text-[9px] font-mono text-neon-purple uppercase">
                <Lock size={10} /> Locked
              </div>
            )}

            <div>
              {/* Header section */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5 pb-4 border-b border-glass-border/30">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-neon-blue/10 border border-neon-blue/20 rounded-xl">
                    <Server className="text-neon-blue w-6 h-6 animate-pulse" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-text-primary">OpenAlgo API Bridge</h3>
                      <span className="text-[9px] bg-neon-blue/10 text-neon-blue border border-neon-blue/20 px-1.5 py-0.5 rounded font-mono font-bold uppercase">WebSockets</span>
                    </div>
                    <p className="text-[10px] text-text-secondary mt-0.5">
                      Stream unified real-time Indian stock market feeds (NSE/BSE) directly from your self-hosted API bridge.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end sm:self-auto">
                  <StatusBadge
                    variant={
                      openAlgoConfig.enabled && openAlgoStatus === "connected"
                        ? "success"
                        : openAlgoStatus === "connecting"
                        ? "warning"
                        : openAlgoStatus === "error"
                        ? "danger"
                        : "inactive"
                    }
                    pulse={openAlgoConfig.enabled && (openAlgoStatus === "connected" || openAlgoStatus === "connecting")}
                  >
                    {openAlgoConfig.enabled ? openAlgoStatus.toUpperCase() : "FEED DISABLED"}
                  </StatusBadge>

                  <div
                    onClick={handleToggleOpenAlgo}
                    className={`toggle-switch ${openAlgoConfig.enabled ? "active" : ""} ${
                      !isAdmin ? "opacity-40 cursor-not-allowed" : "cursor-pointer"
                    }`}
                    title={isAdmin ? "Toggle real-time WebSocket market data feed" : "Administrator privileges required"}
                  />
                </div>
              </div>

              {/* Form Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] text-text-secondary uppercase font-semibold block mb-1">
                      OpenAlgo Bridge Host
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={openAlgoHost}
                        onChange={(e) => {
                          if (!isAdmin) {
                            injectNotification("Fields Locked", "Administrator credentials required to edit API host.", "warning");
                            return;
                          }
                          setOpenAlgoHost(e.target.value);
                        }}
                        disabled={!isAdmin || openAlgoConfig.enabled}
                        placeholder="ws://127.0.0.1:8765"
                        className="w-full bg-white/5 border border-glass-border rounded-xl px-3.5 py-2 text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-neon-blue/50 disabled:opacity-50"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] text-text-secondary uppercase font-semibold block mb-1">
                      OpenAlgo HTTP API Host
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={openAlgoHttpHost}
                        onChange={(e) => {
                          if (!isAdmin) {
                            injectNotification("Fields Locked", "Administrator credentials required to edit API HTTP host.", "warning");
                            return;
                          }
                          setOpenAlgoHttpHost(e.target.value);
                        }}
                        disabled={!isAdmin || openAlgoConfig.enabled}
                        placeholder="http://127.0.0.1:5000"
                        className="w-full bg-white/5 border border-glass-border rounded-xl px-3.5 py-2 text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-neon-blue/50 disabled:opacity-50"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] text-text-secondary uppercase font-semibold block mb-1">
                      Bridge API Key
                    </label>
                    <div className="relative">
                      <input
                        type="password"
                        value={openAlgoKey}
                        onChange={(e) => {
                          if (!isAdmin) {
                            injectNotification("Fields Locked", "Administrator credentials required to edit API keys.", "warning");
                            return;
                          }
                          setOpenAlgoKey(e.target.value);
                        }}
                        disabled={!isAdmin || openAlgoConfig.enabled}
                        placeholder="Your OpenAlgo API Key"
                        className="w-full bg-white/5 border border-glass-border rounded-xl px-3.5 py-2 text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-neon-blue/50 disabled:opacity-50 font-mono"
                      />
                    </div>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <NeonButton
                      variant="outline"
                      size="sm"
                      onClick={handleTestOpenAlgo}
                      disabled={!isAdmin || testingOpenAlgo || openAlgoConfig.enabled}
                      className="flex items-center gap-1.5"
                    >
                      {testingOpenAlgo ? (
                        <RefreshCw size={12} className="animate-spin text-neon-blue" />
                      ) : (
                        <Wifi size={12} className="text-neon-blue" />
                      )}
                      Test Handshake
                    </NeonButton>
                    
                    <button
                      type="button"
                      onClick={() => setShowOpenAlgoHelp(!showOpenAlgoHelp)}
                      className="text-xs text-text-secondary hover:text-text-primary flex items-center gap-1 transition-colors"
                    >
                      <HelpCircle size={13} />
                      {showOpenAlgoHelp ? "Hide Setup Guide" : "Show Setup Guide"}
                    </button>
                  </div>
                </div>

                {/* Connection details / setup guide */}
                <div className="bg-white/[0.01] border border-glass-border/30 rounded-xl p-4 flex flex-col justify-between">
                  <div className="space-y-2 text-xs text-text-secondary">
                    <div className="flex items-center gap-1.5 font-bold text-text-primary text-[11px] mb-1">
                      <Database size={13} className="text-neon-blue" />
                      DATA SUBSCRIPTIONS
                    </div>
                    <p className="text-[10px] leading-relaxed">
                      Syncs 12 major assets in real-time mode: <code className="text-neon-blue">NIFTY 50</code>, <code className="text-neon-blue">BANKNIFTY</code>, <code className="text-neon-blue">SENSEX</code>, and blue-chips (<code className="text-text-primary">RELIANCE</code>, <code className="text-text-primary">TCS</code>, <code className="text-text-primary">SBIN</code>, <code className="text-text-primary">HDFCBANK</code>, etc.).
                    </p>
                    <div className="text-[10px] border-t border-glass-border/20 pt-2 space-y-1">
                      <div className="flex justify-between">
                        <span>Standard API Port:</span>
                        <span className="font-mono font-bold text-text-primary">8765</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Subscription Mode:</span>
                        <span className="font-mono text-neon-green">LTP Ticks (Mode 1)</span>
                      </div>
                    </div>
                  </div>

                    <div className="mt-3 p-2 rounded-lg bg-neon-green/5 border border-neon-green/20 flex items-center gap-2 text-[10px] text-neon-green">
                      <CheckCircle size={12} />
                      <span>Live WebSocket link established. Local market feed bypassed.</span>
                    </div>

                  {openAlgoConfig.enabled && openAlgoStatus === "connecting" && (
                    <div className="mt-3 p-2 rounded-lg bg-neon-yellow/5 border border-neon-yellow/20 flex items-center gap-2 text-[10px] text-neon-yellow">
                      <RefreshCw size={12} className="animate-spin" />
                      <span>Waiting for OpenAlgo authentication...</span>
                    </div>
                  )}

                  {openAlgoConfig.enabled && openAlgoStatus === "error" && (
                    <div className="mt-3 p-2 rounded-lg bg-neon-red/5 border border-neon-red/20 flex items-center gap-2 text-[10px] text-neon-red">
                      <AlertCircle size={12} />
                      <span>Connection failed. Verify host and API Key credentials.</span>
                    </div>
                  )}

                  {!openAlgoConfig.enabled && (
                    <div className="mt-3 p-2 rounded-lg bg-white/5 border border-glass-border flex items-center gap-2 text-[10px] text-text-muted">
                      <WifiOff size={12} />
                      <span>Bridge offline. Routing ticks via Yahoo Finance & local market feed.</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Collapsible setup instructions */}
              <AnimatePresence>
                {showOpenAlgoHelp && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden mt-5"
                  >
                    <div className="p-4 bg-white/[0.01] border-t border-glass-border/30 text-xs text-text-secondary space-y-2 mt-2 leading-relaxed">
                      <h4 className="font-bold text-text-primary mb-1">How to connect OpenAlgo Bridge:</h4>
                      <ol className="list-decimal pl-4 space-y-1.5 text-[11px]">
                        <li>
                          Run OpenAlgo locally on your trading server/machine (default port is <code className="bg-white/10 px-1 py-0.5 rounded font-mono">8765</code>).
                        </li>
                        <li>
                          Open the OpenAlgo Web UI (usually <a href="http://127.0.0.1:5000" target="_blank" rel="noreferrer" className="text-neon-blue underline hover:text-white">http://127.0.0.1:5000</a>), navigate to **API Keys**, and copy your active bridge key.
                        </li>
                        <li>
                          Ensure you have logged in to your stock broker console inside OpenAlgo so that the data feed is active.
                        </li>
                        <li>
                          Paste the WebSocket URL (e.g. <code className="bg-white/10 px-1 py-0.5 rounded font-mono">ws://127.0.0.1:8765</code>) and your API Key here.
                        </li>
                        <li>
                          Toggle **Enable Feed** on. The status will update to **CONNECTED** once authenticated, and your terminal will begin ticking with actual real-time broker feeds instantly.
                        </li>
                      </ol>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </GlassCard>
        </motion.div>

        {/* Broker Forms Grid */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {brokersState.map((broker) => {
            const isConnected = broker.status === "connected";
            const isTesting = testingId === broker.id;
            return (
              <GlassCard
                key={broker.id}
                className={`border border-glass-border p-5 flex flex-col justify-between h-[360px] relative overflow-hidden transition-all duration-300 ${
                  isConnected ? "hover:border-neon-blue/30" : ""
                } ${!isAdmin ? "opacity-80" : ""}`}
                glow={broker.status === "connected" ? "none" : broker.status === "error" ? "red" : "none"}
              >
                {/* Lock icon indicators */}
                {!isAdmin && (
                  <div className="absolute top-2 right-4 flex items-center gap-1 text-[9px] font-mono text-neon-purple uppercase">
                    <Lock size={10} /> Locked
                  </div>
                )}
                
                <div>
                  {/* Title Bar */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{broker.logo}</span>
                      <span className="text-sm font-bold text-text-primary">{broker.name} API</span>
                    </div>
                    <StatusBadge
                      variant={
                        broker.status === "connected"
                          ? "success"
                          : broker.status === "error"
                          ? "danger"
                          : "inactive"
                      }
                      pulse={isConnected}
                    >
                      {broker.status.toUpperCase()}
                    </StatusBadge>
                  </div>

                  {/* Credentials Fields */}
                  <div className="space-y-3 mt-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex flex-col gap-1">
                        <label className="text-[9px] text-text-secondary uppercase">Client ID</label>
                        <input
                          type="text"
                          disabled={!isAdmin}
                          onClick={handleInputChange}
                          value={broker.clientId}
                          className="bg-white/5 border border-glass-border rounded-xl px-3 py-1.5 text-xs text-text-primary focus:outline-none disabled:opacity-75 disabled:cursor-not-allowed"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[9px] text-text-secondary uppercase">Last Synced</label>
                        <input
                          type="text"
                          disabled
                          value={broker.lastConnected}
                          className="bg-white/5 border border-glass-border rounded-xl px-3 py-1.5 text-xs text-text-muted cursor-not-allowed font-mono"
                        />
                      </div>
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-[9px] text-text-secondary uppercase">API Key / Access ID</label>
                      <input
                        type="password"
                        disabled={!isAdmin}
                        onClick={handleInputChange}
                        value={broker.apiKey}
                        className="bg-white/5 border border-glass-border rounded-xl px-3 py-1.5 text-xs text-text-primary focus:outline-none disabled:opacity-75 disabled:cursor-not-allowed"
                      />
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-[9px] text-text-secondary uppercase">API Secret Key</label>
                      <input
                        type="password"
                        disabled={!isAdmin}
                        onClick={handleInputChange}
                        value={broker.apiSecret}
                        className="bg-white/5 border border-glass-border rounded-xl px-3 py-1.5 text-xs text-text-primary focus:outline-none disabled:opacity-75 disabled:cursor-not-allowed"
                      />
                    </div>
                  </div>
                </div>

                {/* Card footer buttons */}
                <div className="flex gap-3 mt-6 pt-4 border-t border-glass-border/30">
                  <NeonButton
                    variant="outline"
                    size="sm"
                    fullWidth
                    disabled={isTesting || !isAdmin}
                    onClick={() => handleTestConnection(broker.id)}
                    className="flex items-center justify-center gap-1.5 font-bold disabled:opacity-50"
                  >
                    <RefreshCw size={13} className={isTesting ? "animate-spin" : ""} />
                    {isTesting ? "Testing..." : "Test Connection"}
                  </NeonButton>
                  <NeonButton
                    variant="blue"
                    size="sm"
                    fullWidth
                    disabled={!isAdmin}
                    onClick={() => handleSaveCredentials(broker.id)}
                    className="flex items-center justify-center gap-1.5 font-bold disabled:opacity-50"
                  >
                    <Key size={13} />
                    Save Keys
                  </NeonButton>
                </div>
              </GlassCard>
            );
          })}
        </motion.div>

        {/* Requirements Collapsible Section */}
        <motion.div variants={itemVariants}>
          <GlassCard className="border border-glass-border">
            <div className="flex items-center gap-2 mb-4 text-xs font-semibold text-text-primary uppercase tracking-wider">
              <HelpCircle size={15} className="text-neon-blue" />
              API Credential Guides
            </div>

            <div className="divide-y divide-glass-border/30">
              {connectionRequirements.map((guide) => {
                const isExpanded = expandedRequirement === guide.id;
                return (
                  <div key={guide.id} className="py-3">
                    <button
                      onClick={() => setExpandedRequirement(isExpanded ? null : guide.id)}
                      className="w-full flex items-center justify-between text-xs font-bold text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
                    >
                      <span>{guide.name}</span>
                      {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>

                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <ol className="list-decimal pl-5 py-3 space-y-1.5 text-xs text-text-secondary">
                            {guide.steps.map((step, sIdx) => (
                              <li key={sIdx}>{step}</li>
                            ))}
                          </ol>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </GlassCard>
        </motion.div>
      </motion.div>
    </div>
  );
}
