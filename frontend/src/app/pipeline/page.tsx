"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, ChevronRight, Sparkles, Clapperboard, Mic2, FileText } from "lucide-react";

const steps = [
  { id: 1, name: "IP Discovery", icon: Sparkles, desc: "Generate a concept" },
  { id: 2, name: "Script Breakdown", icon: FileText, desc: "Extract budget & props" },
  { id: 3, name: "Acting Coach", icon: Clapperboard, desc: "Directorial analysis" },
  { id: 4, name: "Auto-Dubbing", icon: Mic2, desc: "Localization" }
];

export default function PipelineWizard() {
  const [currentStep, setCurrentStep] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [projectData, setProjectData] = useState<any>(null);

  const handleNext = () => {
    setIsProcessing(true);
    // Simulate API call to the agent
    setTimeout(() => {
      setIsProcessing(false);
      setCurrentStep(prev => Math.min(prev + 1, steps.length));
    }, 1500);
  };

  return (
    <div className="max-w-4xl mx-auto py-10">
      <div className="mb-12">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground mb-2">Studio Pipeline</h1>
        <p className="text-muted-foreground">End-to-end autonomous film production lifecycle.</p>
      </div>

      {/* Progress Bar */}
      <div className="flex items-center justify-between mb-12 relative">
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-px bg-border -z-10"></div>
        <div className="absolute left-0 top-1/2 -translate-y-1/2 h-px bg-foreground -z-10 transition-all duration-500 ease-in-out" style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}></div>
        
        {steps.map((step) => (
          <div key={step.id} className="flex flex-col items-center gap-2 bg-background px-4">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors ${currentStep > step.id ? 'bg-foreground border-foreground text-background' : currentStep === step.id ? 'border-foreground text-foreground bg-background' : 'border-border text-muted-foreground bg-background'}`}>
              {currentStep > step.id ? <CheckCircle2 className="w-5 h-5" /> : <step.icon className="w-5 h-5" />}
            </div>
            <div className="text-xs font-medium text-center">
              <span className={currentStep >= step.id ? "text-foreground" : "text-muted-foreground"}>{step.name}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Step Content Shell */}
      <div className="border border-border rounded-xl bg-background p-8 min-h-[400px] shadow-sm flex flex-col">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="flex-1 flex flex-col"
          >
            <h2 className="text-2xl font-semibold mb-2">{steps[currentStep - 1].name}</h2>
            <p className="text-muted-foreground mb-8">{steps[currentStep - 1].desc}</p>
            
            <div className="flex-1 border border-dashed border-border rounded-lg flex items-center justify-center bg-muted/50 p-6">
              {isProcessing ? (
                <div className="flex flex-col items-center text-muted-foreground">
                  <Sparkles className="w-8 h-8 mb-4 animate-pulse" />
                  <p>Agent is processing...</p>
                </div>
              ) : (
                <div className="text-center max-w-md">
                  <p className="text-muted-foreground mb-4">Click "Run Agent" to simulate querying the AI backend and piping the output into the next module.</p>
                </div>
              )}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Footer Actions */}
        <div className="mt-8 flex justify-between items-center pt-6 border-t border-border">
          <button 
            onClick={() => setCurrentStep(prev => Math.max(prev - 1, 1))}
            disabled={currentStep === 1 || isProcessing}
            className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground disabled:opacity-50"
          >
            Back
          </button>
          
          <button 
            onClick={handleNext}
            disabled={currentStep === steps.length || isProcessing}
            className="inline-flex h-10 items-center justify-center rounded-md bg-foreground px-6 text-sm font-medium text-background transition-colors hover:bg-accent/90 disabled:opacity-50"
          >
            {isProcessing ? "Processing..." : "Run Agent & Continue"}
            {!isProcessing && <ChevronRight className="ml-2 h-4 w-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}
