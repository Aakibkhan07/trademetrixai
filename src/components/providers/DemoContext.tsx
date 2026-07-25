"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export type UserRole = "user" | "admin";

export interface DemoSettings {
  role: UserRole;
  capital: number;
  winRate: number;
  activeStrategiesCount: number;
  username: string;
}

export interface DemoNotification {
  id: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning";
  timestamp: string;
}

export interface DemoLead {
  id: string;
  name: string;
  email: string;
  phone: string;
  capital: number;
  broker: string;
  timestamp: string;
  strategyContext?: string;
}

interface DemoContextType {
  role: UserRole;
  capital: number;
  winRate: number;
  activeStrategiesCount: number;
  username: string;
  notifications: DemoNotification[];
  isDemoControlOpen: boolean;
  isLoggedIn: boolean;
  setRole: (role: UserRole) => void;
  updateSettings: (settings: Partial<DemoSettings>) => void;
  setDemoControlOpen: (open: boolean) => void;
  injectNotification: (title: string, message: string, type?: DemoNotification["type"]) => void;
  clearNotification: (id: string) => void;
  resetAll: () => void;
  login: (role: UserRole) => void;
  logout: () => void;
  leads: DemoLead[];
  isLeadModalOpen: boolean;
  leadModalContext: string;
  openLeadModal: (context?: string) => void;
  closeLeadModal: () => void;
  submitLead: (name: string, email: string, phone: string, capital: number, broker: string, strategyContext?: string) => void;
}

const DEFAULT_SETTINGS: DemoSettings = {
  role: "user",
  capital: 2500000,
  winRate: 74.5,
  activeStrategiesCount: 5,
  username: "Retail Trader (User)",
};

const DemoContext = createContext<DemoContextType | undefined>(undefined);

