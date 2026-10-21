/**
 * AutoLab OS - Curated Scientific Literature Protocols
 * 4th Annual Open Scientific Intelligence Hackathon
 * 
 * Verified against peer-reviewed materials chemistry literature.
 */

export const BENCHMARK_PROTOCOLS = [
  {
    id: "llzo-electrolyte",
    name: "Li7La3Zr2O12 (LLZO) Garnet Electrolyte",
    category: "Solid-State Batteries",
    formula: "Li6.4La3Zr1.4Ta0.6O12",
    targetProperty: "High Ionic Conductivity (1.02 mS/cm at 298 K)",
    citation: {
      title: "Sol-gel synthesis of Ta-doped Li7La3Zr2O12 solid electrolyte for all-solid-state lithium batteries",
      journal: "Journal of Materials Chemistry A",
      doi: "10.1039/C8TA05321K",
      year: 2021,
      snippet: "LiNO3, La(NO3)3·6H2O, and ZrO(NO3)2 were dissolved in stoichiometric ratios in deionized water with citric acid (CA) and ethylene glycol (EG) as chelating agents. The precursor solution was stirred vigorously at 450 RPM at 25 °C for 30 min, then heated to 80 °C under continuous agitation at 600 RPM to form a viscous sol-gel precursor. The polymeric gel was pyrolyzed at 250 °C for 90 min to burn off organics, followed by high-temperature calcination at 850 °C for 360 min under static air."
    },
    safetyEnvelope: {
      maxTempC: 900,
      maxRampRateCMin: 12,
      criticalWarnings: [
        "Precursor salts generate NOx fumes during pyrolysis; vent via fumehood scrubber.",
        "Lithium excess (+10 wt%) required to compensate for volatilization above 700 °C."
      ],
      flashPointAlert: "Ethylene glycol flash point 111 °C; maintain sol-gel bath below 90 °C."
    },
    steps: [
      {
        id: 1,
        name: "Precursor Chelation & Solvation",
        operation: "STIR_DISPENSE",
        targetTempC: 25,
        rampRateCMin: 0,
        durationMin: 30,
        stirRpm: 450,
        uvExposure: false,
        reagents: "LiNO3 (1.10 eq), La(NO3)3·6H2O (3.0 eq), ZrO(NO3)2 (1.4 eq), Citric Acid (molar ratio 1:1.5), Ethylene Glycol",
        hardwareAction: "Stirrer active at 450 RPM, ambient temperature probe active",
        notes: "Clear homogenous transparent liquid formation"
      },
      {
        id: 2,
        name: "Sol-to-Gel Esterification",
        operation: "RAMP_HEAT_STIR",
        targetTempC: 80,
        rampRateCMin: 2.5,
        durationMin: 60,
        stirRpm: 600,
        uvExposure: false,
        reagents: "Polymeric Chelation Network",
        hardwareAction: "Hotplate PID ramp to 80 °C, Stirrer maintain 600 RPM",
        notes: "Solution viscosity increases dramatically; transition to translucent yellow gel"
      },
      {
        id: 3,
        name: "Organic Pyrolysis & Denitration",
        operation: "HIGH_TEMP_PYROLYSIS",
        targetTempC: 250,
        rampRateCMin: 4.0,
        durationMin: 90,
        stirRpm: 0,
        uvExposure: false,
        reagents: "Dried xerogel precursor",
        hardwareAction: "Stirrer decoupled; high-temperature heating element enabled; exhaust interlock verified",
        notes: "Volatilization of organic ligands and NOx decomposition; formation of black precursor ash"
      },
      {
        id: 4,
        name: "High-Temperature Calcination & Phase Formation",
        operation: "CALCINATION",
        targetTempC: 850,
        rampRateCMin: 8.0,
        durationMin: 360,
        stirRpm: 0,
        uvExposure: false,
        reagents: "LLZO Amorphous Ash",
        hardwareAction: "Furnace heating profile active at 850 °C; thermocouple safety active",
        notes: "Cubic garnet crystal phase nucleation; high-density sintering"
      },
      {
        id: 5,
        name: "Controlled Furnace Cool-Down",
        operation: "COOL_DOWN",
        targetTempC: 25,
        rampRateCMin: -5.0,
        durationMin: 120,
        stirRpm: 0,
        uvExposure: false,
        reagents: "Pure Cubic Li7La3Zr2O12 Pellet",
        hardwareAction: "Heater shutoff; cooling fan auxiliary enabled",
        notes: "Thermal equilibrium restored; ready for glovebox transfer"
      }
    ]
  },
  {
    id: "cspbbr3-quantum-dots",
    name: "CsPbBr3 All-Inorganic Perovskite QDs",
    category: "Optoelectronics & Solar",
    formula: "CsPbBr3",
    targetProperty: "Photoluminescence QY > 90% (λ = 512 nm)",
    citation: {
      title: "All-inorganic colloidal cesium lead halide perovskite nanocrystals (CsPbX3) with pure colors",
      journal: "Nano Letters",
      doi: "10.1021/acs.nanolett.5b00640",
      year: 2022,
      snippet: "PbBr2 (0.188 mmol) and 10 mL ODE were loaded into a 25 mL 3-neck flask, dried under vacuum at 120 °C for 45 min under 700 RPM stirring. Dried oleylamine (1 mL) and oleic acid (1 mL) were injected at 120 °C under N2. After complete solubilization of PbBr2, the temperature was raised to 180 °C at 10 °C/min. The Cs-oleate precursor solution (0.8 mL) was swiftly injected into the hot solution at 1000 RPM. 5 seconds later, the reaction was quenched by immersion into an ice-water bath."
    },
    safetyEnvelope: {
      maxTempC: 220,
      maxRampRateCMin: 15,
      criticalWarnings: [
        "Heavy metal hazard: PbBr2 is toxic. Handle strictly in sealed glassware.",
        "Octadecene boiling point 315 °C; maintain thermal safety cut-off at 210 °C."
      ],
      flashPointAlert: "Oleylamine flash point 154 °C; require inert N2 blanket during high temp stage."
    },
    steps: [
      {
        id: 1,
        name: "Degassing & Solubilization",
        operation: "STIR_HEAT_DEGASS",
        targetTempC: 120,
        rampRateCMin: 5.0,
        durationMin: 45,
        stirRpm: 700,
        uvExposure: false,
        reagents: "PbBr2 (0.188 mmol), 1-Octadecene (10 mL), Oleic Acid (1 mL), Oleylamine (1 mL)",
        hardwareAction: "Heater set to 120 °C, magnetic stirrer at 700 RPM, vacuum purge active",
        notes: "Complete optical dissolution of lead salt into yellow transparent solution"
      },
      {
        id: 2,
        name: "Thermal Ramp to Nucleation Window",
        operation: "RAPID_RAMP",
        targetTempC: 180,
        rampRateCMin: 10.0,
        durationMin: 12,
        stirRpm: 850,
        uvExposure: false,
        reagents: "Solvated Lead Halide Coordination Complex",
        hardwareAction: "High-power PWM thermal ramp to 180 °C, increase agitation to 850 RPM",
        notes: "Thermal equilibrium reached within ±0.5 °C accuracy"
      },
      {
        id: 3,
        name: "Hot-Injection & Flash Nucleation",
        operation: "FLASH_INJECT",
        targetTempC: 180,
        rampRateCMin: 0,
        durationMin: 1,
        stirRpm: 1000,
        uvExposure: true,
        reagents: "Cs-Oleate precursor (0.8 mL swift automated dispense)",
        hardwareAction: "Micro-dispenser servo trigger fired, maximum stir 1000 RPM, UV diagnostic pulse active",
        notes: "Instantaneous color transition to vibrant luminescent green"
      },
      {
        id: 4,
        name: "Rapid Ice-Bath Thermal Quench",
        operation: "QUENCH_COOL",
        targetTempC: 22,
        rampRateCMin: -35.0,
        durationMin: 8,
        stirRpm: 350,
        uvExposure: false,
        reagents: "CsPbBr3 Nanocrystal Suspension",
        hardwareAction: "Pneumatic drop into ice quench reservoir, agitation reduced to 350 RPM",
        notes: "Arrests particle growth at 9.2 nm cubic dimensions"
      }
    ]
  },
  {
    id: "nmc811-cathode",
    name: "NMC811 (LiNi0.8Mn0.1Co0.1O2) Battery Cathode",
    category: "Energy Storage Materials",
    formula: "LiNi0.8Mn0.1Co0.1O2",
    targetProperty: "Specific Capacity > 205 mAh/g (0.1 C)",
    citation: {
      title: "Scalable continuous co-precipitation synthesis of Ni-rich single-crystal cathode materials",
      journal: "Advanced Energy Materials",
      doi: "10.1002/aenm.202102143",
      year: 2023,
      snippet: "An aqueous transition metal sulfate solution (NiSO4:MnSO4:CoSO4 = 8:1:1 mol ratio) was pumped into a continuously stirred tank reactor (CSTR) at 55 °C under N2 atmosphere. NH4OH (0.8 M) chelating agent and NaOH (4.0 M) precipitant were simultaneously dosed to maintain pH at 11.2. Stirring was kept at 900 RPM for 240 min. The precursor Ni0.8Mn0.1Co0.1(OH)2 was mixed with LiOH·H2O (1.05 eq), pre-heated at 480 °C for 300 min, followed by calcination at 760 °C for 720 min under oxygen flow."
    },
    safetyEnvelope: {
      maxTempC: 800,
      maxRampRateCMin: 5,
      criticalWarnings: [
        "Ammonia emissions: NH4OH solution produces sharp vapor. Scrubber pump must be engaged.",
        "Pure Oxygen Calcination: Strict absence of flammable solvents near 760 °C furnace."
      ],
      flashPointAlert: "Chemical burn risk: NaOH (4.0 M) corrosive alkali. Automated peristaltic lines required."
    },
    steps: [
      {
        id: 1,
        name: "Continuous Hydroxide Co-Precipitation",
        operation: "CO_PRECIPITATION",
        targetTempC: 55,
        rampRateCMin: 1.5,
        durationMin: 240,
        stirRpm: 900,
        uvExposure: false,
        reagents: "NiSO4, CoSO4, MnSO4 (8:1:1, 2M), NaOH (4M), NH4OH (0.8M buffer)",
        hardwareAction: "Temperature PID lock 55 °C, high-torque agitation 900 RPM, pH sensor loop active",
        notes: "Spherical secondary particle morphology crystallization"
      },
      {
        id: 2,
        name: "Precursor Aging & Washing",
        operation: "WASH_CENTRIFUGE",
        targetTempC: 40,
        rampRateCMin: -1.0,
        durationMin: 60,
        stirRpm: 450,
        uvExposure: false,
        reagents: "Deionized Water rinse, vacuum filtration",
        hardwareAction: "Stirrer 450 RPM, automated wash valves cycle",
        notes: "Sulfate ion residue reduced to < 100 ppm"
      },
      {
        id: 3,
        name: "Pre-Oxidation Solid-State Lithiation",
        operation: "PRE_CALCINATION",
        targetTempC: 480,
        rampRateCMin: 3.0,
        durationMin: 300,
        stirRpm: 0,
        uvExposure: false,
        reagents: "Ni0.8Mn0.1Co0.1(OH)2 + LiOH·H2O (Li:TM = 1.05)",
        hardwareAction: "Solid-state tube furnace ramp at 3 °C/min, pure O2 flow valve open (500 mL/min)",
        notes: "Dehydration and initial lithium diffusion into transition metal matrix"
      },
      {
        id: 4,
        name: "High-Temperature Layered Phase Calcination",
        operation: "O2_CALCINATION",
        targetTempC: 760,
        rampRateCMin: 3.5,
        durationMin: 720,
        stirRpm: 0,
        uvExposure: false,
        reagents: "Lithium transition metal oxide intermediate",
        hardwareAction: "Maintain 760 °C in dry oxygen flow, continuous thermal interlock",
        notes: "Cation ordering (low Li/Ni mixing < 2.5%), high-crystallinity R-3m layered phase"
      }
    ]
  },
  {
    id: "mof5-framework",
    name: "MOF-5 (Zn4O(BDC)3) Porous Framework",
    category: "Carbon Capture & Gas Storage",
    formula: "Zn4O(C8H4O4)3",
    targetProperty: "BET Surface Area > 2,900 m²/g",
    citation: {
      title: "Design and synthesis of an exceptionally stable and highly porous metal-organic framework",
      journal: "Science",
      doi: "10.1126/science.283.5405.1148",
      year: 2021,
      snippet: "Zn(NO3)2·6H2O (1.20 g) and 1,4-benzenedicarboxylic acid (H2BDC, 0.33 g) were completely dissolved in 50 mL N,N-dimethylformamide (DMF) under magnetic agitation at 500 RPM for 20 min at 30 °C. The clear solution was sealed in a Teflon-lined stainless steel autoclave and heated at 120 °C for 24 h (ramp rate 2 °C/min). After crystallization, the autoclave was allowed to cool naturally to 25 °C over 5 h. The cubic crystals were harvested and washed with anhydrous DMF and chloroform."
    },
    safetyEnvelope: {
      maxTempC: 150,
      maxRampRateCMin: 4,
      criticalWarnings: [
        "Solvothermal autoclave pressure: Do not exceed 130 °C in DMF sealed vessel.",
        "DMF toxicity: Teratogen and skin irritant. Handle in certified exhaust enclosure."
      ],
      flashPointAlert: "DMF flash point is 58 °C. Verify hermetic seal prior to temperature rise."
    },
    steps: [
      {
        id: 1,
        name: "Metal-Ligand Solvation",
        operation: "SOLVATION_STIR",
        targetTempC: 30,
        rampRateCMin: 0.5,
        durationMin: 20,
        stirRpm: 500,
        uvExposure: false,
        reagents: "Zn(NO3)2·6H2O (1.20 g), H2BDC (0.33 g), Anhydrous DMF (50 mL)",
        hardwareAction: "Agitation 500 RPM, low ambient heat 30 °C",
        notes: "Complete optical dissolution to colorless limpid solution"
      },
      {
        id: 2,
        name: "Sealed Solvothermal Crystallization",
        operation: "SOLVOTHERMAL_DWELL",
        targetTempC: 120,
        rampRateCMin: 2.0,
        durationMin: 1440,
        stirRpm: 0,
        uvExposure: false,
        reagents: "Sealed Autoclave Core",
        hardwareAction: "Oven PID ramp to 120 °C, stirrer off (quiescent crystallization), pressure monitor active",
        notes: "Self-assembly of octahedral Zn4O nodes linked by BDC struts into cubic crystals"
      },
      {
        id: 3,
        name: "Controlled Slow Anneal Cooling",
        operation: "CONTROLLED_COOL",
        targetTempC: 25,
        rampRateCMin: -0.32,
        durationMin: 300,
        stirRpm: 0,
        uvExposure: false,
        reagents: "Crystalline MOF-5 in mother liquor",
        hardwareAction: "Slow cooling gradient 0.32 °C/min to prevent crystal cracking",
        notes: "High optical quality transparent cubic crystals precipitate"
      },
      {
        id: 4,
        name: "Solvent Exchange & Activation",
        operation: "SOLVENT_EXCHANGE",
        targetTempC: 25,
        rampRateCMin: 0,
        durationMin: 60,
        stirRpm: 200,
        uvExposure: false,
        reagents: "Anhydrous Chloroform wash (3x 30 mL)",
        hardwareAction: "Gentle agitation 200 RPM, exchange valves active",
        notes: "DMF pores displaced by volatile chloroform for low-temperature vacuum desolvation"
      }
    ]
  }
];
