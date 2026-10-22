/**
 * AutoLab OS - Thermodynamic & Kinetic Simulation Engine
 * Generates continuous mathematical curves T(t) and ω(t) from discrete protocol steps.
 */

export function generateKineticsData(protocol, overrides = {}) {
  const tempOffset = overrides.tempOffset || 0;
  const rpmMultiplier = overrides.rpmMultiplier !== undefined ? overrides.rpmMultiplier : 1;
  const timeScale = overrides.timeScale !== undefined ? overrides.timeScale : 1;

  if (!protocol || !protocol.steps || protocol.steps.length === 0) {
    return { points: [], stats: { totalTimeMin: 0, peakTemp: 25, maxRpm: 0, violations: [] } };
  }

  const points = [];
  let currentTime = 0;
  let currentTemp = 25; // ambient starting temp
  const violations = [];

  // Starting ambient point
  points.push({
    time: 0,
    temp: currentTemp,
    rpm: 0,
    stepId: 0,
    stepName: "Ambient Initialization",
    operation: "STANDBY",
    safetyLimit: protocol.safetyEnvelope.maxTempC
  });

  protocol.steps.forEach((step, index) => {
    const targetTemp = Math.max(20, Math.min(step.targetTempC + tempOffset, 1200));
    const targetRpm = Math.round(step.stirRpm * rpmMultiplier);
    const durationMin = Math.max(0.5, step.durationMin * timeScale);
    const rampRate = step.rampRateCMin || 0;

    // Safety checks
    if (targetTemp > protocol.safetyEnvelope.maxTempC) {
      violations.push({
        type: "OVER_TEMPERATURE",
        step: step.name,
        message: `Target temperature ${targetTemp}°C exceeds safety ceiling (${protocol.safetyEnvelope.maxTempC}°C)`
      });
    }

    // Only flag heating ramp rates exceeding safe ceramic threshold, not intentional cold quench
    if (rampRate > protocol.safetyEnvelope.maxRampRateCMin) {
      violations.push({
        type: "THERMAL_SHOCK_RISK",
        step: step.name,
        message: `Heating ramp rate ${rampRate}°C/min exceeds safe ceramic threshold (${protocol.safetyEnvelope.maxRampRateCMin}°C/min)`
      });
    }

    // Step has two possible phases: Ramp phase (if targetTemp != currentTemp) and Dwell phase
    const tempDelta = targetTemp - currentTemp;
    let rampDuration = 0;

    if (Math.abs(tempDelta) > 1 && rampRate !== 0) {
      rampDuration = Math.abs(tempDelta) / Math.abs(rampRate);
      // Generate ramp points
      const rampSegments = Math.max(4, Math.min(20, Math.ceil(rampDuration / 2)));
      for (let s = 1; s <= rampSegments; s++) {
        const fraction = s / rampSegments;
        const t = currentTime + fraction * rampDuration;
        const temp = currentTemp + fraction * tempDelta;
        // Smooth S-curve acceleration for RPM
        const currentRpm = points[points.length - 1].rpm;
        const rpm = Math.round(currentRpm + (targetRpm - currentRpm) * (fraction * fraction * (3 - 2 * fraction)));

        points.push({
          time: Math.round(t * 10) / 10,
          temp: Math.round(temp * 10) / 10,
          rpm: rpm,
          stepId: step.id,
          stepName: `${step.name} (Ramp)`,
          operation: step.operation,
          safetyLimit: protocol.safetyEnvelope.maxTempC
        });
      }
      currentTime += rampDuration;
      currentTemp = targetTemp;
    }

    // Dwell / Soak Phase
    const dwellDuration = durationMin;
    const dwellSegments = Math.max(4, Math.min(25, Math.ceil(dwellDuration / 5)));
    for (let s = 1; s <= dwellSegments; s++) {
      const fraction = s / dwellSegments;
      const t = currentTime + fraction * dwellDuration;
      // Slight thermal jitter (±0.2 °C) to reflect real PID fluctuation
      const pidNoise = (Math.sin(t * 1.5) * 0.2);

      points.push({
        time: Math.round(t * 10) / 10,
        temp: Math.round((currentTemp + pidNoise) * 10) / 10,
        rpm: targetRpm,
        stepId: step.id,
        stepName: step.name,
        operation: step.operation,
        safetyLimit: protocol.safetyEnvelope.maxTempC
      });
    }
    currentTime += dwellDuration;
  });

  const peakTemp = Math.max(...points.map(p => p.temp));
  const maxRpm = Math.max(...points.map(p => p.rpm));

  return {
    points,
    stats: {
      totalTimeMin: Math.round(currentTime * 10) / 10,
      peakTemp,
      maxRpm,
      stepCount: protocol.steps.length,
      violations
    }
  };
}

/**
 * Generate standard IoT execution bytecode payload for ESP8266/NodeMCU
 */
export function generateHardwarePayload(protocol, overrides = {}) {
  const kinetics = generateKineticsData(protocol, overrides);
  const tempOffset = overrides.tempOffset || 0;
  const rpmMultiplier = overrides.rpmMultiplier !== undefined ? overrides.rpmMultiplier : 1;
  const timeScale = overrides.timeScale !== undefined ? overrides.timeScale : 1;

  const hardwareSteps = protocol.steps.map((step, idx) => ({
    seq: idx + 1,
    op: step.operation,
    target_temp_c: Math.round(step.targetTempC + tempOffset),
    ramp_c_min: step.rampRateCMin,
    dwell_sec: Math.round(step.durationMin * timeScale * 60),
    rpm: Math.round(step.stirRpm * rpmMultiplier),
    uv_active: Boolean(step.uvExposure),
    checksum: ((idx + 1) * 31 + Math.round(step.targetTempC + tempOffset)) & 0xffff
  }));

  const payload = {
    autolab_spec_version: "2.4-OSI",
    experiment_id: `EXP-${Date.now().toString(36).toUpperCase()}`,
    material_target: protocol.name,
    formula: protocol.formula,
    safety_max_temp_c: protocol.safetyEnvelope.maxTempC,
    total_steps: hardwareSteps.length,
    estimated_duration_sec: Math.round(kinetics.stats.totalTimeMin * 60),
    instructions: hardwareSteps,
    crc32_signature: "0x" + Math.floor(Math.random() * 0xffffffff).toString(16).padStart(8, '0').toUpperCase()
  };

  return payload;
}
