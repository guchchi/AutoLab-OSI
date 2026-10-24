import React, { useState } from 'react';
import WizardHeader from './components/WizardHeader';
import StepIntro from './components/StepIntro';
import StepLiterature from './components/StepLiterature';
import StepKinetics from './components/StepKinetics';
import StepExecution from './components/StepExecution';
import ArchitectureDocsModal from './components/ArchitectureDocsModal';
import ConnectLabModal from './components/ConnectLabModal';
import { BENCHMARK_PROTOCOLS } from './data/benchmarkProtocols';

export default function App() {
  const [currentStep, setCurrentStep] = useState(1);
  const [currentProtocol, setCurrentProtocol] = useState(BENCHMARK_PROTOCOLS[0]);
  const [overrides, setOverrides] = useState({ tempOffset: 0, rpmMultiplier: 1.0, timeScale: 1.0 });
  const [isExtracting, setIsExtracting] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [showDocsModal, setShowDocsModal] = useState(false);
  const [showConnectLabModal, setShowConnectLabModal] = useState(false);

  // Serial Telemetry Logs
  const [logs, setLogs] = useState([
    {
      timestamp: new Date().toLocaleTimeString(),
      tag: "SYSTEM:READY",
      message: "AutoLab OS v2.4 initialized. Valency MCP connector authenticated."
    },
    {
      timestamp: new Date().toLocaleTimeString(),
      tag: "ESP8266:NODE",
      message: "ESP8266 NodeMCU Lab Station ready on COM3 (115200 Baud). Safety interlock active."
    }
  ]);

  const addLog = (tag, message) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [
      ...prev.slice(-30),
      { timestamp, tag, message }
    ]);
  };

  const [hasUserSelectedProtocol, setHasUserSelectedProtocol] = useState(false);

  const handleSelectProtocol = (proto) => {
    setCurrentProtocol(proto);
    setHasUserSelectedProtocol(true);
    setOverrides({ tempOffset: 0, rpmMultiplier: 1.0, timeScale: 1.0 });
    setIsRunning(false);
    addLog("LITERATURE_SELECT", `Loaded ${proto.name} (${proto.steps.length} stages). Safe ceiling: ${proto.safetyEnvelope.maxTempC}°C.`);
  };

  const handleResetAll = () => {
    setCurrentStep(1);
    setHasUserSelectedProtocol(false);
    setIsRunning(false);
    setOverrides({ tempOffset: 0, rpmMultiplier: 1.0, timeScale: 1.0 });
  };

  return (
    <div className="app-shell">
      {/* Top Stepper Navigation Header */}
      <WizardHeader
        currentStep={currentStep}
        setCurrentStep={setCurrentStep}
        onOpenDocs={() => setShowDocsModal(true)}
        onOpenConnectLab={() => setShowConnectLabModal(true)}
      />

      {/* Step 1: Introduction & System Onboarding */}
      {currentStep === 1 && (
        <StepIntro 
          onStart={() => {
            setHasUserSelectedProtocol(false);
            setCurrentStep(2);
          }}
          onSelectProtocol={(proto) => {
            handleSelectProtocol(proto);
            setCurrentStep(2);
          }}
        />
      )}

      {/* Step 2: Target Material & Valency MCP Retrieval */}
      {currentStep === 2 && (
        <StepLiterature
          currentProtocol={currentProtocol}
          hasUserSelectedProtocol={hasUserSelectedProtocol}
          onSelectProtocol={handleSelectProtocol}
          onNext={() => setCurrentStep(3)}
          onBack={() => setCurrentStep(1)}
          isExtracting={isExtracting}
          setIsExtracting={setIsExtracting}
        />
      )}

      {/* Step 3: Verify & Visualize Reactive Kinetics */}
      {currentStep === 3 && (
        <StepKinetics
          protocol={currentProtocol}
          overrides={overrides}
          setOverrides={setOverrides}
          onNext={() => setCurrentStep(4)}
          onBack={() => setCurrentStep(2)}
        />
      )}

      {/* Step 4: Physical Hardware Execution & Digital Twin */}
      {currentStep === 4 && (
        <StepExecution
          protocol={currentProtocol}
          overrides={overrides}
          isRunning={isRunning}
          setIsRunning={setIsRunning}
          logs={logs}
          onAddLog={addLog}
          onBack={() => setCurrentStep(3)}
          onResetAll={handleResetAll}
          currentStep={currentStep}
          setCurrentStep={setCurrentStep}
          onOpenDocs={() => setShowDocsModal(true)}
          onOpenConnectLab={() => setShowConnectLabModal(true)}
        />
      )}

      {/* Architecture Documentation Modal */}
      <ArchitectureDocsModal
        isOpen={showDocsModal}
        onClose={() => setShowDocsModal(false)}
      />

      {/* Laboratory Hardware Bridge & ESP Connection Modal */}
      <ConnectLabModal
        isOpen={showConnectLabModal}
        onClose={() => setShowConnectLabModal(false)}
        protocol={currentProtocol}
        onAddLog={addLog}
      />
    </div>
  );
}
