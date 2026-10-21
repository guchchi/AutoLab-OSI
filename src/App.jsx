import React, { useState } from 'react';
import Navbar from './components/Navbar';
import LiteratureSearch from './components/LiteratureSearch';
import ProtocolViewer from './components/ProtocolViewer';
import ThermalKineticsChart from './components/ThermalKineticsChart';
import ParameterTuner from './components/ParameterTuner';
import DigitalTwinSimulator from './components/DigitalTwinSimulator';
import HardwareWebhookPanel from './components/HardwareWebhookPanel';
import ArchitectureDocsModal from './components/ArchitectureDocsModal';
import { BENCHMARK_PROTOCOLS } from './data/benchmarkProtocols';

export default function App() {
  const [currentProtocol, setCurrentProtocol] = useState(BENCHMARK_PROTOCOLS[0]);
  const [overrides, setOverrides] = useState({ tempOffset: 0, rpmMultiplier: 1.0, timeScale: 1.0 });
  const [isExtracting, setIsExtracting] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [showDocs, setShowDocs] = useState(false);

  // Serial Telemetry Logs
  const [logs, setLogs] = useState([
    {
      timestamp: new Date().toLocaleTimeString(),
      tag: "SYSTEM:READY",
      type: "NORMAL",
      message: "AutoLab OS v2.4 kernel initialized. Valency MCP connector authenticated."
    },
    {
      timestamp: new Date().toLocaleTimeString(),
      tag: "HARDWARE:NODE",
      type: "NORMAL",
      message: "ESP8266 Virtual Lab Station connected. Safety interlock relay locked."
    }
  ]);

  const addLog = (tag, message, type = "NORMAL") => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [
      ...prev.slice(-40), // keep last 40 logs
      { timestamp, tag, message, type }
    ]);
  };

  const handleSelectProtocol = (protocol) => {
    setCurrentProtocol(protocol);
    setOverrides({ tempOffset: 0, rpmMultiplier: 1.0, timeScale: 1.0 });
    setIsRunning(false);
    addLog(
      "LITERATURE_EXTRACT",
      `Protocol loaded: ${protocol.name} (${protocol.steps.length} physical stages). Safety Ceiling: ${protocol.safetyEnvelope.maxTempC}°C.`
    );
  };

  const handleStartSimulation = () => {
    setIsRunning(true);
    addLog(
      "WEBHOOK_DISPATCH",
      `Payload deployed for ${currentProtocol.name}. Firing HTTP webhook to lab controller.`
    );
  };

  const handleClearLogs = () => {
    setLogs([]);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Top Navigation */}
      <Navbar onOpenDocs={() => setShowDocs(true)} />

      {/* Main Container */}
      <main style={{
        maxWidth: '1440px',
        width: '100%',
        margin: '0 auto',
        padding: '28px 24px 60px'
      }}>
        {/* Step 1: Literature Ingestion & Preset Selector */}
        <LiteratureSearch
          currentProtocol={currentProtocol}
          onSelectProtocol={handleSelectProtocol}
          isExtracting={isExtracting}
          setIsExtracting={setIsExtracting}
        />

        {/* Step 2: Extracted Machine-Readable Protocol */}
        <ProtocolViewer
          protocol={currentProtocol}
          overrides={overrides}
        />

        {/* Step 3: Reactive Thermal & Kinetic Curves */}
        <ThermalKineticsChart
          protocol={currentProtocol}
          overrides={overrides}
        />

        {/* Step 4: Researcher Parameter Tuning & Verification */}
        <ParameterTuner
          overrides={overrides}
          setOverrides={setOverrides}
          protocol={currentProtocol}
        />

        {/* Step 5: Hardware Digital Twin (Hotplate + Beaker + Stirrer) */}
        <DigitalTwinSimulator
          protocol={currentProtocol}
          overrides={overrides}
          isRunning={isRunning}
          setIsRunning={setIsRunning}
          onLogEvent={(tag, msg) => addLog(tag, msg)}
        />

        {/* Step 6: IoT Webhook Deployment & Live Serial Console */}
        <HardwareWebhookPanel
          protocol={currentProtocol}
          overrides={overrides}
          onStartSimulation={handleStartSimulation}
          logs={logs}
          onClearLogs={handleClearLogs}
        />
      </main>

      {/* Footer */}
      <footer style={{
        borderTop: '1px solid var(--border-subtle)',
        background: 'rgba(8, 11, 18, 0.9)',
        padding: '24px',
        textAlign: 'center',
        marginTop: 'auto',
        fontSize: '0.8rem',
        color: 'var(--text-subtle)'
      }}>
        <div style={{ maxWidth: '1440px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            AutoLab OS • 4th Annual Open Scientific Intelligence Hackathon
          </div>
          <div>
            Bridging Scientific Literature to Physical Lab Execution in 10 Seconds
          </div>
        </div>
      </footer>

      {/* Architecture Documentation Modal */}
      <ArchitectureDocsModal
        isOpen={showDocs}
        onClose={() => setShowDocs(false)}
      />
    </div>
  );
}
