# AutoLab OS 🧪
> **Bridging the gap between scientific literature and physical lab execution in seconds.**  
> *Developed for the 4th Annual Open Scientific Intelligence Hackathon (2026)*

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Python 3.10+](https://img.shields.io/badge/Python-3.10%2B-brightgreen.svg)](https://www.python.org/)
[![Node.js 18+](https://img.shields.io/badge/Node.js-18%2B-green.svg)](https://nodejs.org/)
[![Vercel Ready](https://img.shields.io/badge/Deploy-Vercel-black.svg?logo=vercel)](https://vercel.com/)
[![Hardware: ESP8266](https://img.shields.io/badge/Hardware-ESP8266%20%7C%20NodeMCU-red.svg)](firmware/)

---

## 🚨 The Scientific Bottleneck
While generative AI and computational screening have drastically accelerated in silico materials discovery, **execution remains entirely manual**. Today, an experimental materials scientist researching next-generation battery electrolytes, quantum dots, or perovskites must:
1. Sift through dense, unstructured academic papers and PDF supplementary information.
2. Manually isolate physical synthesis parameters (*Heat at 80 °C for 60 mins at 600 RPM, then calcine at 850 °C for 6 hrs*).
3. Manually configure physical laboratory hotplates, stirrers, and temperature controllers, or hand-code embedded microcontroller scripts.

This manual "Literature-to-Lab" translation takes **3 to 7 days per experiment**, introducing human configuration errors, thermal overshoot hazards, and a crippling bottleneck in the autonomous discovery cycle.

---

## 💡 The Solution: AutoLab OS
**AutoLab OS** is an autonomous, end-to-end laboratory operating system that compresses days of manual setup into a **verified 10-second pipeline**. By chaining scientific literature extraction models directly to reactive kinetics verification and IoT hardware execution, AutoLab OS enables true closed-loop materials acceleration.

```
┌─────────────────────────────────┐
│  Scientific Papers & Literature │  (Valency MCP / 44.5M Articles)
└────────────────┬────────────────┘
                 │
                 ▼  [ Step 1: Retrieve & Extract ]
┌─────────────────────────────────┐
│    Machine-Readable Protocol    │  JSON Bytecode (Temp, RPM, Dwell, Safety)
└────────────────┬────────────────┘
                 │
                 ▼  [ Step 2: Verify & Visualize ]
┌─────────────────────────────────┐
│   Reactive Kinetics & Safety    │  Marimo Interactive Curves T(t) & ω(t)
└────────────────┬────────────────┘
                 │
                 ▼  [ Step 3: Physical Execution ]
┌─────────────────────────────────┐
│   ESP8266 Lab Node Controller   │  PWM Hotplate • Magnetic Stirrer • Sensors
└─────────────────────────────────┘
```

---

## ⚡ The 3-Step Engine

### 1. Retrieve & Extract (Valency MCP Literature Gateway)
- Queries 44.5 million peer-reviewed scientific papers or ingests raw researcher PDFs and DOIs.
- Dissects complex methodologies into discrete laboratory stages: `DISPENSE`, `RAMP_HEAT`, `STIR`, `ISOTHERMAL_DWELL`, `CALCINATION`, and `QUENCH`.
- Extracts precise chemical quantities, solvent flashpoints, and hardware actuation directives.

### 2. Verify & Visualize (Reactive Thermodynamic Curves)
- Rather than blindly executing AI outputs on live equipment, data feeds into an interactive mathematical simulation engine.
- Computes continuous thermodynamic curves $T(t)$ and kinetic agitation profiles $\omega(t)$ accounting for thermal inertia and Newton's law of cooling.
- **Safety Envelope Interlocks:** Visualizes a hard safety ceiling (e.g., maximum ceramic heating thresholds and solvent boiling limits) to prevent runaway thermal reactions or autoclave pressure overloads.
- Built-in parameter calibration allows researchers to verify or fine-tune parameters with instant live recalculation.

### 3. Physical Lab Execution (Dual-Mode Dispatcher)
- **Production Webhook:** Transmits CRC32-verified JSON bytecode via REST webhook (`POST /api/protocol`) to an ESP8266 / NodeMCU microcontroller.
- **Physical Equipment Actuation:** Driven by discrete PID control, the microcontroller actuates logic-level MOSFETs/SSRs for ceramic heating elements and motor drivers for magnetic stirrers.
- **In-Memory Digital Twin Simulator:** For evaluation environments without connected hardware, AutoLab OS includes a real-time visual digital twin displaying liquid vortex dynamics, heating radial glow, thermocouple PID stabilization, and a live 115200 baud serial telemetry stream.

---

## 🧪 Validated Materials Benchmarks

| Material System | Target Property | Citation DOI | Key Synthesis Parameters |
| :--- | :--- | :--- | :--- |
| **LLZO Solid-State Electrolyte**<br>`Li6.4La3Zr1.4Ta0.6O12` | 1.02 mS/cm Ionic Conductivity | [10.1039/C8TA05321K](https://doi.org/10.1039/C8TA05321K) | Sol-gel: 25°C (450 RPM) ➔ 80°C (600 RPM) ➔ 250°C ➔ 850°C (Calcination) |
| **CsPbBr3 Perovskite QDs**<br>`CsPbBr3` | Photoluminescence QY > 90% | [10.1021/acs.nanolett.5b00640](https://doi.org/10.1021/acs.nanolett.5b00640) | Hot-injection: 120°C degas ➔ 180°C (1000 RPM flash inject) ➔ 22°C ice quench |
| **NMC811 Battery Cathode**<br>`LiNi0.8Mn0.1Co0.1O2` | Discharge Capacity > 205 mAh/g | [10.1002/aenm.202102143](https://doi.org/10.1002/aenm.202102143) | Co-precipitation: 55°C (900 RPM) ➔ Pre-oxidation 480°C ➔ 760°C O2 Calcination |
| **MOF-5 Porous Framework**<br>`Zn4O(C8H4O4)3` | BET Surface Area > 2,900 m²/g | [10.1126/science.283.5405.1148](https://doi.org/10.1126/science.283.5405.1148) | Solvothermal: 30°C (500 RPM) ➔ 120°C sealed dwell ➔ 0.32°C/min slow cool |

---

## 🚀 Quickstart Guide

### 1. Web Application (Vercel Ready)
Run locally or deploy directly to Vercel with zero configuration:

```bash
# Clone the repository
git clone https://github.com/guchchi/AutoLab-OSI.git
cd AutoLab-OSI

# Install dependencies
npm install

# Launch development server
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

To build for production:
```bash
npm run build
```

---

### 2. Python Research Suite & Marimo Notebook
For data scientists and materials researchers who prefer working in Python:

```bash
# Install Python package in editable mode
pip install -e .

# Launch the interactive reactive Marimo notebook
marimo run notebook.py
```

Or open in reactive edit mode:
```bash
marimo edit notebook.py
```

---

### 3. ESP8266 Microcontroller Firmware
1. Open [`firmware/autolab_controller.ino`](firmware/autolab_controller.ino) in Arduino IDE or PlatformIO.
2. Install `ESP8266WiFi` and `ArduinoJson` (v6+) libraries.
3. Configure your laboratory Wi-Fi credentials:
   ```cpp
   const char* ssid = "YOUR_LAB_WIFI";
   const char* password = "YOUR_PASSWORD";
   ```
4. Flash to any ESP8266 NodeMCU or ESP32 board.
5. See [`firmware/SCHEMATIC.md`](firmware/SCHEMATIC.md) for complete pinout and circuit wiring schematics.

---

## 🛠️ Repository Structure

```text
AutoLab-OSI/
├── autolab/                      # Core Python Research Package
│   ├── core/
│   │   ├── models.py             # Pydantic schemas for protocols & safety envelopes
│   │   └── kinetics.py           # Thermodynamic & kinetic simulation engine
│   └── execution/
│       └── dispatcher.py         # IoT Webhook dispatcher client
├── firmware/                     # Microcontroller Firmware
│   ├── autolab_controller.ino    # ESP8266 Arduino C++ firmware sketch
│   └── SCHEMATIC.md              # Circuit schematic, pinout map, and BOM
├── src/                          # Web Application (Vite + React)
│   ├── components/
│   │   ├── Navbar.jsx            # Telemetry status bar
│   │   ├── LiteratureSearch.jsx  # Valency paper query & benchmark preset selector
│   │   ├── ProtocolViewer.jsx    # Machine-readable laboratory step cards
│   │   ├── ThermalKineticsChart.jsx # Reactive SVG thermal kinetics curves
│   │   ├── ParameterTuner.jsx    # Researcher calibration sliders
│   │   ├── DigitalTwinSimulator.jsx # Virtual hotplate & animated magnetic stirrer
│   │   ├── HardwareWebhookPanel.jsx # IoT Webhook deployer & live serial monitor
│   │   └── ArchitectureDocsModal.jsx# System architecture documentation modal
│   ├── data/
│   │   └── benchmarkProtocols.js # Peer-reviewed synthesis dataset
│   ├── utils/
│   │   └── thermalKinetics.js    # Discrete time-series generation math
│   ├── App.jsx                   # Main application layout
│   └── index.css                 # Dark-mode scientific glassmorphism styling
├── notebook.py                   # Reactive Marimo research notebook
├── pyproject.toml                # Python package metadata
├── package.json                  # Node.js dependencies
└── README.md                     # Project documentation
```

---

## 🏆 Hackathon Impact
AutoLab OS demonstrates that the execution gap in modern materials science can be solved through open scientific intelligence:
- **Time Savings:** Reduces manual microcontroller coding and equipment setup from **3 days to 10 seconds**.
- **Safety Interlocks:** Hardware-level boundaries protect lab infrastructure from boiling runaways, thermal shock, and hazardous gas emissions.
- **Open Science:** Accessible to any laboratory worldwide with under $25 in open-source microcontrollers.

---

## 📄 License
This project is open-source under the [MIT License](LICENSE).
