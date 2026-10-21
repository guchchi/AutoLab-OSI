import React from 'react';
import { FlaskConical, BookOpen, Check, Radio, Database } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { cn } from '../lib/utils';

export default function WizardHeader({
  currentStep,
  setCurrentStep,
  onOpenDocs
}) {
  const steps = [
    { num: 1, label: 'Overview' },
    { num: 2, label: 'Literature Query' },
    { num: 3, label: 'Verify Kinetics' },
    { num: 4, label: 'Lab Execution' }
  ];

  return (
    <header className="mb-6">
      {/* Top Branding Bar */}
      <div className="flex items-center justify-between flex-wrap gap-4 p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs mb-4">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-600 to-cyan-600 flex items-center justify-center shadow-md shadow-sky-500/20">
            <FlaskConical size={22} className="text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-extrabold text-slate-900 tracking-tight">
                AUTOLAB <span className="text-sky-600">OS</span>
              </h1>
              <Badge variant="sky" className="text-[10px] font-mono py-0 px-2 font-bold">
                OSI '26
              </Badge>
            </div>
            <p className="text-xs text-slate-500">
              Autonomous Literature-to-Hardware Execution Engine
            </p>
          </div>
        </div>

        {/* Status Indicators & Docs Button */}
        <div className="flex items-center gap-2.5">
          <Badge variant="success" className="py-1 px-3">
            <span className="pulse-indicator"></span>
            Valency MCP: Online (44.5M)
          </Badge>

          <Badge variant="sky" className="py-1 px-3">
            <Radio size={12} className="mr-1" />
            ESP8266 Node: Ready
          </Badge>

          <Button
            variant="outline"
            size="sm"
            onClick={onOpenDocs}
            className="rounded-full"
          >
            <BookOpen size={13} className="text-sky-600" />
            Architecture
          </Button>
        </div>
      </div>

      {/* Stepper Wizard Bar */}
      <nav className="flex items-center justify-between bg-white border border-slate-200/80 rounded-2xl p-2 shadow-xs overflow-x-auto gap-2">
        {steps.map((st) => {
          const isActive = currentStep === st.num;
          const isCompleted = currentStep > st.num;

          return (
            <button
              key={st.num}
              onClick={() => setCurrentStep(st.num)}
              className={cn(
                "flex items-center gap-2.5 py-2 px-4 rounded-full cursor-pointer transition-all duration-200 text-xs font-semibold whitespace-nowrap",
                isActive
                  ? "bg-slate-900 text-white shadow-sm"
                  : isCompleted
                  ? "text-emerald-700 hover:bg-slate-50"
                  : "text-slate-600 hover:bg-slate-50"
              )}
            >
              <div
                className={cn(
                  "w-6 h-6 rounded-full flex items-center justify-center font-mono text-xs font-bold transition-all",
                  isActive
                    ? "bg-sky-600 text-white"
                    : isCompleted
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-slate-100 text-slate-600"
                )}
              >
                {isCompleted ? <Check size={13} /> : st.num}
              </div>
              <span className="text-sm tracking-tight">{st.label}</span>
            </button>
          );
        })}
      </nav>
    </header>
  );
}
