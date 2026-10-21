"""
IoT Webhook Dispatcher for sending protocols to ESP8266 or Digital Twin simulator.
"""

import requests
import json
from typing import Dict, Any
from ..core.models import SynthesisProtocol

def create_hardware_payload(protocol: SynthesisProtocol, temp_offset: float = 0.0, rpm_multiplier: float = 1.0) -> Dict[str, Any]:
    instructions = []
    for idx, step in enumerate(protocol.steps):
        instructions.append({
            "seq": idx + 1,
            "op": step.operation,
            "target_temp_c": round(step.target_temp_c + temp_offset, 1),
            "ramp_c_min": step.ramp_rate_c_min,
            "dwell_sec": int(step.duration_min * 60),
            "rpm": int(step.stir_rpm * rpm_multiplier),
            "uv_active": step.uv_exposure
        })

    return {
        "autolab_spec_version": "2.4-OSI",
        "material_target": protocol.name,
        "formula": protocol.formula,
        "safety_max_temp_c": protocol.safety_envelope.max_temp_c,
        "total_steps": len(instructions),
        "instructions": instructions
    }

def deploy_to_node(endpoint_url: str, payload: Dict[str, Any], timeout_sec: float = 5.0) -> Dict[str, Any]:
    try:
        response = requests.post(
            endpoint_url,
            json=payload,
            headers={"Content-Type": "application/json", "X-AutoLab-Client": "Python-CLI"},
            timeout=timeout_sec
        )
        return {
            "success": response.status_code == 200,
            "status_code": response.status_code,
            "response": response.json() if response.headers.get("Content-Type") == "application/json" else response.text
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "mode": "FALLBACK_SIMULATION"
        }
