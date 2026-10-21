import React from 'react';
import { ArrowRight, Database, Layers, Cpu, CheckCircle2, Sparkles, BookOpen } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';

export default function StepIntro({ onStart }) {
  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Hero Welcome Card */}
      <Card className="relative overflow-hidden p-8 md:p-12 border-slate-200/80 shadow-md">
        {/* Subtle decorative glow */}
        <div className="absolute -top-16 -right-16 w-72 h-72 rounded-full bg-sky-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-6">
          <Badge variant="sky" className="py-1 px-3 text-xs font-semibold">
            <span className="pulse-indicator mr-1.5"></span>
            4th Annual Open Scientific Intelligence Hackathon
          </Badge>

          <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 leading-tight tracking-tight">
            Autonomous Literature-to-Hardware <br />
            <span className="bg-gradient-to-r from-sky-600 to-cyan-600 bg-clip-text text-transparent">
              Materials Execution Engine
            </span>
          </h1>

          <p className="text-base md:text-lg text-slate-600 leading-relaxed max-w-3xl">
            While generative AI has accelerated computational material discovery, the physical execution bottleneck remains entirely manual. 
            AutoLab OS bridges scientific research papers directly to physical laboratory hardware in <strong>10 seconds</strong>.
          </p>

          <div className="flex items-center gap-4 flex-wrap pt-2">
            <Button
              variant="ocean"
              size="lg"
              onClick={onStart}
              className="gap-2.5 font-bold text-base shadow-lg shadow-sky-500/20"
            >
              Start Experiment Protocol
              <ArrowRight size={18} />
            </Button>

            <div className="flex items-center gap-3 text-sm text-slate-500">
              <span className="flex items-center gap-1.5 text-slate-700 font-medium">
                <CheckCircle2 size={16} className="text-emerald-600" /> 44.5M Papers via Valency
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5 text-slate-700 font-medium">
                <CheckCircle2 size={16} className="text-emerald-600" /> Physical ESP8266 IoT Ready
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* 3 Value Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Pillar 1 */}
        <Card className="flex flex-col justify-between p-6 hover:border-sky-300 transition-all">
          <div>
            <div className="w-11 h-11 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center mb-4">
              <Database size={22} />
            </div>
            <div className="text-[11px] font-bold text-sky-600 uppercase tracking-wider mb-1">
              Step 1: Retrieve & Extract
            </div>
            <CardTitle className="text-base mb-2">Valency Literature Gateway</CardTitle>
            <CardDescription className="text-xs leading-relaxed">
              Input any target material. AutoLab queries 44.5M papers via Valency MCP, isolating exact parameters: Temperature, RPM, Dwell, and Reagents.
            </CardDescription>
          </div>
          <div className="pt-4 mt-4 border-t border-slate-100 text-xs font-semibold text-sky-600">
            ⚡ Instant PDF-to-Code Parsing
          </div>
        </Card>

        {/* Pillar 2 */}
        <Card className="flex flex-col justify-between p-6 hover:border-emerald-300 transition-all">
          <div>
            <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
              <Layers size={22} />
            </div>
            <div className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider mb-1">
              Step 2: Verify & Calibrate
            </div>
            <CardTitle className="text-base mb-2">Reactive Kinetics Engine</CardTitle>
            <CardDescription className="text-xs leading-relaxed">
              Interactive thermodynamic curves T(t) and kinetic agitation profiles. Validates safety ceilings to prevent boiling, thermal shock, or runaways.
            </CardDescription>
          </div>
          <div className="pt-4 mt-4 border-t border-slate-100 text-xs font-semibold text-emerald-600">
            🛡️ Hardware Safety Interlocks
          </div>
        </Card>

        {/* Pillar 3 */}
        <Card className="flex flex-col justify-between p-6 hover:border-cyan-300 transition-all">
          <div>
            <div className="w-11 h-11 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center mb-4">
              <Cpu size={22} />
            </div>
            <div className="text-[11px] font-bold text-cyan-600 uppercase tracking-wider mb-1">
              Step 3: Deploy & Actuate
            </div>
            <CardTitle className="text-base mb-2">Physical Lab Execution</CardTitle>
            <CardDescription className="text-xs leading-relaxed">
              Broadcasts CRC32-verified JSON bytecode via REST webhook to ESP8266 microcontrollers, driving PWM heaters and magnetic stirrers in real time.
            </CardDescription>
          </div>
          <div className="pt-4 mt-4 border-t border-slate-100 text-xs font-semibold text-cyan-600">
            ⚙️ Real NodeMCU + Digital Twin
          </div>
        </Card>
      </div>
    </div>
  );
}
