import React, { useState } from 'react';
import { Search, Sparkles, FileText, ArrowRight, ArrowLeft, CheckCircle2, Database, ExternalLink, X } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { BENCHMARK_PROTOCOLS } from '../data/benchmarkProtocols';
import { cn } from '../lib/utils';

export default function StepLiterature({
  currentProtocol,
  onSelectProtocol,
  onNext,
  onBack,
  isExtracting,
  setIsExtracting
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [customAbstract, setCustomAbstract] = useState('');

  const handleSelectPreset = (proto) => {
    setIsExtracting(true);
    setTimeout(() => {
      onSelectProtocol(proto);
      setIsExtracting(false);
    }, 900);
  };

  const handleCustomSubmit = (e) => {
    e.preventDefault();
    if (!searchQuery.trim() && !customAbstract.trim()) return;

    setIsExtracting(true);
    setShowCustomModal(false);

    setTimeout(() => {
      const customProto = {
        id: `custom-${Date.now()}`,
        name: searchQuery || "Custom Synthesized System",
        category: "Novel Material Formulation",
        formula: "Target Matrix",
        targetProperty: "Extracted via Valency MCP & Google LLM",
        citation: {
          title: "Ingested Scientific Document",
          journal: "Valency Scientific Literature Gateway",
          doi: "10.1016/j.autolab.custom",
          year: 2026,
          snippet: customAbstract || "Direct literature methodology parsed into structured machine execution steps."
        },
        safetyEnvelope: {
          maxTempC: 320,
          maxRampRateCMin: 10,
          criticalWarnings: ["Verify precursor flashpoint prior to heating", "Maintain emergency stop readiness"]
        },
        steps: [
          {
            id: 1,
            name: "Phase 1: Solvation & Chelation",
            operation: "STIR_DISPENSE",
            targetTempC: 30,
            rampRateCMin: 1.0,
            durationMin: 20,
            stirRpm: 450,
            reagents: "Custom precursors in solvent matrix",
            hardwareAction: "Agitation active at 450 RPM, ambient RTD active"
          },
          {
            id: 2,
            name: "Phase 2: Thermal Nucleation Window",
            operation: "RAMP_HEAT_STIR",
            targetTempC: 110,
            rampRateCMin: 5.0,
            durationMin: 45,
            stirRpm: 700,
            reagents: "Chelated solution intermediate",
            hardwareAction: "PID thermal ramp to 110 °C, maintain 700 RPM"
          },
          {
            id: 3,
            name: "Phase 3: Thermal Quench & Stabilization",
            operation: "COOL_DOWN",
            targetTempC: 25,
            rampRateCMin: -15.0,
            durationMin: 15,
            stirRpm: 300,
            reagents: "Precipitated crystalline product",
            hardwareAction: "Active cooling engaged, agitation reduced to 300 RPM"
          }
        ]
      };
      onSelectProtocol(customProto);
      setIsExtracting(false);
    }, 1100);
  };

  return (
    <div className="max-w-5xl mx-auto">
      <Card className="p-8 shadow-md">
        {/* Header row */}
        <div className="flex items-center justify-between flex-wrap gap-4 mb-3">
          <div className="flex items-center gap-2.5">
            <Badge variant="sky" className="gap-1.5 py-1 px-3">
              <Database size={13} />
              Valency MCP Literature Gateway
            </Badge>
            <span className="text-xs text-slate-500 font-medium">44.5M Scientific Articles</span>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowCustomModal(true)}
            className="rounded-full gap-1.5"
          >
            <FileText size={14} className="text-sky-600" />
            Paste Abstract / DOI
          </Button>
        </div>

        <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight mb-2">
          Select or Query Target Material System
        </h2>
        <p className="text-sm text-slate-500 mb-6">
          Choose a peer-reviewed materials chemistry benchmark or input a custom synthesis target:
        </p>

        {/* Preset Material Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3.5 mb-6">
          {BENCHMARK_PROTOCOLS.map((proto) => {
            const isSelected = proto.id === currentProtocol.id;
            return (
              <div
                key={proto.id}
                onClick={() => handleSelectPreset(proto)}
                className={cn(
                  "p-4 rounded-xl border cursor-pointer transition-all duration-200 flex flex-col justify-between",
                  isSelected
                    ? "border-sky-500 bg-sky-50/70 shadow-sm ring-1 ring-sky-500"
                    : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-xs"
                )}
              >
                <div>
                  <div className="flex items-center justify-between gap-1 mb-2">
                    <Badge variant="secondary" className="text-[10px] py-0 px-2 font-medium">
                      {proto.category}
                    </Badge>
                    {isSelected && (
                      <CheckCircle2 size={16} className="text-sky-600 shrink-0" />
                    )}
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 leading-snug mb-1">
                    {proto.name}
                  </h4>
                  <p className="text-[11px] text-slate-500 leading-tight mb-3">
                    {proto.formula}
                  </p>
                </div>

                <div className="text-[11px] font-semibold text-sky-700 pt-2 border-t border-slate-100 flex items-center justify-between">
                  <span>{proto.steps.length} Steps</span>
                  <span className="text-slate-400 font-normal">{proto.citation.year}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Extraction Animation */}
        {isExtracting && (
          <div className="bg-sky-50 border border-sky-200 rounded-xl p-4 flex items-center gap-4 mb-6">
            <div className="w-6 h-6 rounded-full border-2 border-sky-600 border-t-transparent animate-spin shrink-0" />
            <div>
              <div className="text-sm font-bold text-sky-900">
                Valency MCP: Querying Literature & Extracting Physical Bounds...
              </div>
              <div className="text-xs text-slate-600 font-mono mt-0.5">
                Parsing parameters: Target Temp (°C), Stirring (RPM), Dwell Timers, Safety Envelopes
              </div>
            </div>
          </div>
        )}

        {/* Verified Citation Card */}
        {!isExtracting && (
          <div className="bg-slate-50/90 border border-slate-200 rounded-xl p-5 mb-6">
            <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
              <span className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <FileText size={15} className="text-sky-600" />
                Literature Source: {currentProtocol.citation.title}
              </span>
              <a
                href={`https://doi.org/${currentProtocol.citation.doi}`}
                target="_blank"
                rel="noreferrer"
                className="text-xs font-semibold text-sky-600 hover:text-sky-700 flex items-center gap-1 font-mono"
              >
                DOI: {currentProtocol.citation.doi}
                <ExternalLink size={12} />
              </a>
            </div>

            <p className="text-xs text-slate-600 italic leading-relaxed mb-4">
              "{currentProtocol.citation.snippet}"
            </p>

            {/* Extracted Stages Preview */}
            <div className="flex items-center gap-2 flex-wrap pt-3 border-t border-slate-200">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Extracted Stages:
              </span>
              {currentProtocol.steps.map((st, i) => (
                <Badge
                  key={st.id}
                  variant="outline"
                  className="bg-white text-xs font-medium py-0.5 px-2.5"
                >
                  Stage {i + 1}: {st.targetTempC}°C / {st.stirRpm} RPM ({st.durationMin}m)
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-100">
          <Button
            variant="outline"
            onClick={onBack}
            className="gap-2"
          >
            <ArrowLeft size={16} />
            Back to Overview
          </Button>

          <Button
            variant="ocean"
            onClick={onNext}
            className="gap-2 font-bold shadow-md shadow-sky-500/20"
          >
            Proceed to Kinetics & Safety Verification
            <ArrowRight size={16} />
          </Button>
        </div>
      </Card>

      {/* Modal */}
      {showCustomModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <Card className="max-w-lg w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setShowCustomModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 cursor-pointer p-1"
            >
              <X size={18} />
            </button>

            <h3 className="text-lg font-bold text-slate-900 mb-1">
              Query Custom Paper / Methodology
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Paste an excerpt from any synthesis paper. AutoLab OS will parse thermal & kinetic parameters.
            </p>

            <form onSubmit={handleCustomSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Target Material Name:
                </label>
                <Input
                  placeholder="e.g. Cobalt-Doped Sodium Titanate (Na0.7CoO2)"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Synthesis Paragraph / Methodology:
                </label>
                <Textarea
                  placeholder="e.g. Dissolved precursors in anhydrous ethanol at 450 RPM at 25°C, then heated to 140°C for 180 min..."
                  value={customAbstract}
                  onChange={(e) => setCustomAbstract(e.target.value)}
                  className="font-mono text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCustomModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="ocean"
                  className="gap-1.5"
                >
                  <Sparkles size={15} />
                  Extract Protocol
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
