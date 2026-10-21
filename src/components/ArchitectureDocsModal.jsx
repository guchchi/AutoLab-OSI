import React from 'react';
import { X, BookOpen, Layers, ShieldCheck, Cpu, Database, CheckCircle2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';

export default function ArchitectureDocsModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <Card className="max-w-3xl w-full max-h-[90vh] overflow-y-auto p-8 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 cursor-pointer p-1"
        >
          <X size={20} />
        </button>

        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="sky">AutoLab OS Architecture</Badge>
            <Badge variant="success">4th Annual OSI Hackathon</Badge>
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Bridging Scientific Literature to Physical Lab Execution
          </h2>
        </div>

        {/* Section 1 */}
        <div className="mb-6 space-y-2">
          <h3 className="text-base font-bold text-sky-600 flex items-center gap-2">
            🚨 The Real-World Scientific Bottleneck
          </h3>
          <p className="text-sm text-slate-600 leading-relaxed">
            While generative AI has accelerated material discovery in silico, the execution bottleneck remains 100% manual. Scientists spend 3 to 7 days reading literature, extracting synthesis steps, programming microcontrollers, or hand-configuring hotplates and stirrers. AutoLab OS compresses this 3-day manual setup into a verified 10-second autonomous pipeline.
          </p>
        </div>

        {/* Section 2 */}
        <div className="mb-6 space-y-3">
          <h3 className="text-base font-bold text-sky-600 flex items-center gap-2">
            ⚡ The 3-Step Engine Architecture
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div className="flex items-center gap-1.5 text-xs font-bold text-sky-600 mb-1">
                <Database size={14} /> 1. Retrieve & Extract
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Queries 44.5M scientific papers via Valency MCP + LLM to isolate exact physical parameters: Temperature, Agitation (RPM), Dwell Timers, and Precursors.
              </p>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 mb-1">
                <Layers size={14} /> 2. Verify & Visualize
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Pushes discrete steps into reactive thermodynamic and kinetic curves (Marimo-backed). Validates safety ceilings to prevent boiling, thermal shock, or runaways.
              </p>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div className="flex items-center gap-1.5 text-xs font-bold text-cyan-600 mb-1">
                <Cpu size={14} /> 3. Physical Execution
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Dispatches CRC32-verified JSON bytecode via HTTP webhook to physical ESP8266 NodeMCU microcontrollers, driving PWM heaters and stepper stirrers in real time.
              </p>
            </div>
          </div>
        </div>

        {/* Section 3 */}
        <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-4 mb-6">
          <h4 className="text-xs font-bold text-amber-800 flex items-center gap-1.5 mb-1">
            <ShieldCheck size={15} /> Autonomous Safety Envelope Protection
          </h4>
          <p className="text-xs text-amber-900 leading-relaxed">
            Unlike open-loop chatbots, AutoLab OS features hardware-level interlocks. Any proposed recipe that exceeds the maximum thermal threshold (e.g. 900°C for ceramic or solvent flashpoints) trips the safety interlock and requires explicit researcher override before firing webhooks.
          </p>
        </div>

        <div className="flex justify-end pt-2">
          <Button
            variant="default"
            onClick={onClose}
          >
            Return to Dashboard
          </Button>
        </div>
      </Card>
    </div>
  );
}
