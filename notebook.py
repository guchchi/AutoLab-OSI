import marimo

__generated_with = "0.25.2"
app = marimo.App(width="medium")


@app.cell
def __():
    import marimo as mo
    import altair as alt
    import pandas as pd
    from autolab.core.models import SynthesisProtocol, SynthesisStep, SafetyEnvelope, Citation
    from autolab.core.kinetics import compute_kinetics_profile
    from autolab.execution.dispatcher import create_hardware_payload, deploy_to_node
    return (
        Citation,
        SafetyEnvelope,
        SynthesisProtocol,
        SynthesisStep,
        alt,
        compute_kinetics_profile,
        create_hardware_payload,
        deploy_to_node,
        mo,
        pd,
    )


@app.cell
def __(mo):
    mo.md(
        r"""
        # 🧪 AutoLab OS • Reactive Materials Research Notebook
        **4th Annual Open Scientific Intelligence Hackathon**  
        *Bridging Scientific Literature to Physical Lab Execution in 10 Seconds.*
        """
    )
    return


@app.cell
def __(Citation, SafetyEnvelope, SynthesisProtocol, SynthesisStep):
    # Benchmark Material: LLZO Solid-State Electrolyte
    sample_protocol = SynthesisProtocol(
        id="llzo-electrolyte",
        name="Li7La3Zr2O12 (LLZO) Garnet Electrolyte",
        category="Solid-State Batteries",
        formula="Li6.4La3Zr1.4Ta0.6O12",
        target_property="1.02 mS/cm Ionic Conductivity",
        citation=Citation(
            title="Sol-gel synthesis of Ta-doped LLZO solid electrolyte",
            journal="J. Mater. Chem. A",
            doi="10.1039/C8TA05321K",
            year=2021,
            snippet="Dissolved in citric acid and ethylene glycol, stirred at 450 RPM at 25°C, heated to 80°C at 600 RPM for 60 min, pyrolyzed at 250°C for 90 min, and calcined at 850°C for 360 min."
        ),
        safety_envelope=SafetyEnvelope(
            max_temp_c=900.0,
            max_ramp_rate_c_min=12.0,
            critical_warnings=["NOx fume generation during pyrolysis", "Lithium volatilization above 700°C"]
        ),
        steps=[
            SynthesisStep(
                id=1,
                name="Precursor Chelation & Solvation",
                operation="STIR_DISPENSE",
                target_temp_c=25.0,
                ramp_rate_c_min=0.0,
                duration_min=30.0,
                stir_rpm=450,
                reagents="LiNO3, La(NO3)3, ZrO(NO3)2, Citric Acid, Ethylene Glycol",
                hardware_action="Stirrer 450 RPM, ambient RTD active"
            ),
            SynthesisStep(
                id=2,
                name="Sol-to-Gel Esterification",
                operation="RAMP_HEAT_STIR",
                target_temp_c=80.0,
                ramp_rate_c_min=2.5,
                duration_min=60.0,
                stir_rpm=600,
                reagents="Polymeric chelation intermediate",
                hardware_action="PID ramp 80°C, 600 RPM agitation"
            ),
            SynthesisStep(
                id=3,
                name="Organic Pyrolysis",
                operation="HIGH_TEMP_PYROLYSIS",
                target_temp_c=250.0,
                ramp_rate_c_min=4.0,
                duration_min=90.0,
                stir_rpm=0,
                reagents="Dried xerogel precursor",
                hardware_action="Decouple stirrer, engage heating element"
            ),
            SynthesisStep(
                id=4,
                name="High-Temperature Calcination",
                operation="CALCINATION",
                target_temp_c=850.0,
                ramp_rate_c_min=8.0,
                duration_min=360.0,
                stir_rpm=0,
                reagents="Amorphous oxide ash",
                hardware_action="Furnace heating to 850°C"
            ),
        ]
    )
    return (sample_protocol,)


@app.cell
def __(mo):
    # Reactive Researcher Calibration Controls
    temp_offset_slider = mo.ui.slider(-30, 30, step=1, value=0, label="Temperature Offset (°C)")
    rpm_scale_slider = mo.ui.slider(0.5, 1.5, step=0.1, value=1.0, label="RPM Scale Factor")
    deploy_btn = mo.ui.button(label="🚀 Deploy Webhook to Physical NodeMCU", kind="warn")

    mo.hstack([temp_offset_slider, rpm_scale_slider, deploy_btn], justify="start", gap=2)
    return deploy_btn, rpm_scale_slider, temp_offset_slider


@app.cell
def __(
    alt,
    compute_kinetics_profile,
    mo,
    pd,
    rpm_scale_slider,
    sample_protocol,
    temp_offset_slider,
):
    # Compute Reactive Kinetics
    kinetics = compute_kinetics_profile(
        sample_protocol,
        temp_offset=temp_offset_slider.value,
        rpm_multiplier=rpm_scale_slider.value
    )

    df = pd.DataFrame({
        "Time (min)": kinetics["time_min"],
        "Temperature (°C)": kinetics["temperature_c"],
        "Stirring (RPM)": kinetics["stir_rpm"],
        "Stage": kinetics["stages"]
    })

    # Altair Thermal Curve
    chart_temp = alt.Chart(df).mark_line(color="#00f2fe", strokeWidth=2.5).encode(
        x="Time (min):Q",
        y=alt.Y("Temperature (°C):Q", scale=alt.Scale(domain=[0, 950])),
        tooltip=["Time (min)", "Temperature (°C)", "Stirring (RPM)", "Stage"]
    ).properties(width=680, height=280, title="Reactive Thermodynamic Profile T(t)")

    # Altair Stirring Curve
    chart_rpm = alt.Chart(df).mark_line(color="#10b981", strokeDash=[4, 4]).encode(
        x="Time (min):Q",
        y="Stirring (RPM):Q"
    )

    combined_chart = alt.layer(chart_temp, chart_rpm).resolve_scale(y="independent")
    mo.ui.altair_chart(combined_chart)
    return chart_rpm, chart_temp, combined_chart, df, kinetics


@app.cell
def __(
    create_hardware_payload,
    deploy_btn,
    deploy_to_node,
    mo,
    rpm_scale_slider,
    sample_protocol,
    temp_offset_slider,
):
    if deploy_btn.value:
        payload = create_hardware_payload(
            sample_protocol,
            temp_offset=temp_offset_slider.value,
            rpm_multiplier=rpm_scale_slider.value
        )
        res = deploy_to_node("http://192.168.4.1/api/protocol", payload)
        mo.output.replace(
            mo.md(f"✅ **Dispatched to ESP8266 Hardware Node!**\n\n```json\n{payload}\n```")
        )
    return (payload, res) if deploy_btn.value else ()


if __name__ == "__main__":
    app.run()