export function DemoProvider({ children }: { children: React.ReactNode }) {
  const [role, setRoleState] = useState<UserRole>("user");
  const [capital, setCapital] = useState(2500000);
  const [winRate, setWinRate] = useState(74.5);
  const [activeStrategiesCount, setActiveStrategiesCount] = useState(5);
  const [username, setUsername] = useState("Retail Trader (User)");
  const [notifications, setNotifications] = useState<DemoNotification[]>([]);
  const [isDemoControlOpen, setDemoControlOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [leads, setLeads] = useState<DemoLead[]>([]);
  const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);
  const [leadModalContext, setLeadModalContext] = useState("");

  // Load from localStorage on mount
  useEffect(() => {
    const loadFromStorage = () => {
      try {
        const storedLoggedIn = localStorage.getItem("tm_demo_logged_in");
        if (storedLoggedIn === "true") {
          setIsLoggedIn(true);
        } else {
          setIsLoggedIn(false);
        }

        const storedRole = localStorage.getItem("tm_demo_role") as UserRole;
        if (storedRole) setRoleState(storedRole);

        const storedCapital = localStorage.getItem("tm_demo_capital");
        if (storedCapital) setCapital(parseFloat(storedCapital));

        const storedWinRate = localStorage.getItem("tm_demo_winrate");
        if (storedWinRate) setWinRate(parseFloat(storedWinRate));

        const storedStrategiesCount = localStorage.getItem("tm_demo_strategies");
        if (storedStrategiesCount) setActiveStrategiesCount(parseInt(storedStrategiesCount));

        const storedUsername = localStorage.getItem("tm_demo_username");
        if (storedUsername) setUsername(storedUsername);

        const storedLeads = localStorage.getItem("tm_demo_leads");
        if (storedLeads) setLeads(JSON.parse(storedLeads));
      } catch (e) {
        console.error("Failed to load demo configurations", e);
      }
    };

    loadFromStorage();

    window.addEventListener("storage", loadFromStorage);
    return () => window.removeEventListener("storage", loadFromStorage);
  }, []);

  const openLeadModal = (context?: string) => {
    setLeadModalContext(context || "General Onboarding");
    setIsLeadModalOpen(true);
  };

  const closeLeadModal = () => {
    setIsLeadModalOpen(false);
    setLeadModalContext("");
  };

  const submitLead = (name: string, email: string, phone: string, capVal: number, broker: string, strategyContext?: string) => {
    const newLead: DemoLead = {
      id: `lead-${Date.now()}`,
      name,
      email,
      phone,
      capital: capVal,
      broker,
      timestamp: new Date().toLocaleString("en-IN"),
      strategyContext: strategyContext || leadModalContext || "General Onboarding",
    };
    
    setLeads((prev) => {
      const updated = [newLead, ...prev];
      try {
        localStorage.setItem("tm_demo_leads", JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    // Send to n8n lead qualification webhook
    fetch("https://n8n.trademetrix.tech/webhook/lead-qualify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        email,
        phone,
        capital: capVal,
        broker,
        message: `Interested in ${strategyContext || leadModalContext || "General Onboarding"} with ₹${capVal.toLocaleString()} capital via ${broker}`
      })
    }).catch(() => {});

    injectNotification(
      "Lead Registered",
      `Successfully registered routing interest for ${name} (₹${capVal.toLocaleString()} via ${broker}).`,
      "success"
    );
  };

  const setRole = (newRole: UserRole) => {
    setRoleState(newRole);
    const userDisplay = newRole === "admin" ? "Demo Master (Admin)" : "Retail Trader (User)";
    setUsername(userDisplay);
    try {
      localStorage.setItem("tm_demo_role", newRole);
      localStorage.setItem("tm_demo_username", userDisplay);
    } catch (e) {}
    
    // Automatically inject a system notification when switching roles
    injectNotification(
      "Profile Shifted",
      `Switched environment to ${newRole === "admin" ? "Administrator Demo Console" : "Standard Client Dashboard"}.`,
      "info"
    );
  };

  const login = (selectedRole: UserRole) => {
    setIsLoggedIn(true);
    setRoleState(selectedRole);
    const userDisplay = selectedRole === "admin" ? "Demo Master (Admin)" : "Retail Trader (User)";
    setUsername(userDisplay);
    
    // Set matching default capitals
    const defaultCapital = selectedRole === "admin" ? 10000000 : 2500000;
    setCapital(defaultCapital);

    try {
      localStorage.setItem("tm_demo_logged_in", "true");
      localStorage.setItem("tm_demo_role", selectedRole);
      localStorage.setItem("tm_demo_username", userDisplay);
      localStorage.setItem("tm_demo_capital", defaultCapital.toString());
    } catch (e) {}

    injectNotification(
      "Signed In",
      `Welcome back! Logged in as ${userDisplay}.`,
      "success"
    );
  };

  const logout = () => {
    setIsLoggedIn(false);
    try {
      localStorage.removeItem("tm_demo_logged_in");
      localStorage.removeItem("tm_demo_role");
      localStorage.removeItem("tm_demo_username");
    } catch (e) {}
    injectNotification("Signed Out", "You have been securely signed out.", "info");
  };

  const updateSettings = (settings: Partial<DemoSettings>) => {
    try {
      if (settings.role !== undefined) {
        setRoleState(settings.role);
        localStorage.setItem("tm_demo_role", settings.role);
      }
      if (settings.capital !== undefined) {
        setCapital(settings.capital);
        localStorage.setItem("tm_demo_capital", settings.capital.toString());
      }
      if (settings.winRate !== undefined) {
        setWinRate(settings.winRate);
        localStorage.setItem("tm_demo_winrate", settings.winRate.toString());
      }
      if (settings.activeStrategiesCount !== undefined) {
        setActiveStrategiesCount(settings.activeStrategiesCount);
        localStorage.setItem("tm_demo_strategies", settings.activeStrategiesCount.toString());
      }
      if (settings.username !== undefined) {
        setUsername(settings.username);
        localStorage.setItem("tm_demo_username", settings.username);
      }
    } catch (e) {
      console.error("Failed to store updated configurations", e);
    }
  };

  const injectNotification = (title: string, message: string, type: DemoNotification["type"] = "success") => {
    const newNotif: DemoNotification = {
      id: `notif-${Date.now()}`,
      title,
      message,
      type,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    };
    
    setNotifications((prev) => [newNotif, ...prev].slice(0, 10)); // Limit to last 10 alerts
  };

  const clearNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const resetAll = () => {
    setRoleState(DEFAULT_SETTINGS.role);
    setCapital(DEFAULT_SETTINGS.capital);
    setWinRate(DEFAULT_SETTINGS.winRate);
    setActiveStrategiesCount(DEFAULT_SETTINGS.activeStrategiesCount);
    setUsername(DEFAULT_SETTINGS.username);
    setNotifications([]);
    setDemoControlOpen(false);

    try {
      localStorage.removeItem("tm_demo_role");
      localStorage.removeItem("tm_demo_capital");
      localStorage.removeItem("tm_demo_winrate");
      localStorage.removeItem("tm_demo_strategies");
      localStorage.removeItem("tm_demo_username");
      localStorage.removeItem("tm_demo_leads");
    } catch (e) {}

    setLeads([]);
    injectNotification("Reset Environment", "All values restored to standard presets.", "warning");
  };

  return (
    <DemoContext.Provider
      value={{
        role,
        capital,
        winRate,
        activeStrategiesCount,
        username,
        notifications,
        isDemoControlOpen,
        isLoggedIn,
        setRole,
        updateSettings,
        setDemoControlOpen,
        injectNotification,
        clearNotification,
        resetAll,
        login,
        logout,
        leads,
        isLeadModalOpen,
        leadModalContext,
        openLeadModal,
        closeLeadModal,
        submitLead,
      }}
    >
      {children}
    </DemoContext.Provider>
  );
}

export function useDemo() {
  const context = useContext(DemoContext);
  if (context === undefined) {
    throw new Error("useDemo must be used within a DemoProvider");
  }
  return context;
}
