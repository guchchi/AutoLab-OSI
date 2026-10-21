# AutoLab OS - Hardware Node Schematic & Wiring Guide
**Target Microcontroller:** ESP8266 NodeMCU v3 (Lolin/Amica) / ESP32  
**Purpose:** Physical execution of extracted laboratory synthesis protocols.

---

## 1. Pinout Map

| NodeMCU Pin | GPIO | Hardware Peripheral | Component Role |
| :--- | :--- | :--- | :--- |
| **D1** | GPIO5 | PWM Output | Logic-Level N-Channel MOSFET (IRLZ44N) or SSR driving Hotplate Heating Element |
| **D2** | GPIO4 | PWM Output | L298N / DRV8833 DC Motor Driver PWM driving Magnetic Stirrer Motor |
| **A0** | ADC0 | Analog Input | MAX6675 Thermocouple Signal Amplifier / PT100 RTD Sensor |
| **D5** | GPIO14 | Digital Out | Status LED (Red) — Active Thermal Heating Indicator |
| **D6** | GPIO12 | Digital Out | Status LED (Green) — Execution Running Indicator |
| **D7** | GPIO13 | Digital Out | Status LED (Blue) — System Standby / Cooling Indicator |
| **3V3 / VIN**| Power | 3.3V / 5.0V | Logic & Microcontroller Supply Rail |
| **GND** | Ground | Common Ground | Unified ground plane connecting MCU, sensor shield, and motor driver |

---

## 2. Circuit Block Diagram

```
             [ 12V 5A DC External Power ]
                         │
         ┌───────────────┴───────────────┐
         ▼                               ▼
 [ Buck Converter 5V ]          [ Power MOSFET D1 ]
         │                               │
         ▼                               ▼
 [ ESP8266 NodeMCU ]              [ Ceramic Hotplate ]
   │      │      │                       ▲
   │      │      └─────────[ MAX6675 ]───┘ (Surface Thermocouple)
   │      ▼
   │   [ L298N Driver D2 ] ──► [ DC Motor / Magnetic Stirrer Flea ]
   ▼
[ RGB Indicator D5-D7 ]
```

---

## 3. Bill of Materials (BOM)

1. **Microcontroller:** ESP8266 NodeMCU (or ESP32 DevKit v1) (~$4.50)
2. **Thermal Sensor:** K-Type Thermocouple with MAX6675 SPI or PT100 RTD Module (~$3.20)
3. **Heating Actuator:** 12V 40W Ceramic Heating Cartridge / PTC Heating Plate (~$6.00)
4. **Heating Switch:** IRLZ44N Logic-Level MOSFET or Solid State Relay (SSR-25DA) (~$2.50)
5. **Agitation Mechanism:** 12V High-Torque DC Motor + Neodymium N52 Bar Magnets (~$5.00)
6. **Reaction Vessel:** 100mL Borosilicate Glass Beaker + 25mm PTFE Magnetic Stir Bar (~$3.00)

Total Physical Hardware Cost: **<$25.00**
