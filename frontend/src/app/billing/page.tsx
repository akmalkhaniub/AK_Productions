"use client";

import React, { useState, useEffect } from "react";
import { Check, ShieldAlert, CreditCard, Sparkles, RefreshCw, Layers, Focus, HelpCircle, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { apiUrl } from "@/lib/api";

interface Plan {
  id: "free" | "pro" | "enterprise";
  name: string;
  monthlyPrice: number;
  yearlyPrice: number;
  description: string;
  features: string[];
  color: string;
  badge?: string;
}

const PLANS: Plan[] = [
  {
    id: "free",
    name: "Free",
    monthlyPrice: 0,
    yearlyPrice: 0,
    description: "Ideal for basic YouTube ingestion & script viewing.",
    features: [
      "YouTube Script Ingestion (OpenAI)",
      "Standard Script Viewer",
      "Interactive Screenplay Outline",
      "Daily Industry Intelligence Briefs",
      "Visual topography display"
    ],
    color: "border-border hover:border-muted-foreground/30 bg-card/45"
  },
  {
    id: "pro",
    name: "Pro Studio",
    monthlyPrice: 49,
    yearlyPrice: 39,
    description: "Equip your production team with advanced tools.",
    features: [
      "Everything in Free Plan",
      "Visual Continuity Error Detector",
      "AI Dubbing Timbre Cloning",
      "Interactive Annotations & Comments Feed",
      "AI Acting Coach script critiques",
      "3D Skeletal Choreography Generator"
    ],
    color: "border-accent/40 bg-accent/5 ring-1 ring-accent/30",
    badge: "Recommended"
  },
  {
    id: "enterprise",
    name: "Enterprise Swarm",
    monthlyPrice: 199,
    yearlyPrice: 159,
    description: "Scale narrative consistency across full television series.",
    features: [
      "Everything in Pro Studio Plan",
      "Batch Series Script Ingestion",
      "Unified Series Lore Bible builder",
      "Lore Mismatch & Timeline contradiction sweep",
      "Custom Model Selector admin panel",
      "Dedicated swarms & priority support"
    ],
    color: "border-sky-500/40 bg-sky-950/10 hover:border-sky-500/60"
  }
];

export default function BillingPage() {
  const [activePlan, setActivePlan] = useState<string>("free");
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "yearly">("monthly");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [checkoutPlan, setCheckoutPlan] = useState<Plan | null>(null);
  const [isProcessingCheckout, setIsProcessingCheckout] = useState<boolean>(false);
  const [checkoutStep, setCheckoutStep] = useState<"gateway" | "success">("gateway");

  // Load current plan on mount
  const fetchActivePlan = async () => {
    try {
      const res = await fetch(apiUrl("/api/billing/subscription"));
      const resJson = await res.json();
      if (resJson.status === "success") {
        setActivePlan(resJson.data.tier);
      }
    } catch (e) {
      console.error("Error loading subscription plan:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchActivePlan();
  }, []);

  // Launch checkout modal
  const startUpgrade = (plan: Plan) => {
    if (plan.id === activePlan) return;
    setCheckoutPlan(plan);
    setCheckoutStep("gateway");
    setIsProcessingCheckout(false);
  };

  // Perform checkout action
  const confirmCheckout = async () => {
    if (!checkoutPlan) return;
    setIsProcessingCheckout(true);

    try {
      // Simulate checkout gate latency
      await new Promise(r => setTimeout(r, 2000));

      const res = await fetch(apiUrl("/api/billing/subscription"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier: checkoutPlan.id })
      });
      const resJson = await res.json();

      if (resJson.status === "success") {
        setActivePlan(checkoutPlan.id);
        setCheckoutStep("success");
        // Dispatch subscription change event for pages to update if they are open
        window.dispatchEvent(new Event("subscription_updated"));
      }
    } catch (e) {
      console.error("Error upgrading plan:", e);
    } finally {
      setIsProcessingCheckout(false);
    }
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto py-6">
      
      {/* Header */}
      <div className="text-center space-y-3">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-accent/25 bg-accent/10 px-3 py-1 text-xs font-semibold tracking-wider text-accent uppercase">
          <CreditCard className="h-3.5 w-3.5" /> Billing & Subscriptions
        </span>
        <h1 className="text-4xl font-display font-bold tracking-tight text-foreground sm:text-5xl">
          Pricing Plans for Every Swarm size
        </h1>
        <p className="text-base text-muted-foreground max-w-xl mx-auto leading-relaxed">
          Upgrade to unlock advanced visual continuity inspectors, television series lore tracking, and automatic script critiques.
        </p>

        {/* Monthly/Yearly toggle */}
        <div className="flex items-center justify-center gap-3 pt-4">
          <span className={`text-sm ${billingPeriod === "monthly" ? "text-foreground font-semibold" : "text-muted-foreground"}`}>
            Billed Monthly
          </span>
          <button
            onClick={() => setBillingPeriod(p => p === "monthly" ? "yearly" : "monthly")}
            className="w-12 h-6 bg-slate-900 border border-border rounded-full p-1 relative flex items-center"
          >
            <div 
              className={`w-4 h-4 rounded-full bg-accent transition-all ${
                billingPeriod === "yearly" ? "translate-x-6" : "translate-x-0"
              }`}
            />
          </button>
          <span className={`text-sm ${billingPeriod === "yearly" ? "text-foreground font-semibold" : "text-muted-foreground"}`}>
            Billed Yearly <span className="text-[10px] text-green-400 bg-green-500/10 border border-green-500/20 px-1.5 py-0.5 rounded ml-1 uppercase font-bold">Save 20%</span>
          </span>
        </div>
      </div>

      {isLoading ? (
        <div className="min-h-[300px] flex flex-col items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-accent mb-4" />
          <p className="text-muted-foreground text-sm">Synchronizing billing status...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
          {PLANS.map((plan) => {
            const isActive = plan.id === activePlan;
            const price = billingPeriod === "monthly" ? plan.monthlyPrice : plan.yearlyPrice;
            const isFree = plan.id === "free";

            return (
              <div
                key={plan.id}
                className={`rounded-2xl border p-6 flex flex-col h-full relative transition-all shadow-lg ${plan.color}`}
              >
                {plan.badge && (
                  <span className="absolute top-0 right-6 -translate-y-1/2 bg-accent text-accent-foreground text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full shadow-md">
                    {plan.badge}
                  </span>
                )}

                <div className="space-y-2 mb-6">
                  <h3 className="text-xl font-bold text-foreground">{plan.name}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed min-h-[32px]">
                    {plan.description}
                  </p>
                  
                  <div className="pt-3 flex items-baseline">
                    <span className="text-4xl font-extrabold tracking-tight font-mono text-foreground">${price}</span>
                    <span className="text-xs text-muted-foreground ml-2">/ {billingPeriod === "monthly" ? "month" : "year"}</span>
                  </div>
                </div>

                {/* Features list */}
                <div className="flex-1 space-y-3 border-t border-border/60 pt-6 mb-6">
                  {plan.features.map((feat, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-foreground/80 leading-relaxed">
                      <Check className="h-4 w-4 text-accent shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>

                {/* Action button */}
                <button
                  onClick={() => startUpgrade(plan)}
                  disabled={isActive}
                  className={`w-full inline-flex h-11 items-center justify-center rounded-xl font-bold text-xs transition-all tracking-wide ${
                    isActive
                      ? "bg-slate-900 border border-border text-muted-foreground cursor-default"
                      : plan.id === "pro"
                      ? "bg-accent text-accent-foreground hover:bg-accent/90 shadow-lg glow-hover"
                      : "border border-border hover:bg-muted bg-card/60 text-foreground"
                  }`}
                >
                  {isActive ? "Active Plan" : isFree ? "Downgrade" : `Upgrade to ${plan.name}`}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Pricing Comparison Helper Details */}
      <div className="rounded-xl border border-border bg-muted/20 p-5 mt-8 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex gap-3">
          <HelpCircle className="h-8 w-8 text-accent shrink-0" />
          <div>
            <h4 className="text-sm font-semibold text-foreground">Switch plans anytime, no contracts required</h4>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              We offer automatic sandbox simulation upgrades. Simply select a higher plan to unlock visual verification suites, or scale down when script runs are completed.
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setActivePlan("free")}
            className="text-xs text-muted-foreground hover:text-foreground font-semibold px-3 py-1.5 rounded border border-border/60 hover:bg-muted"
          >
            Reset to Free
          </button>
        </div>
      </div>

      {/* Checkout Modal Overlay */}
      <AnimatePresence>
        {checkoutPlan && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md bg-card border border-border rounded-2xl overflow-hidden shadow-2xl relative"
            >
              
              {/* Closing cross */}
              {!isProcessingCheckout && (
                <button
                  onClick={() => setCheckoutPlan(null)}
                  className="absolute top-4 right-4 text-muted-foreground hover:text-foreground p-1 rounded hover:bg-muted transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              )}

              {checkoutStep === "gateway" ? (
                <div className="p-6 space-y-6">
                  
                  {/* Title */}
                  <div className="text-center space-y-1">
                    <div className="mx-auto w-12 h-12 bg-accent/10 border border-accent/20 rounded-full flex items-center justify-center text-accent mb-3">
                      <CreditCard className="h-6 w-6" />
                    </div>
                    <h3 className="text-lg font-bold text-foreground">Secure Checkout Sandbox</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Configure details to activate your **{checkoutPlan.name}** plan.
                    </p>
                  </div>

                  {/* Summary grid */}
                  <div className="bg-slate-950 p-4 rounded-xl border border-border/80 text-xs space-y-3 font-mono">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">PRODUCT:</span>
                      <span className="text-foreground font-bold">{checkoutPlan.name} Subscription</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">BILLING PERIOD:</span>
                      <span className="text-foreground uppercase">{billingPeriod}</span>
                    </div>
                    <div className="h-[1px] bg-border/60" />
                    <div className="flex justify-between text-sm">
                      <span className="text-accent font-bold">TOTAL DUE:</span>
                      <span className="text-accent font-bold">${billingPeriod === "monthly" ? checkoutPlan.monthlyPrice : checkoutPlan.yearlyPrice}</span>
                    </div>
                  </div>

                  {/* Simulated Card input */}
                  <div className="space-y-2">
                    <label className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Simulated Card Details</label>
                    <div className="border border-border bg-slate-950 rounded-xl p-3 text-xs flex items-center gap-2">
                      <CreditCard className="h-4 w-4 text-muted-foreground" />
                      <input
                        type="text"
                        disabled
                        value="••••  ••••  ••••  4242"
                        className="bg-transparent text-foreground outline-none flex-1 font-mono"
                      />
                      <span className="text-muted-foreground font-mono">12/29</span>
                    </div>
                  </div>

                  <button
                    onClick={confirmCheckout}
                    disabled={isProcessingCheckout}
                    className="w-full inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-accent text-accent-foreground font-bold text-xs tracking-wider hover:bg-accent/90 shadow shadow-accent/20 disabled:opacity-50"
                  >
                    {isProcessingCheckout ? (
                      <><Loader2 className="h-4 w-4 animate-spin" /> Authorizing Payment...</>
                    ) : (
                      "Confirm & Pay"
                    )}
                  </button>
                  
                </div>
              ) : (
                <div className="p-6 text-center space-y-5">
                  <div className="mx-auto w-14 h-14 bg-green-500/10 border border-green-500/20 rounded-full flex items-center justify-center text-green-400">
                    <Check className="h-7 w-7" />
                  </div>
                  
                  <div className="space-y-1">
                    <h3 className="text-lg font-bold text-foreground">Upgrade Successful!</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed max-w-[280px] mx-auto">
                      Your Studio OS subscription has been updated. **{checkoutPlan.name}** features are now fully unlocked!
                    </p>
                  </div>

                  <button
                    onClick={() => setCheckoutPlan(null)}
                    className="w-full inline-flex h-11 items-center justify-center rounded-xl border border-border hover:bg-muted text-xs font-bold"
                  >
                    Return to Workspace
                  </button>
                </div>
              )}

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}

// Inline Close helper icon
function X({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M18 6 6 18M6 6l12 12"/>
    </svg>
  );
}
