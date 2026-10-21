"""
Core Pydantic domain models for AutoLab OS synthesis protocols and safety envelopes.
"""

from typing import List, Optional
from enum import Enum
from pydantic import BaseModel, Field

class OperationType(str, Enum):
    STIR_DISPENSE = "STIR_DISPENSE"
    RAMP_HEAT = "RAMP_HEAT"
    RAMP_HEAT_STIR = "RAMP_HEAT_STIR"
    ISOTHERMAL_DWELL = "ISOTHERMAL_DWELL"
    HIGH_TEMP_PYROLYSIS = "HIGH_TEMP_PYROLYSIS"
    CALCINATION = "CALCINATION"
    COOL_DOWN = "COOL_DOWN"
    QUENCH_COOL = "QUENCH_COOL"
    FLASH_INJECT = "FLASH_INJECT"

class SynthesisStep(BaseModel):
    id: int
    name: str
    operation: str
    target_temp_c: float = Field(..., ge=-20, le=1500)
    ramp_rate_c_min: float = Field(0.0, description="Ramp rate in °C/min")
    duration_min: float = Field(..., gt=0, description="Dwell duration in minutes")
    stir_rpm: int = Field(0, ge=0, le=2500, description="Agitation speed in RPM")
    uv_exposure: bool = False
    reagents: str
    hardware_action: str
    notes: Optional[str] = None

class SafetyEnvelope(BaseModel):
    max_temp_c: float
    max_ramp_rate_c_min: float
    critical_warnings: List[str] = []
    flash_point_alert: Optional[str] = None

class Citation(BaseModel):
    title: str
    journal: str
    doi: str
    year: int
    snippet: str

class SynthesisProtocol(BaseModel):
    id: str
    name: str
    category: str
    formula: str
    target_property: str
    citation: Citation
    safety_envelope: SafetyEnvelope
    steps: List[SynthesisStep]
