"use client";

import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Send, CheckCircle, HelpCircle, RefreshCw, Terminal, Eye, AlertTriangle } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { GlassCard } from "@/components/ui/GlassCard";
import { NeonButton } from "@/components/ui/NeonButton";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useDemo } from "@/components/providers/DemoContext";
import { telegramConfig } from "@/lib/dummy-data";

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100 } as const },
};

export default function TelegramIntegrationPage() {
  const { injectNotification } = useDemo();

  const [botToken, setBotToken] = useState("1928471029:AAFj3l_9L2984kLas928skLa0192LkdA");
  const [chatId, setChatId] = useState("-1001928374829");
  const [isConnected, setIsConnected] = useState(false);
  const [autoSend, setAutoSend] = useState(true);
  const [messagesSentCount, setMessagesSentCount] = useState(24);
  const [template, setTemplate] = useState("");
  const [showToken, setShowToken] = useState(false);
  const [testStatus, setTestStatus] = useState<"IDLE" | "SENDING" | "SUCCESS" | "ERROR">("IDLE");

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("tm_telegram_config");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.botToken) setBotToken(parsed.botToken);
        if (parsed.chatId) setChatId(parsed.chatId);
        if (parsed.isConnected !== undefined) setIsConnected(parsed.isConnected);
        if (parsed.autoSend !== undefined) setAutoSend(parsed.autoSend);
        if (parsed.template) setTemplate(parsed.template);
        if (parsed.messagesSentCount !== undefined) setMessagesSentCount(parsed.messagesSentCount);
      } else {
        setTemplate(telegramConfig.signalTemplate);
      }
    } catch (e) {
      console.error("Error loading Telegram config from localStorage:", e);
    }
  }, []);

  const saveConfig = (updated: {
    botToken?: string;
    chatId?: string;
    isConnected?: boolean;
    autoSend?: boolean;
    template?: string;
    messagesSentCount?: number;
  }) => {
    try {
      const saved = localStorage.getItem("tm_telegram_config");
      const current = saved ? JSON.parse(saved) : {
        botToken,
        chatId,
        isConnected,
        autoSend,
        template,
        messagesSentCount
      };
      const merged = { ...current, ...updated };
      localStorage.setItem("tm_telegram_config", JSON.stringify(merged));
    } catch (e) {
      console.error("Failed to save Telegram config:", e);
    }
  };

  const handleConnect = () => {
    const nextConnected = !isConnected;
    setIsConnected(nextConnected);
    saveConfig({ isConnected: nextConnected });
    injectNotification(
      nextConnected ? "Channel Connected" : "Channel Disconnected",
      nextConnected
        ? `Telegram signal routing active for Chat ID ${chatId}`
        : "Telegram signal routing deactivated.",
      nextConnected ? "success" : "warning"
    );
  };

  const handleToggleAutoSend = () => {
    const nextAuto = !autoSend;
    setAutoSend(nextAuto);
    saveConfig({ autoSend: nextAuto });
    injectNotification(
      "Routing Updated",
      nextAuto ? "Instant notification routing enabled." : "Instant notification routing disabled.",
      "info"
    );
  };

  const handleTemplateChange = (val: string) => {
    setTemplate(val);
    saveConfig({ template: val });
  };

  const handleTokenChange = (val: string) => {
    setBotToken(val);
    saveConfig({ botToken: val });
  };

  const handleChatIdChange = (val: string) => {
    setChatId(val);
    saveConfig({ chatId: val });
  };

  const formatMarkdownToHtml = (text: string) => {
    let html = text;
    // Safe escaping of HTML characters
    html = html.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    // Re-allow standard tags we generate: 🚀, 📊, ▶️, 🛑, 🎯, 📈, ⏰, 💡
    // Replace markdown bold *text* with <b>text</b>
    html = html.replace(/\*(.*?)\*/g, "<b>$1</b>");
    // Replace markdown italic _text_ with <i>text</i>
    html = html.replace(/_(.*?)_/g, "<i>$1</i>");
    return html;
  };

  const handleTestMessage = async () => {
    const isPlaceholderToken = botToken === "1928471029:AAFj3l_9L2984kLas928skLa0192LkdA" || !botToken.trim();
    const isPlaceholderChat = chatId === "-1001928374829" || !chatId.trim();

    setTestStatus("SENDING");

    if (isPlaceholderToken || isPlaceholderChat) {
      // Simulation mode
      setTimeout(() => {
        setTestStatus("SUCCESS");
        const nextCount = messagesSentCount + 1;
        setMessagesSentCount(nextCount);
        saveConfig({ messagesSentCount: nextCount });
        injectNotification(
          "Test Message Sent",
          "Simulated signal successfully delivered. Configure your custom Bot Token to connect your real channel.",
          "success"
        );
        setTimeout(() => setTestStatus("IDLE"), 2000);
      }, 1200);
      return;
    }

    try {
      // Build test message body
      const rawText = template || telegramConfig.signalTemplate;
      const formattedText = rawText
        .replace("{symbol}", "BANKNIFTY")
        .replace("{direction}", "BUY")
        .replace("{entry}", "53,200")
        .replace("{stopLoss}", "53,000")
        .replace("{target}", "53,600")
        .replace("{confidence}", "92%");

      const htmlText = formatMarkdownToHtml(formattedText);

      const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: htmlText,
          parse_mode: "HTML",
        }),
      });

      const data = await response.json();

      if (response.ok && data.ok) {
        setTestStatus("SUCCESS");
        const nextCount = messagesSentCount + 1;
        setMessagesSentCount(nextCount);
        saveConfig({ messagesSentCount: nextCount });
        injectNotification(
          "Telegram Verified",
          `Real-time signal delivered successfully to Telegram! Msg ID: ${data.result.message_id}`,
          "success"
        );
        setTimeout(() => setTestStatus("IDLE"), 2000);
      } else {
        setTestStatus("ERROR");
        const errorMsg = data.description || "Unknown Telegram API Error";
        injectNotification("Telegram API Error", errorMsg, "warning");
        setTimeout(() => setTestStatus("IDLE"), 3000);
      }
    } catch (err: any) {
      setTestStatus("ERROR");
      injectNotification("Connection Error", err?.message || "Failed to contact Telegram API", "warning");
      setTimeout(() => setTestStatus("IDLE"), 3000);
    }
  };

  return (
    <div className="flex flex-col flex-1">
      <Header title="Telegram Integration" subtitle="Automated signal delivery" />

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="p-6 space-y-6"
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Connection Panel */}
          <motion.div variants={itemVariants} className="lg:col-span-6 flex flex-col gap-6">
            <GlassCard className="border border-glass-border flex flex-col justify-between p-5" glow="none">
              <div>
                <h2 className="text-xs font-semibold text-text-primary uppercase tracking-wider mb-2">
                  Bot Credentials & Status
                </h2>
                <p className="text-[10px] text-text-secondary mb-4">
                  Register bot credentials here to routing signals directly to custom chats. Settings are saved in your local workspace.
                </p>

                <div className="space-y-4">
                  {/* Token */}
                  <div className="flex flex-col gap-1.5 relative">
                    <label className="text-[10px] text-text-secondary uppercase">Bot Token ID</label>
                    <div className="flex items-center bg-white/5 border border-glass-border rounded-xl pr-3">
                      <input
                        type={showToken ? "text" : "password"}
                        value={botToken}
                        onChange={(e) => handleTokenChange(e.target.value)}
                        placeholder="e.g. 123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ"
                        className="bg-transparent border-0 rounded-xl px-3 py-2 text-xs text-text-primary focus:outline-none w-full font-mono"
                      />
                      <button onClick={() => setShowToken(!showToken)} className="text-text-muted hover:text-neon-blue cursor-pointer">
                        <Eye size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Chat id */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] text-text-secondary uppercase">Chat Group ID</label>
                    <input
                      type="text"
                      value={chatId}
                      onChange={(e) => handleChatIdChange(e.target.value)}
                      placeholder="e.g. -1001234567890"
                      className="bg-white/5 border border-glass-border rounded-xl px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-neon-blue/50 font-mono"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between mt-6">
                  <div className="flex items-center gap-2">
                    <div className={`w-2.5 h-2.5 rounded-full ${isConnected ? "bg-neon-green" : "bg-text-muted"}`} />
                    <span className="text-xs font-semibold text-text-primary">
                      {isConnected ? "Linked & Active" : "Unconnected"}
                    </span>
                  </div>

                  <NeonButton variant={isConnected ? "red" : "blue"} size="sm" onClick={handleConnect}>
                    {isConnected ? "Disconnect Channel" : "Connect Channel"}
                  </NeonButton>
                </div>
              </div>
            </GlassCard>

            {/* Telegram delivery settings */}
            <GlassCard className="border border-glass-border p-5" glow="none">
              <h2 className="text-xs font-semibold text-text-primary uppercase tracking-wider mb-4">
                Routing Configuration
              </h2>

              <div className="space-y-4">
                <div className="flex justify-between items-center text-xs">
                  <div>
                    <span className="font-semibold text-text-primary block">Instant Notification Routing</span>
                    <span className="text-[10px] text-text-muted mt-0.5">Route engine signals instantly upon calculation.</span>
                  </div>
                  <div
                    onClick={handleToggleAutoSend}
                    className={`toggle-switch ${autoSend ? "active" : ""}`}
                  />
                </div>

                <div className="h-[1px] bg-glass-border/40" />

                <div className="flex justify-between items-center text-xs">
                  <div>
                    <span className="font-semibold text-text-primary block">Signals Sent Today</span>
                    <span className="text-[10px] text-text-muted mt-0.5">Cycle resets daily at midnight</span>
                  </div>
                  <span className="text-base font-extrabold font-mono text-neon-blue">{messagesSentCount} Messages</span>
                </div>
              </div>
            </GlassCard>
          </motion.div>

          {/* Telegram Preview Dial */}
          <motion.div variants={itemVariants} className="lg:col-span-6 flex flex-col gap-6">
            <GlassCard className="flex-1 border border-glass-border flex flex-col justify-between p-5" glow="blue">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xs font-semibold text-text-primary uppercase tracking-wider">
                  Live Telegram Preview
                </h2>
                <span className="text-[10px] text-text-muted uppercase font-mono">Format Style</span>
              </div>

              {/* Message bubble mimic */}
              <div className="rounded-xl border border-glass-border bg-gradient-to-b from-[#182533] to-[#121c27] p-4 font-sans text-xs text-text-primary leading-relaxed shadow-lg max-w-sm mx-auto w-full relative">
                {/* Header line */}
                <div className="flex items-center gap-1.5 font-bold mb-2">
                  <span>🚀</span>
                  <span className="uppercase text-neon-blue font-display">Trade Metrix AI Signal</span>
                </div>
                {/* Body details */}
                <div className="space-y-1.5 font-mono">
                  <div>📊 BANKNIFTY — <span className="font-bold text-neon-green bg-neon-green/10 px-1 rounded">BUY</span></div>
                  <div>▶️ Entry: <span className="text-text-primary font-bold">53,200</span></div>
                  <div>🛑 Stop Loss: <span className="text-neon-red font-bold">53,000</span></div>
                  <div>🎯 Target: <span className="text-neon-green font-bold">53,600</span></div>
                  <div>📈 Confidence: <span className="text-neon-blue font-bold">92%</span></div>
                  <div className="font-sans text-[11px] text-text-secondary mt-2">
                    💡 Reasoning: EMA Alignment, Volume Confirmation
                  </div>
                  <div className="text-[9px] text-text-muted mt-3 pt-2 border-t border-white/5">
                    ⏰ Generated: Just now • Powered by Trade Metrix AI
                  </div>
                </div>
              </div>

              <div className="mt-6 flex gap-3">
                <div className="flex-1">
                  <textarea
                    value={template}
                    onChange={(e) => handleTemplateChange(e.target.value)}
                    rows={4}
                    className="w-full bg-white/5 border border-glass-border rounded-xl p-2.5 font-mono text-[10px] text-text-secondary focus:outline-none focus:border-neon-blue/50"
                  />
                </div>
                <div className="flex flex-col justify-end shrink-0">
                  <NeonButton
                    variant="green"
                    size="sm"
                    disabled={testStatus === "SENDING"}
                    onClick={handleTestMessage}
                    className="flex items-center justify-center gap-1 font-bold"
                  >
                    <Send size={13} />
                    {testStatus === "SENDING" ? "Sending..." : "Test Bot"}
                  </NeonButton>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
