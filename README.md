<div align="center">

# 🧪 AutoLab OS
### **Autonomous Literature-to-Hardware Synthesis Engine**
#### *Bridging the 3–7 Day Literature-to-Bench Execution Gap into a Verified <10s Pipeline*

[![OSI Hackathon 2026](https://img.shields.io/badge/OSI_Hackathon-2026_Finalist-blueviolet?style=for-the-badge&logo=target)](https://github.com/guchchi/AutoLab-OSI)
[![License: MIT](https://img.shields.io/badge/License-MIT-teal.svg?style=for-the-badge)](LICENSE)
[![Valency MCP](https://img.shields.io/badge/Literature_Engine-Valency_MCP_44.5M_Corpus-0ea5e9?style=for-the-badge&logo=googlescholar)](https://github.com/guchchi/AutoLab-OSI)
[![React 18 + Vite](https://img.shields.io/badge/Frontend-React_18_%7C_Vite-61dafb?style=for-the-badge&logo=react)](https://react.dev/)
[![Python 3.10+](https://img.shields.io/badge/Simulation-Python_3.10%2B_%7C_Marimo-3b82f6?style=for-the-badge&logo=python)](https://marimo.io/)
[![Hardware Verified](https://img.shields.io/badge/Physical_IoT-ESP8266_%7C_ESP32_WebSerial-10b981?style=for-the-badge&logo=arduino)](firmware/)

<br />

**[🚀 Live Demo](http://localhost:5173)** • **[📑 Architecture](#-system-architecture)** • **[⚡ 4-Step Pipeline](#-the-4-step-autonomous-pipeline)** • **[🔬 Benchmarks](#-validated-materials-benchmarks)** • **[🔌 Hardware Gateway](#-hardware-gateway--physical-lab-bridge)** • **[💻 Quickstart](#-quickstart-guide)**

<br />

![AutoLab OS Live Cockpit](docs/screenshots/04_lab_execution_cockpit.png)
*Figure 1: AutoLab OS Live Laboratory Execution Cockpit with Top Controls Bar, Real-Time Fluid Dynamics Animated Digital Twin Reactor, and 115200 Baud Microcontroller Telemetry.*

</div>

---

## 💡 Executive Summary & The Problem

While generative AI models and computational DFT screening have drastically accelerated *in silico* materials discovery, **the laboratory execution phase remains overwhelmingly manual, slow, and error-prone.**

Today, an experimental materials scientist researching solid-state battery electrolytes (LLZO), perovskite quantum dots ($CsPbBr_3$), or metal-organic frameworks (MOF-5) must:
1. 📄 **Manually parse** dense, unstructured papers and PDF supplementary files across hundreds of pages.
2. 🔍 **Extract and isolate** physical variables (*heat to 80 °C at 600 RPM for 60 min, inject precursor, ramp to 850 °C for calcination*).
3. ⚠️ **Manually calculate** heating ramp limits, solvent flashpoints, and boiling envelopes to avoid violent thermal runaway.
4. 🎛️ **Hand-program** laboratory hotplates, stirrers, and temperature controllers, or write custom microcontroller scripts.

### ⏱️ The Execution Bottleneck
> Translating a published paper into a successful, safe physical bench experiment currently takes **3 to 7 days per attempt**.

### 🚀 The AutoLab OS Breakthrough
**AutoLab OS** eliminates this friction by chaining scientific paper retrieval directly into physical lab actuation:
- ⚡ **From Literature to Hardware in <10 Seconds:** Ingests DOIs or queries 44.5M peer-reviewed papers via **Valency MCP**.
- 🛡️ **Mathematical Safety Envelopes:** Continuous thermodynamic ODE simulation $T(t)$ and kinetic agitation $\omega(t)$ verify safety before a single watt of power is delivered.
- 🔌 **Universal IoT Hardware Gateway:** Dispatches CRC32-checksummed bytecode to physical laboratory microcontrollers (ESP8266 / ESP32) via browser-native **WebSerial** or local Wi-Fi REST webhooks.
- 🌀 **Digital Twin Simulation:** Zero-hardware evaluation with real-time fluid vortex physics, radial thermal gradients, and 115200 baud serial telemetry.

---

## 🏛️ System Architecture

AutoLab OS is structured as a resilient 4-layer autonomous pipeline connecting knowledge graphs to physical silicon:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       1. SCIENTIFIC INTELLIGENCE LAYER                      │
│   44.5M Peer-Reviewed Papers • Valency MCP Search • DOI Extraction Engine   │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ Raw Text & Methods Extraction
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                        2. PROTOCOL COMPILATION LAYER                        │
│   Stage Dissection: DISPENSE ➔ RAMP_HEAT ➔ STIR ➔ DWELL ➔ CALCINATION       │
│   CRC32-Verified JSON Machine Bytecode • Precursor Stoichiometry Calculator │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ Machine Bytecode Protocol
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                    3. REACTIVE KINETICS & SAFETY ENVELOPE                   │
│   Thermodynamic ODE Engine: dT/dt = k_heat(P_heater) - k_loss(T - T_amb)    │
│   Hard Safety Interlocks • Thermal Shock & Solvent Boiling Threshold Checks │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ Verified Safe Dispatch
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                      4. PHYSICAL HARDWARE ACTUATION & IOT                   │
│   ESP8266/ESP32 NodeMCU • MAX6675 K-Thermocouple • Logic-Level MOSFETs/SSRs │
│   PWM Heater Control • L298N Magnetic Stirrer • Dual WebSerial / REST Wi-Fi │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## ⚡ The 4-Step Autonomous Pipeline

### Step 1: Scientific Intelligence & Benchmark Hub
The researcher starts with AutoLab OS's unified dashboard, exploring pre-validated benchmark protocols or initiating autonomous literature extraction.

![System Overview & Benchmarks](docs/screenshots/01_system_architecture.png)
*Figure 2: Overview screen detailing the autonomous architecture, system telemetry, and validated materials synthesis benchmarks.*

---

### Step 2: Valency MCP Literature Extraction & Parameter Isolation
Querying **44.5 million academic publications** via the Valency MCP integration, AutoLab OS extracts synthesis methodologies from raw text or PDFs and compiles them into discrete, machine-readable laboratory stages.

![Literature Extraction & Ingestion](docs/screenshots/02_literature_extraction.png)
*Figure 3: Literature search interface isolating physical parameters (temperature targets, dwell durations, RPM setpoints, ramp rates) from published scientific literature.*

- **Methodology Dissection:** Categorizes protocols into standardized laboratory primitives: `DISPENSE`, `RAMP_HEAT`, `STIR`, `ISOTHERMAL_DWELL`, `CALCINATION`, and `QUENCH`.
- **Precursor Quantities & Reagent Safety:** Calculates exact stoichiometry, identifying flashpoints, toxic vapor hazards, and solvent boiling bounds.
- **Machine Bytecode Compilation:** Formats physical parameters into unambiguous JSON payloads ready for firmware interpretation.

---

### Step 3: Reactive Kinetics Engine & Safety Verification
Before any physical equipment is energized, AutoLab OS simulates the synthesis run through an interactive thermodynamic and kinetic modeling engine.

![Reactive Kinetics & Safety Envelope](docs/screenshots/03_kinetics_verification.png)
*Figure 4: Continuous thermodynamic simulation curves $T(t)$ and kinetic agitation profiles $\omega(t)$ with real-time safety envelope validation.*

- **Thermodynamic Model:** Models continuous thermal curves using Newton's law of cooling and heater thermal inertia:
  $$\frac{dT}{dt} = \kappa_{\text{heater}} \cdot P_{\text{duty}} - \kappa_{\text{loss}} \cdot (T - T_{\text{ambient}})$$
- **Kinetic Agitation Profile:** Predicts fluid shear stress and suspension stability based on impeller geometry and motor RPM $\omega(t)$.
- **Dynamic Parameter Calibration:** Allows the researcher to fine-tune setpoints with live, instant mathematical curve recalculation.
- **Safety Interlock Envelope:** Automatically verifies that the thermal profile never breaches reagent boiling points, solvent flashpoints, or ceramic plate maximum thresholds.

---

### Step 4: Live Laboratory Cockpit & Digital Twin Reactor
The mission control center for autonomous materials synthesis. AutoLab OS features a prominent top-level controls bar and a high-density 3-column scientific cockpit.

![Live Laboratory Cockpit](docs/screenshots/04_lab_execution_cockpit.png)
*Figure 5: Step 4 Lab Execution Cockpit with top controls bar, stage checklist, live animated digital twin reactor, and real-time serial telemetry.*

- **Master Controls Bar:** Instant **Play / Pause**, **Fast-Forward (2x / 5x)** for rapid bench testing, and a prominent **Emergency Abort** fail-safe button.
- **Dynamic Digital Twin Reactor:**
  - Real-time CSS-driven fluid dynamics with dynamic vortex depth matching RPM.
  - Heat convection currents and thermal glow transitioning from cool amber to incandescent red.
  - Interactive UV beam toggle to visualize photoluminescent quantum dot nucleation.
  - Switchable view modes (**Vessel Anatomy** vs **Benchtop Rig**).
- **Physical Actuator Telemetry:** Live gauges for Ceramic Hotplate PWM (0–100%), Magnetic Stirrer Motor (0–1200 RPM), and Thermocouple PID feedback.
- **Live Serial Terminal:** Displays bidirectional 115200 baud hex/JSON communication streams between the browser and microcontroller.

---

## 🔌 Hardware Gateway & Physical Lab Bridge

AutoLab OS bridges the software-to-hardware gap through its built-in **Hardware Gateway Modal**, offering two connection paradigms:

![Hardware Gateway Options](docs/screenshots/05_hardware_gateway.png)
*Figure 6: Dual-option Hardware Gateway allowing direct browser-to-ESP microcontroller pairing or enterprise lab cluster integration.*

### Option 1: Direct ESP Microcontroller (WebSerial & Wi-Fi)
- **Chrome WebSerial API:** Plug any ESP8266 / ESP32 development board directly into your computer's USB port. AutoLab OS establishes a direct 115200 baud serial connection with zero native drivers.
- **Local Wi-Fi REST Webhook:** Dispatches verified JSON synthesis protocols wirelessly to the microcontroller's onboard HTTP server (`POST /api/protocol`).

### Option 2: Enterprise Lab Cluster (ROS2 / Opentrons OT-2)
- Integrates with institutional liquid-handling robots, cloud lab environments, and ROS2 micro-ROS nodes.

---

## 💻 Arduino C++ Firmware (Zero-Setup Flashing)

AutoLab OS includes complete, production-ready Arduino C++ firmware directly inside the application. Researchers can copy or download the `.ino` sketch with a single click.

![ESP Firmware Generator](docs/screenshots/06_esp_firmware_generator.png)
*Figure 7: In-app Arduino C++ firmware viewer with single-click copy and download functionality.*

### Firmware Highlights:
- **PID Temperature Control:** Smooth PWM modulation to eliminate thermal overshoot.
- **JSON Protocol Parser:** Parses incoming `stages[]` arrays using `ArduinoJson v6`.
- **Hardware Watchdog & Fail-Safes:** Shuts down heater MOSFETs instantly if serial heartbeat drops or thermocouple reads open-circuit.

---

## 📐 Circuit Schematic, Pinout & Bill of Materials

The entire AutoLab hardware node can be assembled on a breadboard for **under $25 USD**:

![Circuit Schematic & BOM](docs/screenshots/07_circuit_schematic_bom.png)
*Figure 8: Circuit schematic, ASCII architecture diagram, GPIO pinout mapping, and Bill of Materials.*

### Pinout Mapping:

| Component | Pin Function | ESP8266 NodeMCU | ESP32 DevKit |
| :--- | :--- | :--- | :--- |
| **Ceramic Heater** | PWM Output (MOSFET/SSR) | `GPIO14` (D5) | `GPIO25` |
| **Magnetic Stirrer** | PWM Output (L298N ENA) | `GPIO12` (D6) | `GPIO26` |
| **Direction A** | Digital Output (L298N IN1) | `GPIO13` (D7) | `GPIO27` |
| **Direction B** | Digital Output (L298N IN2) | `GPIO15` (D8) | `GPIO14` |
| **Thermocouple SO** | SPI MISO (MAX6675) | `GPIO4` (D2) | `GPIO19` |
| **Thermocouple CS** | SPI Chip Select (MAX6675) | `GPIO0` (D3) | `GPIO23` |
| **Thermocouple SCK** | SPI Clock (MAX6675) | `GPIO2` (D4) | `GPIO18` |

### ASCII Wiring Architecture:

```
[ 12V DC Supply ] ──┬──> [ 12V 40W Ceramic Heater ] ──> [ IRLZ44N MOSFET ] ──> GND
                    │                                          │ Gate
                    │                                     [ GPIO14 (D5) ]
                    │
                    ├──> [ L298N H-Bridge Driver ] ─────> [ 12V DC Stirrer Motor ]
                    │          │ ENA (PWM)   │ IN1/IN2
                    │     [ GPIO12 (D6) ]  [ D7, D8 ]
                    │
                    └──> [ LM2596 Buck Converter (5V) ] ──> [ ESP8266 NodeMCU Vin ]
                                                                   │
[ K-Type Thermocouple ] ──> [ MAX6675 SPI Module ] ───────────────┴──> [ SPI Bus D2, D3, D4 ]
```

---

## 🔬 Validated Materials Benchmarks

AutoLab OS is pre-configured with peer-reviewed synthesis protocols validated across diverse materials disciplines:

| Material System | Target Property | Citation DOI | Key Synthesis Stages |
| :--- | :--- | :--- | :--- |
| **LLZO Solid-State Electrolyte**<br>`Li6.4La3Zr1.4Ta0.6O12` | 1.02 mS/cm Ionic Conductivity | [10.1039/C8TA05321K](https://doi.org/10.1039/C8TA05321K) | Sol-gel: 25°C (450 RPM) ➔ 80°C (600 RPM) ➔ 250°C ➔ 850°C Calcination |
| **CsPbBr3 Perovskite QDs**<br>`CsPbBr3` | Photoluminescence QY > 90% | [10.1021/acs.nanolett.5b00640](https://doi.org/10.1021/acs.nanolett.5b00640) | Hot-injection: 120°C degas ➔ 180°C (1000 RPM flash inject) ➔ 22°C ice quench |
| **NMC811 Battery Cathode**<br>`LiNi0.8Mn0.1Co0.1O2` | Discharge Capacity > 205 mAh/g | [10.1002/aenm.202102143](https://doi.org/10.1002/aenm.202102143) | Co-precipitation: 55°C (900 RPM) ➔ Pre-oxidation 480°C ➔ 760°C O2 Calcination |
| **MOF-5 Porous Crystal**<br>`Zn4O(C8H4O4)3` | BET Surface Area > 2,900 m²/g | [10.1126/science.283.5405.1148](https://doi.org/10.1126/science.283.5405.1148) | Solvothermal: 30°C (500 RPM) ➔ 120°C sealed dwell ➔ 0.32°C/min slow cool |

---

## 🚀 Quickstart Guide

### 1. Web Application (React 18 + Vite)
Zero-configuration local setup:

```bash
# Clone the repository
git clone https://github.com/guchchi/AutoLab-OSI.git
cd AutoLab-OSI

# Install dependencies
npm install

# Start development server
npm run dev
```
Open **[http://localhost:5173](http://localhost:5173)** in Google Chrome or any Chromium browser (for WebSerial support).

To build the production bundle:
```bash
npm run build
```

---

### 2. Python Research Suite & Reactive Marimo Notebook
For data scientists and computational chemists who prefer scripting:

```bash
# Install Python package in editable mode
pip install -e .

# Launch the reactive Marimo research notebook
marimo run notebook.py
```

Or open in reactive interactive editing mode:
```bash
marimo edit notebook.py
```

---

### 3. ESP8266 / ESP32 Hardware Flashing
1. Connect your ESP8266 or ESP32 development board via USB.
2. Open [`firmware/autolab_controller.ino`](firmware/autolab_controller.ino) in the Arduino IDE.
3. Install required libraries: `ESP8266WiFi` (or `WiFi.h`) and `ArduinoJson` (v6+).
4. Enter your laboratory Wi-Fi credentials in the sketch:
   ```cpp
   const char* ssid = "YOUR_LAB_WIFI";
   const char* password = "YOUR_WIFI_PASSWORD";
   ```
5. Select your COM port and board, then click **Upload**.
6. In AutoLab OS, click **Connect Lab** in Step 4 to initiate live hardware control!

---

## 📂 Repository File Structure

```text
AutoLab-OSI/
├── autolab/                      # Core Python Research Package
│   ├── core/
│   │   ├── models.py             # Pydantic schemas for protocols & safety envelopes
│   │   └── kinetics.py           # Thermodynamic & kinetic ODE simulation engine
│   └── execution/
│       └── dispatcher.py         # IoT Webhook dispatcher client
├── docs/                         # Documentation & Media
│   └── screenshots/              # High-resolution application screenshots
│       ├── 01_system_architecture.png
│       ├── 02_literature_extraction.png
│       ├── 03_kinetics_verification.png
│       ├── 04_lab_execution_cockpit.png
│       ├── 05_hardware_gateway.png
│       ├── 06_esp_firmware_generator.png
│       └── 07_circuit_schematic_bom.png
├── firmware/                     # Embedded Hardware Firmware
│   ├── autolab_controller.ino    # Arduino C++ sketch (PID, JSON parser, failsafes)
│   └── SCHEMATIC.md              # Circuit schematic, pinout table, and BOM
├── src/                          # Web Application (React + Vite)
│   ├── components/
│   │   ├── Navbar.jsx            # Telemetry status bar & system clock
│   │   ├── StepOverview.jsx      # Step 1: System overview & benchmark picker
│   │   ├── StepLiterature.jsx    # Step 2: Valency literature query & extraction
│   │   ├── StepKinetics.jsx      # Step 3: Reactive thermodynamic curves & tuner
│   │   ├── StepExecution.jsx     # Step 4: Live cockpit & actuator telemetry
│   │   ├── DigitalTwinReactor.jsx# Real-time animated reactor (vortex, convection, UV)
│   │   ├── HardwareConnectModal.jsx # Dual-option hardware connection modal
│   │   └── ArchitectureModal.jsx # System architecture reference modal
│   ├── data/
│   │   └── benchmarkProtocols.js # Peer-reviewed synthesis datasets
│   ├── utils/
│   │   └── thermalKinetics.js    # Discrete mathematical simulation engine
│   ├── App.jsx                   # Master state machine & routing
│   └── index.css                 # Premium scientific glassmorphism styling
├── notebook.py                   # Reactive Marimo research notebook
├── pyproject.toml                # Python package metadata
├── package.json                  # Node.js dependencies
└── README.md                     # Hackathon project documentation
```

---

## 🏆 Hackathon Judging Criteria Alignment

| Judging Dimension | How AutoLab OS Delivers |
| :--- | :--- |
| **Scientific Impact** | Addresses the real bottleneck in materials discovery: the 3–7 day manual translation from literature to physical bench execution. |
| **Technical Depth** | Combines Valency MCP paper extraction, thermodynamic ODE modeling, reactive SVG curves, and real C++ firmware with PID loops. |
| **Hardware Realism** | Not a theoretical simulation. Fully functioning WebSerial browser link and under-$25 ESP8266/ESP32 circuit schematic with fail-safes. |
| **Design & UI/UX** | World-class scientific instrument aesthetic: clean typography, interactive digital twin reactor, live telemetry, and intuitive controls. |
| **Open Science & Reproducibility** | Fully open source under MIT License with zero proprietary lock-in. Anyone with a $4 microcontroller can reproduce published syntheses. |

---

## 👥 Authors & Acknowledgments

Developed with ❤️ for the **4th Annual Open Scientific Intelligence Hackathon (2026)**.

- **Lead Engineer & Architect:** [Guchchi / AutoLab Team](https://github.com/guchchi)
- **Literature Corpus:** Powered by **Valency MCP** (44.5 Million Academic Papers)
- **License:** Open source under the [MIT License](LICENSE)

<br />

<div align="center">
  <sub>Accelerating scientific discovery through open intelligence and autonomous hardware.</sub>
</div>
