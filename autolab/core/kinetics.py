"""
Thermodynamic and kinetic time-series simulation engine.
Computes continuous T(t) thermal profiles and stirring speeds from discrete steps.
"""

from typing import List, Dict, Any, Tuple
from .models import SynthesisProtocol

def compute_kinetics_profile(
    protocol: SynthesisProtocol,
    temp_offset: float = 0.0,
    rpm_multiplier: float = 1.0,
    time_scale: float = 1.0
) -> Dict[str, Any]:
    time_points = [0.0]
    temp_points = [25.0]
    rpm_points = [0]
    stage_labels = ["Ambient Standby"]

    current_time = 0.0
    current_temp = 25.0

    violations = []

    for step in protocol.steps:
        target_temp = step.target_temp_c + temp_offset
        target_rpm = int(step.stir_rpm * rpm_multiplier)
        duration_min = step.duration_min * time_scale
        ramp_rate = step.ramp_rate_c_min

        # Check safety ceiling
        if target_temp > protocol.safety_envelope.max_temp_c:
            violations.append(f"Stage '{step.name}' exceeds safety ceiling ({target_temp} > {protocol.safety_envelope.max_temp_c}°C)")

        temp_delta = target_temp - current_temp
        if abs(temp_delta) > 1.0 and ramp_rate != 0:
            ramp_duration = abs(temp_delta) / abs(ramp_rate)
            steps_num = max(4, int(ramp_duration / 2))
            for s in range(1, steps_num + 1):
                frac = s / steps_num
                t = current_time + frac * ramp_duration
                temp = current_temp + frac * temp_delta
                time_points.append(round(t, 2))
                temp_points.append(round(temp, 2))
                rpm_points.append(target_rpm)
                stage_labels.append(f"{step.name} (Ramp)")
            current_time += ramp_duration
            current_temp = target_temp

        # Dwell phase
        dwell_segments = max(4, int(duration_min / 5))
        for s in range(1, dwell_segments + 1):
            frac = s / dwell_segments
            t = current_time + frac * duration_min
            time_points.append(round(t, 2))
            temp_points.append(round(current_temp, 2))
            rpm_points.append(target_rpm)
            stage_labels.append(step.name)
        current_time += duration_min

    return {
        "time_min": time_points,
        "temperature_c": temp_points,
        "stir_rpm": rpm_points,
        "stages": stage_labels,
        "total_duration_min": round(current_time, 2),
        "peak_temperature_c": max(temp_points),
        "max_rpm": max(rpm_points),
        "violations": violations
    }
