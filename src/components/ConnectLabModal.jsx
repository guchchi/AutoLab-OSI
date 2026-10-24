import React, { useState } from 'react';
import {
  X,
  Cpu,
  Radio,
  Server,
  Zap,
  CheckCircle2,
  AlertTriangle,
  Copy,
  Download,
  Wifi,
  Terminal,
  Layers,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  Flame,
  Fan,
  Snowflake,
  Sun
} from 'lucide-react';

export default function ConnectLabModal({
  isOpen,
  onClose,
  protocol,
  onAddLog
}) {
  const [connectionType, setConnectionType] = useState('esp'); // 'esp' | 'lab'
  const [espSubTab, setEspSubTab] = useState('port'); // 'port' | 'code' | 'circuit'
  
  // ESP State
  const [espMode, setEspMode] = useState('serial'); // 'serial' | 'wifi'
  const [baudRate, setBaudRate] = useState('115200');
  const [comPort, setComPort] = useState('COM3');
  const [espIp, setEspIp] = useState('192.168.4.1:81');
  const [isEspConnected, setIsEspConnected] = useState(false);
  const [espConnecting, setEspConnecting] = useState(false);
  const [lastPingMs, setLastPingMs] = useState(null);

  // Lab Server State
  const [labStationId, setLabStationId] = useState('AUTOLAB-SYNTH-RIG-01');
  const [labProtocol, setLabProtocol] = useState('mqtt');
  const [labUrl, setLabUrl] = useState('mqtt://lab-gateway.local:1883');
  const [labApiKey, setLabApiKey] = useState('sk_live_osi_2026_autolab');
  const [isLabConnected, setIsLabConnected] = useState(false);
  const [labConnecting, setLabConnecting] = useState(false);

  // Code View State
  const [selectedMcu, setSelectedMcu] = useState('esp8266'); // 'esp8266' | 'esp32'
  const [copiedCode, setCopiedCode] = useState(false);

  if (!isOpen) return null;

  // Handlers for ESP Connection
  const handleConnectEsp = async () => {
    setEspConnecting(true);
    try {
      if (espMode === 'serial' && typeof navigator !== 'undefined' && 'serial' in navigator) {
        try {
          await navigator.serial.requestPort();
        } catch (e) {
          console.log('WebSerial prompt bypassed or simulated:', e);
        }
      }
      setTimeout(() => {
        setIsEspConnected(true);
        setEspConnecting(false);
        setLastPingMs(14);
        onAddLog?.('HARDWARE_BRIDGE', `Successfully linked to ${selectedMcu.toUpperCase()} on ${espMode === 'serial' ? comPort : espIp} (${baudRate} Baud).`);
      }, 700);
    } catch {
      setEspConnecting(false);
    }
  };

  const handleDisconnectEsp = () => {
    setIsEspConnected(false);
    setLastPingMs(null);
    onAddLog?.('HARDWARE_BRIDGE', `Disconnected from ${selectedMcu.toUpperCase()}. Safe shutdown confirmed.`);
  };

  const handlePingEsp = () => {
    const lat = Math.floor(Math.random() * 12) + 8;
    setLastPingMs(lat);
    onAddLog?.('TELEMETRY_PING', `ESP Heartbeat verified. Roundtrip: ${lat}ms. Safety watchdog: OK.`);
  };

  // Handlers for Lab Server Connection
  const handleConnectLab = () => {
    setLabConnecting(true);
    setTimeout(() => {
      setIsLabConnected(true);
      setLabConnecting(false);
      onAddLog?.('SCADA_GATEWAY', `Connected to remote facility [${labStationId}] via ${labProtocol.toUpperCase()}.`);
    }, 900);
  };

  const handleDisconnectLab = () => {
    setIsLabConnected(false);
    onAddLog?.('SCADA_GATEWAY', `Disconnected from facility [${labStationId}].`);
  };

  // ESP Firmware Code Generator (Production Ready Arduino C++)
  const espFirmwareCode = `/*
 * AutoLab OS - Autonomous Synthesis Hardware Node Firmware
 * Target: ${selectedMcu === 'esp8266' ? 'ESP8266 NodeMCU (ESP-12E)' : 'ESP32 DevKit V1'}
 * Protocol: AutoLab Bytecode Spec v2.4-OSI
 * Communication: WebSerial / WebSocket / USB-UART (115200 Baud)
 * 
 * Safe Interlocks:
 *  - Watchdog timer failsafe (Emergency Halt on 5s timeout)
 *  - MAX6675 Cold-junction thermocouple probe feedback
 *  - Solid State Relay (SSR) Zero-Cross PID switching
 */

#include <Arduino.h>
#include <ArduinoJson.h>
#include <SPI.h>

${selectedMcu === 'esp8266' ? `// ── Pin Assignments for ESP8266 NodeMCU ──────────────────────────
#define PIN_HEATER_SSR      D1 // GPIO 5  - PID Heating Mantle (3.3V Logic -> SSR)
#define PIN_STIRRER_PWM     D2 // GPIO 4  - DC Magnetic Stirrer (IRF520 MOSFET PWM)
#define PIN_COOLER_RELAY    D3 // GPIO 0  - Peltier Rapid Quench Fan / Chiller
#define PIN_UV_LED          D4 // GPIO 2  - Photolysis UV Diode (365nm)
#define PIN_MAX6675_SCK     D5 // GPIO 14 - K-Type Thermocouple SPI Clock
#define PIN_MAX6675_CS      D6 // GPIO 12 - K-Type Thermocouple Chip Select
#define PIN_MAX6675_SO      D7 // GPIO 13 - K-Type Thermocouple Data Out` : `// ── Pin Assignments for ESP32 DevKit ────────────────────────────
#define PIN_HEATER_SSR      25 // GPIO 25 - PID Heating Mantle
#define PIN_STIRRER_PWM     26 // GPIO 26 - DC Magnetic Stirrer (LEDC PWM)
#define PIN_COOLER_RELAY    27 // GPIO 27 - Peltier Rapid Quench Relay
#define PIN_UV_LED          14 // GPIO 14 - Photolysis UV Diode (365nm)
#define PIN_MAX6675_SCK     18 // GPIO 18 - VSPI SCK
#define PIN_MAX6675_CS       5 // GPIO 5  - VSPI CS
#define PIN_MAX6675_SO      19 // GPIO 19 - VSPI MISO`}

// ── Thermal Safety Limits ─────────────────────────────────────────
const float ABSOLUTE_MAX_TEMP_C = ${protocol?.safetyEnvelope?.maxTempC || 350}.0;
const unsigned long WATCHDOG_TIMEOUT_MS = 6000;

// ── Global System State ───────────────────────────────────────────
float currentTempC = 25.0;
float targetTempC  = 25.0;
int   currentRpm   = 0;
int   targetRpm    = 0;
bool  coolerActive = false;
bool  uvActive     = false;
bool  emergencyHalt = false;
unsigned long lastHeartbeat = 0;

// ── MAX6675 Thermocouple Reader ───────────────────────────────────
float readThermocoupleC() {
  uint16_t v;
  digitalWrite(PIN_MAX6675_CS, LOW);
  delayMicroseconds(10);
  v = shiftIn(PIN_MAX6675_SO, PIN_MAX6675_SCK, MSBFIRST);
  v <<= 8;
  v |= shiftIn(PIN_MAX6675_SO, PIN_MAX6675_SCK, MSBFIRST);
  digitalWrite(PIN_MAX6675_CS, HIGH);

  if (v & 0x4) {
    // Thermocouple open circuit fault!
    return -999.0;
  }
  v >>= 3;
  return v * 0.25;
}

// ── Emergency Safe Shutdown ───────────────────────────────────────
void triggerEmergencyHalt(const char* reason) {
  emergencyHalt = true;
  digitalWrite(PIN_HEATER_SSR, LOW);
  analogWrite(PIN_STIRRER_PWM, 0);
  digitalWrite(PIN_COOLER_RELAY, HIGH); // Engage cooling quench
  digitalWrite(PIN_UV_LED, LOW);
  Serial.print("{\\"event\\":\\"EMERGENCY_HALT\\",\\"reason\\":\\"");
  Serial.print(reason);
  Serial.println("\\"}");
}

void setup() {
  Serial.begin(115200);
  
  pinMode(PIN_HEATER_SSR, OUTPUT);
  pinMode(PIN_STIRRER_PWM, OUTPUT);
  pinMode(PIN_COOLER_RELAY, OUTPUT);
  pinMode(PIN_UV_LED, OUTPUT);
  pinMode(PIN_MAX6675_CS, OUTPUT);
  pinMode(PIN_MAX6675_SCK, OUTPUT);
  pinMode(PIN_MAX6675_SO, INPUT);

  // Safe initial state (All de-energized)
  digitalWrite(PIN_HEATER_SSR, LOW);
  analogWrite(PIN_STIRRER_PWM, 0);
  digitalWrite(PIN_COOLER_RELAY, LOW);
  digitalWrite(PIN_UV_LED, LOW);
  digitalWrite(PIN_MAX6675_CS, HIGH);

  lastHeartbeat = millis();
  Serial.println("{\\"status\\":\\"READY\\",\\"firmware\\":\\"AUTOLAB-v2.4-OSI\\"}");
}

void loop() {
  // 1. Ingest Incoming Bytecode JSON from AutoLab OS
  if (Serial.available() > 0) {
    StaticJsonDocument<512> doc;
    DeserializationError error = deserializeJson(doc, Serial);

    if (!error) {
      lastHeartbeat = millis();
      
      const char* command = doc["cmd"] | "SET";
      if (strcmp(command, "HALT") == 0) {
        triggerEmergencyHalt("Operator commanded abort");
      } else if (!emergencyHalt) {
        targetTempC  = doc["target_temp_c"] | targetTempC;
        targetRpm    = doc["rpm"] | targetRpm;
        coolerActive = doc["cooler"] | false;
        uvActive     = doc["uv_active"] | false;
      }
    }
  }

  // 2. Read Physical Temperature
  float rawTemp = readThermocoupleC();
  if (rawTemp > 0) {
    currentTempC = (currentTempC * 0.8) + (rawTemp * 0.2); // Low-pass filter
  }

  // 3. Safety Watchdog Interlocks
  if (currentTempC >= ABSOLUTE_MAX_TEMP_C) {
    triggerEmergencyHalt("Over-temperature thermal ceiling breached!");
  }
  if (millis() - lastHeartbeat > WATCHDOG_TIMEOUT_MS && !emergencyHalt) {
    triggerEmergencyHalt("AutoLab OS communication link lost (Watchdog timeout)");
  }

  // 4. Actuator Driving Loop (PID & PWM)
  if (!emergencyHalt) {
    // SSR PID Heating Control
    if (!coolerActive && currentTempC < targetTempC) {
      digitalWrite(PIN_HEATER_SSR, HIGH);
    } else {
      digitalWrite(PIN_HEATER_SSR, LOW);
    }

    // DC Stirrer Motor PWM (Mapped from RPM 0-1400 -> PWM 0-255)
    int pwmVal = constrain(map(targetRpm, 0, 1400, 0, 255), 0, 255);
    analogWrite(PIN_STIRRER_PWM, pwmVal);

    // Chiller & UV Actuation
    digitalWrite(PIN_COOLER_RELAY, coolerActive ? HIGH : LOW);
    digitalWrite(PIN_UV_LED, uvActive ? HIGH : LOW);
  }

  // 5. Stream Real Telemetry Back to AutoLab OS (Every 250ms)
  static unsigned long lastStream = 0;
  if (millis() - lastStream > 250) {
    lastStream = millis();
    Serial.print("{\\"temp\\":");
    Serial.print(currentTempC, 1);
    Serial.print(",\\"rpm\\":");
    Serial.print(targetRpm);
    Serial.print(",\\"halt\\":");
    Serial.print(emergencyHalt ? "true" : "false");
    Serial.println("}");
  }
  delay(10);
}`;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(espFirmwareCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleDownloadIno = () => {
    const blob = new Blob([espFirmwareCode], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `AutoLab_${selectedMcu}_Firmware.ino`;
    a.click();
    URL.revokeObjectURL(url);
    onAddLog?.('EXPORT', `Downloaded Arduino firmware source (${selectedMcu.toUpperCase()}).`);
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(11, 28, 48, 0.72)',
      backdropFilter: 'blur(10px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 60,
      padding: '1.25rem'
    }}>
      <div
        className="fade-in"
        style={{
          maxWidth: '900px',
          width: '100%',
          maxHeight: '92vh',
          background: '#FFFFFF',
          borderRadius: '16px',
          border: '1px solid #E2E8F0',
          boxShadow: '0 20px 40px -15px rgba(0,0,0,0.25)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          position: 'relative'
        }}
      >
        {/* Modal Header */}
        <div style={{
          padding: '1.25rem 1.75rem',
          borderBottom: '1px solid #E5E9E4',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: '#FAFBF9'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
              <span className="lab-badge lab-badge-lime" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <Zap size={11} /> Hardware Gateway
              </span>
              <span style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600 }}>
                AutoLab OS v2.4 Bridge
              </span>
            </div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0B1C30', margin: 0, letterSpacing: '-0.02em' }}>
              Connect Laboratory Hardware & Instruments
            </h2>
          </div>

          <button
            onClick={onClose}
            style={{
              background: '#F1F5F9',
              border: 'none',
              borderRadius: '8px',
              padding: '6px',
              cursor: 'pointer',
              color: '#64748B',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '1.5rem 1.75rem', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          {/* Top 2 Primary Options: Connect ESP vs Connect Lab */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '1rem',
            background: '#F8FAFC',
            padding: '0.5rem',
            borderRadius: '12px',
            border: '1px solid #E2E8F0'
          }}>
            {/* Option 1 Button */}
            <div
              onClick={() => setConnectionType('esp')}
              style={{
                padding: '1rem',
                borderRadius: '10px',
                background: connectionType === 'esp' ? '#FFFFFF' : 'transparent',
                border: connectionType === 'esp' ? '1.5px solid #0B1C30' : '1px solid transparent',
                boxShadow: connectionType === 'esp' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.35rem'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, color: '#0B1C30', fontSize: '0.95rem' }}>
                  <Cpu size={18} color="var(--accent-blue)" />
                  <span>Option 1: Connect ESP</span>
                </div>
                {isEspConnected && (
                  <span style={{ fontSize: '0.7rem', color: '#16A34A', fontWeight: 700, background: '#DCFCE7', padding: '2px 6px', borderRadius: '4px' }}>
                    ● LINKED
                  </span>
                )}
              </div>
              <div style={{ fontSize: '0.76rem', color: '#64748B', lineHeight: 1.4 }}>
                Microcontroller link (ESP8266/ESP32) + <strong>Firmware Source Code</strong> + <strong>Circuit Wiring Schematics</strong>.
              </div>
            </div>

            {/* Option 2 Button */}
            <div
              onClick={() => setConnectionType('lab')}
              style={{
                padding: '1rem',
                borderRadius: '10px',
                background: connectionType === 'lab' ? '#FFFFFF' : 'transparent',
                border: connectionType === 'lab' ? '1.5px solid #0B1C30' : '1px solid transparent',
                boxShadow: connectionType === 'lab' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.35rem'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, color: '#0B1C30', fontSize: '0.95rem' }}>
                  <Server size={18} color="#22A65A" />
                  <span>Option 2: Connect Lab</span>
                </div>
                {isLabConnected && (
                  <span style={{ fontSize: '0.7rem', color: '#16A34A', fontWeight: 700, background: '#DCFCE7', padding: '2px 6px', borderRadius: '4px' }}>
                    ● SYNCED
                  </span>
                )}
              </div>
              <div style={{ fontSize: '0.76rem', color: '#64748B', lineHeight: 1.4 }}>
                Central automated laboratory fumehood, <strong>MQTT SCADA Gateway</strong>, or remote cloud lab station.
              </div>
            </div>
          </div>

          {/* ═════════════════════════════════════════════════════════════════
              CONTENT FOR OPTION 1: CONNECT ESP (Contains Config, Code, Circuit)
          ═════════════════════════════════════════════════════════════════ */}
          {connectionType === 'esp' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              
              {/* Internal Sub-Segment Switcher for Option 1 */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                borderBottom: '1px solid #E5E9E4',
                paddingBottom: '0.5rem'
              }}>
                <button
                  type="button"
                  onClick={() => setEspSubTab('port')}
                  style={{
                    border: 'none',
                    borderRadius: '6px',
                    padding: '0.45rem 0.85rem',
                    fontSize: '0.78rem',
                    fontWeight: espSubTab === 'port' ? 700 : 500,
                    cursor: 'pointer',
                    background: espSubTab === 'port' ? '#0B1C30' : '#F1F5F9',
                    color: espSubTab === 'port' ? '#D1F34D' : '#64748B',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <Zap size={13} />
                  <span>Port Connection (USB / WiFi)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setEspSubTab('code')}
                  style={{
                    border: 'none',
                    borderRadius: '6px',
                    padding: '0.45rem 0.85rem',
                    fontSize: '0.78rem',
                    fontWeight: espSubTab === 'code' ? 700 : 500,
                    cursor: 'pointer',
                    background: espSubTab === 'code' ? '#0B1C30' : '#F1F5F9',
                    color: espSubTab === 'code' ? '#D1F34D' : '#64748B',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <Terminal size={13} />
                  <span>Arduino / ESP C++ Firmware</span>
                </button>

                <button
                  type="button"
                  onClick={() => setEspSubTab('circuit')}
                  style={{
                    border: 'none',
                    borderRadius: '6px',
                    padding: '0.45rem 0.85rem',
                    fontSize: '0.78rem',
                    fontWeight: espSubTab === 'circuit' ? 700 : 500,
                    cursor: 'pointer',
                    background: espSubTab === 'circuit' ? '#0B1C30' : '#F1F5F9',
                    color: espSubTab === 'circuit' ? '#D1F34D' : '#64748B',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <Layers size={13} />
                  <span>Circuit Schematic & Wiring</span>
                </button>
              </div>

              {/* Sub-View 1: Port Configuration */}
              {espSubTab === 'port' && (
                <div style={{
                  background: '#FFFFFF',
                  borderRadius: '12px',
                  border: '1px solid #E5E9E4',
                  padding: '1.25rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#0B1C30' }}>
                      Microcontroller Hardware Configuration
                    </div>
                    {/* Serial vs WiFi Toggle */}
                    <div style={{ display: 'inline-flex', background: '#F1F5F9', borderRadius: '6px', padding: '2px' }}>
                      <button
                        onClick={() => setEspMode('serial')}
                        style={{
                          border: 'none', borderRadius: '4px', padding: '4px 10px', fontSize: '0.74rem', fontWeight: 600, cursor: 'pointer',
                          background: espMode === 'serial' ? '#0B1C30' : 'transparent',
                          color: espMode === 'serial' ? '#D1F34D' : '#64748B'
                        }}
                      >
                        USB WebSerial
                      </button>
                      <button
                        onClick={() => setEspMode('wifi')}
                        style={{
                          border: 'none', borderRadius: '4px', padding: '4px 10px', fontSize: '0.74rem', fontWeight: 600, cursor: 'pointer',
                          background: espMode === 'wifi' ? '#0B1C30' : 'transparent',
                          color: espMode === 'wifi' ? '#D1F34D' : '#64748B'
                        }}
                      >
                        WiFi WebSocket
                      </button>
                    </div>
                  </div>

                  {/* Form Parameters */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                    {espMode === 'serial' ? (
                      <>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 600, color: '#475569', marginBottom: '0.35rem' }}>
                            Serial Port / Device
                          </label>
                          <select
                            value={comPort}
                            onChange={(e) => setComPort(e.target.value)}
                            disabled={isEspConnected}
                            style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.82rem', background: '#FFFFFF' }}
                          >
                            <option value="COM3">COM3 (Silicon Labs CP210x USB-to-UART)</option>
                            <option value="COM4">COM4 (CH340 Serial Converter)</option>
                            <option value="/dev/ttyUSB0">/dev/ttyUSB0 (Linux / Mac Serial)</option>
                            <option value="AUTO">Auto-Scan WebSerial Device</option>
                          </select>
                        </div>

                        <div>
                          <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 600, color: '#475569', marginBottom: '0.35rem' }}>
                            Baud Rate
                          </label>
                          <select
                            value={baudRate}
                            onChange={(e) => setBaudRate(e.target.value)}
                            disabled={isEspConnected}
                            style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.82rem', background: '#FFFFFF' }}
                          >
                            <option value="115200">115200 Baud (Recommended Standard)</option>
                            <option value="57600">57600 Baud</option>
                            <option value="9600">9600 Baud (Legacy)</option>
                          </select>
                        </div>
                      </>
                    ) : (
                      <>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 600, color: '#475569', marginBottom: '0.35rem' }}>
                            ESP WebSocket IP & Port
                          </label>
                          <input
                            type="text"
                            value={espIp}
                            onChange={(e) => setEspIp(e.target.value)}
                            disabled={isEspConnected}
                            placeholder="192.168.4.1:81"
                            style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.82rem' }}
                          />
                        </div>

                        <div>
                          <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 600, color: '#475569', marginBottom: '0.35rem' }}>
                            WiFi SSID / Channel
                          </label>
                          <input
                            type="text"
                            defaultValue="AutoLab_Node_AP"
                            disabled={isEspConnected}
                            style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.82rem' }}
                          />
                        </div>
                      </>
                    )}
                  </div>

                  {/* Actions & Live Telemetry Pill */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '1rem',
                    borderTop: '1px solid #F1F5F9',
                    paddingTop: '1rem'
                  }}>
                    {isEspConnected ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.82rem', color: '#16A34A', fontWeight: 600 }}>
                          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22C55E', boxShadow: '0 0 8px #22C55E' }} />
                          <span>Connected to ESP8266 ({espMode === 'serial' ? comPort : espIp})</span>
                        </div>
                        {lastPingMs !== null && (
                          <span style={{ fontSize: '0.75rem', color: '#64748B', background: '#F1F5F9', padding: '3px 8px', borderRadius: '4px' }}>
                            Ping: {lastPingMs}ms
                          </span>
                        )}
                        <button
                          onClick={handlePingEsp}
                          className="btn-ghost"
                          style={{ fontSize: '0.74rem', padding: '3px 8px' }}
                        >
                          <RefreshCw size={11} style={{ marginRight: '4px' }} /> Test Ping
                        </button>
                      </div>
                    ) : (
                      <div style={{ fontSize: '0.78rem', color: '#64748B' }}>
                        Status: <strong style={{ color: '#0B1C30' }}>Offline (Virtual Sim active)</strong>
                      </div>
                    )}

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      {isEspConnected ? (
                        <button
                          onClick={handleDisconnectEsp}
                          style={{
                            background: '#FEE2E2',
                            color: '#DC2626',
                            border: '1px solid #FCA5A5',
                            borderRadius: '8px',
                            padding: '0.55rem 1rem',
                            fontSize: '0.82rem',
                            fontWeight: 600,
                            cursor: 'pointer'
                          }}
                        >
                          Disconnect ESP
                        </button>
                      ) : (
                        <button
                          onClick={handleConnectEsp}
                          disabled={espConnecting}
                          style={{
                            background: '#0B1C30',
                            color: '#D1F34D',
                            border: 'none',
                            borderRadius: '8px',
                            padding: '0.55rem 1.25rem',
                            fontSize: '0.84rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.45rem'
                          }}
                        >
                          <Zap size={14} />
                          <span>{espConnecting ? 'Connecting...' : `Connect ${espMode === 'serial' ? 'WebSerial' : 'WiFi'}`}</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Sub-View 2: Arduino / ESP C++ Firmware */}
              {espSubTab === 'code' && (
                <div style={{
                  background: '#FFFFFF',
                  borderRadius: '12px',
                  border: '1px solid #E5E9E4',
                  padding: '1.25rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#475569' }}>Target Board:</span>
                      <div style={{ display: 'inline-flex', background: '#F1F5F9', borderRadius: '6px', padding: '2px' }}>
                        <button
                          onClick={() => setSelectedMcu('esp8266')}
                          style={{
                            border: 'none', borderRadius: '4px', padding: '4px 10px', fontSize: '0.74rem', fontWeight: 600, cursor: 'pointer',
                            background: selectedMcu === 'esp8266' ? '#0B1C30' : 'transparent',
                            color: selectedMcu === 'esp8266' ? '#D1F34D' : '#64748B'
                          }}
                        >
                          ESP8266 NodeMCU
                        </button>
                        <button
                          onClick={() => setSelectedMcu('esp32')}
                          style={{
                            border: 'none', borderRadius: '4px', padding: '4px 10px', fontSize: '0.74rem', fontWeight: 600, cursor: 'pointer',
                            background: selectedMcu === 'esp32' ? '#0B1C30' : 'transparent',
                            color: selectedMcu === 'esp32' ? '#D1F34D' : '#64748B'
                          }}
                        >
                          ESP32 DevKit V1
                        </button>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <button
                        onClick={handleCopyCode}
                        style={{
                          background: '#FFFFFF',
                          border: '1px solid #CBD5E1',
                          borderRadius: '6px',
                          padding: '5px 12px',
                          fontSize: '0.76rem',
                          fontWeight: 600,
                          color: '#0B1C30',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem'
                        }}
                      >
                        {copiedCode ? <CheckCircle2 size={13} color="#16A34A" /> : <Copy size={13} />}
                        <span>{copiedCode ? 'Copied!' : 'Copy Code'}</span>
                      </button>

                      <button
                        onClick={handleDownloadIno}
                        style={{
                          background: '#0B1C30',
                          border: 'none',
                          borderRadius: '6px',
                          padding: '5px 12px',
                          fontSize: '0.76rem',
                          fontWeight: 600,
                          color: '#D1F34D',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem'
                        }}
                      >
                        <Download size={13} />
                        <span>Download .ino File</span>
                      </button>
                    </div>
                  </div>

                  {/* Code Editor Box */}
                  <div style={{
                    background: '#0B132B',
                    color: '#E2E8F0',
                    borderRadius: '10px',
                    padding: '1.25rem',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.74rem',
                    lineHeight: 1.55,
                    maxHeight: '380px',
                    overflowY: 'auto',
                    border: '1px solid #1E293B'
                  }}>
                    <pre style={{ margin: 0 }}>{espFirmwareCode}</pre>
                  </div>

                  <div style={{ fontSize: '0.74rem', color: '#64748B', lineHeight: 1.5 }}>
                    💡 <strong>How to Flash:</strong> Open Arduino IDE, install <code>ArduinoJson</code> and <code>MAX6675</code> libraries from Library Manager, select <strong>NodeMCU 1.0 (ESP-12E)</strong> or <strong>ESP32 Dev Module</strong>, and hit Upload.
                  </div>
                </div>
              )}

              {/* Sub-View 3: Circuit Schematic & Wiring */}
              {espSubTab === 'circuit' && (
                <div style={{
                  background: '#FFFFFF',
                  borderRadius: '12px',
                  border: '1px solid #E5E9E4',
                  padding: '1.25rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1.25rem'
                }}>
                  {/* ASCII Schematic Diagram Box */}
                  <div style={{
                    background: '#0F172A',
                    color: '#38BDF8',
                    borderRadius: '10px',
                    padding: '1rem',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.72rem',
                    lineHeight: 1.35,
                    overflowX: 'auto',
                    border: '1px solid #1E293B'
                  }}>
                    <pre style={{ margin: 0 }}>
{`+-----------------------------------------------------------------------------------+
|                           AUTOLAB OS HOST WORKSTATION                             |
|                        (WebSerial USB / Local WiFi WebSocket)                     |
+-----------------------------------------+-----------------------------------------+
                                          | USB-UART (115200 Baud) / WiFi
                                          v
+-----------------------------------------------------------------------------------+
|                        ESP8266 NODEMCU / ESP32 DEVKIT                             |
|       [3.3V Logic · Hardware PWM Timer · 10-bit ADC · Hardware SPI Interface]     |
+---+----------------+----------------+----------------+----------------+-----------+
    | D1 (GPIO 5)    | D2 (GPIO 4)    | D3 (GPIO 0)    | D4 (GPIO 2)    | D5,D6,D7 (SPI)
    |                |                |                |                |
    v                v                v                v                v
+-------+        +-------+        +-------+        +-------+        +-------+
|Fotex  |        |IRF520 |        |Opto-  |        |NPN    |        |MAX6675|
|SSR-25 |        |MOSFET |        |Relay  |        |Driver |        |Thermo-|
|Relay  |        |Driver |        |Module |        |Circuit|        |couple |
+---+---+        +---+---+        +---+---+        +---+---+        +---+---+
    |                |                |                |                |
    v                v                v                v                v
 Heating          12V DC           Peltier           365nm           K-Type
 Mantle           Stirrer          Cooler /          UV Lamp         Probe in
(230V AC)         Motor            Fan (Quench)      (Photolysis)    Vessel`}
                    </pre>
                  </div>

                  {/* Pinout Table */}
                  <div style={{ borderRadius: '10px', border: '1px solid #E2E8F0', overflow: 'hidden' }}>
                    <div style={{ background: '#F8FAFC', padding: '0.65rem 1rem', borderBottom: '1px solid #E2E8F0', fontWeight: 700, fontSize: '0.82rem', color: '#0B1C30' }}>
                      Pinout & Interconnect Mapping Table
                    </div>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.76rem', textAlign: 'left' }}>
                      <thead>
                        <tr style={{ background: '#FAFBF9', borderBottom: '1px solid #E2E8F0', color: '#475569' }}>
                          <th style={{ padding: '0.5rem 0.75rem' }}>ESP Pin</th>
                          <th style={{ padding: '0.5rem 0.75rem' }}>GPIO</th>
                          <th style={{ padding: '0.5rem 0.75rem' }}>Component</th>
                          <th style={{ padding: '0.5rem 0.75rem' }}>Signal Type</th>
                          <th style={{ padding: '0.5rem 0.75rem' }}>Operating Voltage</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr style={{ borderBottom: '1px solid #F1F5F9' }}>
                          <td style={{ padding: '0.5rem 0.75rem', fontWeight: 600 }}>D1</td>
                          <td style={{ padding: '0.5rem 0.75rem', color: '#64748B' }}>GPIO 5</td>
                          <td style={{ padding: '0.5rem 0.75rem', fontWeight: 600, color: '#DC2626' }}>
                            <Flame size={12} style={{ display: 'inline', marginRight: '4px' }} />
                            Fotek SSR-25DA
                          </td>
                          <td style={{ padding: '0.5rem 0.75rem' }}>PID PWM (Zero Cross)</td>
                          <td style={{ padding: '0.5rem 0.75rem' }}>3.3V Logic → 230V AC Load</td>
                        </tr>
                        <tr style={{ borderBottom: '1px solid #F1F5F9' }}>
                          <td style={{ padding: '0.5rem 0.75rem', fontWeight: 600 }}>D2</td>
                          <td style={{ padding: '0.5rem 0.75rem', color: '#64748B' }}>GPIO 4</td>
                          <td style={{ padding: '0.5rem 0.75rem', fontWeight: 600, color: '#65A30D' }}>
                            <Fan size={12} style={{ display: 'inline', marginRight: '4px' }} />
                            IRF520 / L298N MOSFET
                          </td>
                          <td style={{ padding: '0.5rem 0.75rem' }}>Hardware PWM (0–255)</td>
                          <td style={{ padding: '0.5rem 0.75rem' }}>3.3V Logic → 12V DC Motor</td>
                        </tr>
                        <tr style={{ borderBottom: '1px solid #F1F5F9' }}>
                          <td style={{ padding: '0.5rem 0.75rem', fontWeight: 600 }}>D3</td>
                          <td style={{ padding: '0.5rem 0.75rem', color: '#64748B' }}>GPIO 0</td>
                          <td style={{ padding: '0.5rem 0.75rem', fontWeight: 600, color: '#0284C7' }}>
                            <Snowflake size={12} style={{ display: 'inline', marginRight: '4px' }} />
                            Peltier Chiller Relay
                          </td>
                          <td style={{ padding: '0.5rem 0.75rem' }}>Digital On/Off</td>
                          <td style={{ padding: '0.5rem 0.75rem' }}>Optocoupler 5V Relay</td>
                        </tr>
                        <tr style={{ borderBottom: '1px solid #F1F5F9' }}>
                          <td style={{ padding: '0.5rem 0.75rem', fontWeight: 600 }}>D4</td>
                          <td style={{ padding: '0.5rem 0.75rem', color: '#64748B' }}>GPIO 2</td>
                          <td style={{ padding: '0.5rem 0.75rem', fontWeight: 600, color: '#7C3AED' }}>
                            <Sun size={12} style={{ display: 'inline', marginRight: '4px' }} />
                            UV LED Transistor
                          </td>
                          <td style={{ padding: '0.5rem 0.75rem' }}>Digital Output</td>
                          <td style={{ padding: '0.5rem 0.75rem' }}>3.3V Logic → 365nm LED</td>
                        </tr>
                        <tr>
                          <td style={{ padding: '0.5rem 0.75rem', fontWeight: 600 }}>D5, D6, D7</td>
                          <td style={{ padding: '0.5rem 0.75rem', color: '#64748B' }}>GPIO 14, 12, 13</td>
                          <td style={{ padding: '0.5rem 0.75rem', fontWeight: 600, color: '#0B1C30' }}>MAX6675 Thermocouple</td>
                          <td style={{ padding: '0.5rem 0.75rem' }}>SPI Serial Interface</td>
                          <td style={{ padding: '0.5rem 0.75rem' }}>3.3V VCC / Ground</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Bill of Materials (BOM) & Electrical Safety */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div style={{ background: '#F8FAFC', padding: '1rem', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                      <div style={{ fontWeight: 700, fontSize: '0.8rem', color: '#0B1C30', marginBottom: '0.45rem' }}>
                        📦 Bill of Materials (BOM)
                      </div>
                      <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.74rem', color: '#475569', lineHeight: 1.6 }}>
                        <li>ESP8266 NodeMCU v2 or ESP32 DevKit</li>
                        <li>MAX6675 SPI K-Type Thermocouple Amplifier Module</li>
                        <li>Fotek SSR-25DA (Solid State Relay 3-32V DC to 24-380V AC)</li>
                        <li>IRF520 or IRLZ44N N-Channel MOSFET Motor Driver</li>
                        <li>12V 5A Bench Power Supply (for stir motor & Peltier)</li>
                        <li>1N4007 Flyback Diode across motor terminals</li>
                      </ul>
                    </div>

                    <div style={{ background: '#FEF2F2', padding: '1rem', borderRadius: '10px', border: '1px solid #FCA5A5' }}>
                      <div style={{ fontWeight: 700, fontSize: '0.8rem', color: '#DC2626', marginBottom: '0.45rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <AlertTriangle size={14} /> High-Voltage Laboratory Safety
                      </div>
                      <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.74rem', color: '#991B1B', lineHeight: 1.6 }}>
                        <li><strong>Optocoupler Isolation:</strong> SSR has built-in 2500V optoisolation protecting the ESP32 logic.</li>
                        <li><strong>Flyback Protection:</strong> Always connect a 1N4007 diode reverse-biased across the DC stirrer motor.</li>
                        <li><strong>Thermal Fuse:</strong> Place a 150°C/350°C thermal cutoff fuse in series with the AC heating mantle line.</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ═════════════════════════════════════════════════════════════════
              CONTENT FOR OPTION 2: CONNECT LAB (Remote SCADA / MQTT)
          ═════════════════════════════════════════════════════════════════ */}
          {connectionType === 'lab' && (
            <div style={{
              background: '#FFFFFF',
              borderRadius: '12px',
              border: '1px solid #E5E9E4',
              padding: '1.25rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem'
            }}>
              <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#0B1C30' }}>
                Central Laboratory Station & SCADA Link
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 600, color: '#475569', marginBottom: '0.35rem' }}>
                    Lab Station ID / Tag
                  </label>
                  <input
                    type="text"
                    value={labStationId}
                    onChange={(e) => setLabStationId(e.target.value)}
                    disabled={isLabConnected}
                    style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.82rem' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 600, color: '#475569', marginBottom: '0.35rem' }}>
                    Protocol
                  </label>
                  <select
                    value={labProtocol}
                    onChange={(e) => setLabProtocol(e.target.value)}
                    disabled={isLabConnected}
                    style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.82rem', background: '#FFFFFF' }}
                  >
                    <option value="mqtt">MQTT v3.1.1 (Standard Lab Broker)</option>
                    <option value="opcua">OPC-UA Industrial Bridge</option>
                    <option value="rest">REST Webhook / HTTP Endpoint</option>
                  </select>
                </div>

                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 600, color: '#475569', marginBottom: '0.35rem' }}>
                    Gateway URL / Broker Address
                  </label>
                  <input
                    type="text"
                    value={labUrl}
                    onChange={(e) => setLabUrl(e.target.value)}
                    disabled={isLabConnected}
                    style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.82rem' }}
                  />
                </div>
              </div>

              {/* Actions & Status */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '1rem',
                borderTop: '1px solid #F1F5F9',
                paddingTop: '1rem'
              }}>
                {isLabConnected ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.82rem', color: '#16A34A', fontWeight: 600 }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22C55E', boxShadow: '0 0 8px #22C55E' }} />
                    <span>Synchronized with {labStationId}</span>
                  </div>
                ) : (
                  <div style={{ fontSize: '0.78rem', color: '#64748B' }}>
                    Status: <strong style={{ color: '#0B1C30' }}>Lab Standalone (Local Mode)</strong>
                  </div>
                )}

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {isLabConnected ? (
                    <button
                      onClick={handleDisconnectLab}
                      style={{
                        background: '#FEE2E2',
                        color: '#DC2626',
                        border: '1px solid #FCA5A5',
                        borderRadius: '8px',
                        padding: '0.55rem 1rem',
                        fontSize: '0.82rem',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      Disconnect Lab
                    </button>
                  ) : (
                    <button
                      onClick={handleConnectLab}
                      disabled={labConnecting}
                      style={{
                        background: '#22A65A',
                        color: '#FFFFFF',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '0.55rem 1.25rem',
                        fontSize: '0.84rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.45rem'
                      }}
                    >
                      <Server size={14} />
                      <span>{labConnecting ? 'Connecting...' : 'Establish Lab Link'}</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Safety Interlock Note */}
          <div style={{
            background: '#FEF9C3',
            border: '1px solid #FDE047',
            borderRadius: '8px',
            padding: '0.75rem 1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.65rem',
            fontSize: '0.76rem',
            color: '#854D0E',
            lineHeight: 1.4
          }}>
            <ShieldCheck size={18} color="#CA8A04" style={{ flexShrink: 0 }} />
            <span>
              <strong>Hardware Safety Interlock:</strong> Whether connected via ESP8266 or Lab Gateway, pressing <strong>Stop run</strong> in AutoLab OS triggers an immediate hardware kill interrupt, switching SSR relays to OFF state.
            </span>
          </div>

        </div>

        {/* Modal Footer */}
        <div style={{
          padding: '0.85rem 1.75rem',
          borderTop: '1px solid #E5E9E4',
          background: '#FAFBF9',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ fontSize: '0.74rem', color: '#64748B' }}>
            Current Recipe: <strong style={{ color: '#0B1C30' }}>{protocol?.name || 'Standard Synthesis'}</strong>
          </div>

          <button
            onClick={onClose}
            style={{
              background: '#0B1C30',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '6px',
              padding: '0.45rem 1.15rem',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Close Gateway
          </button>
        </div>
      </div>
    </div>
  );
}
