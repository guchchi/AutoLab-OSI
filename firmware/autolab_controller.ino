/**
 * AutoLab OS - ESP8266 / NodeMCU Hardware Controller Firmware
 * 4th Annual Open Scientific Intelligence Hackathon
 * 
 * Hardware Target: ESP8266 (NodeMCU v2/v3 / D1 Mini)
 * Features:
 *  - REST API Webhook Listener (POST /api/protocol)
 *  - Discrete PID Thermal Control (PWM Heater output)
 *  - Magnetic Stirrer Tachometer & Motor PWM (RPM Regulation)
 *  - RGB Status LED State Machine
 *  - Serial Telemetry Broadcast (115200 Baud)
 */

#include <ESP8266WiFi.h>
#include <ESP8266WebServer.h>
#include <ArduinoJson.h>

// Wi-Fi Configuration
const char* ssid = "LAB_WIFI_SSID";
const char* password = "LAB_WIFI_PASSWORD";

// Hardware Pin Definitions
#define PIN_HEATER_PWM     D1  // GPIO5 - Logic-level MOSFET / Solid State Relay (Heater)
#define PIN_STIRRER_PWM    D2  // GPIO4 - L298N / Motor Driver PWM (Stirrer)
#define PIN_THERMOCOUPLE   A0  // Analog In - MAX6675 / RTD Thermocouple Amplifier
#define PIN_LED_RED        D5  // GPIO14 - RGB Red (Heating)
#define PIN_LED_GREEN      D6  // GPIO12 - RGB Green (Running)
#define PIN_LED_BLUE       D7  // GPIO13 - RGB Blue (Cooling/Standby)

ESP8266WebServer server(80);

// Hardware State Machine
enum LabState {
  STATE_STANDBY,
  STATE_ARMED,
  STATE_EXECUTING_STAGE,
  STATE_SAFETY_TRIP,
  STATE_COMPLETED
};

LabState currentState = STATE_STANDBY;

// Active Step Execution Variables
struct ExecutionStep {
  int seq;
  char op[32];
  float target_temp_c;
  float ramp_c_min;
  unsigned long dwell_sec;
  int target_rpm;
  bool uv_active;
};

#define MAX_STEPS 10
ExecutionStep steps[MAX_STEPS];
int totalSteps = 0;
int currentStepIndex = 0;
unsigned long stepStartTime = 0;

float currentTemp = 25.0;
int currentRpm = 0;
int heaterDuty = 0;

// Read temperature from analog thermocouple amplifier
float readTemperatureC() {
  int raw = analogRead(PIN_THERMOCOUPLE);
  // Calibration: 0 - 1023 maps to 0 - 1000 °C for high-temp probe
  return (raw / 1023.0) * 1000.0;
}

// Compute discrete PID duty cycle
int computeHeaterPid(float setpoint, float current) {
  float error = setpoint - current;
  if (error <= 0) return 0;
  // Proportional gain Kp = 15.0
  int duty = (int)(error * 15.0);
  return constrain(duty, 0, 255);
}

void setRgb(bool r, bool g, bool b) {
  digitalWrite(PIN_LED_RED, r ? HIGH : LOW);
  digitalWrite(PIN_LED_GREEN, g ? HIGH : LOW);
  digitalWrite(PIN_LED_BLUE, b ? HIGH : LOW);
}

// Handle Protocol Webhook POST
void handleDeployProtocol() {
  if (server.method() != HTTP_POST) {
    server.send(405, "application/json", "{\"error\":\"Method Not Allowed\"}");
    return;
  }

  String body = server.arg("plain");
  StaticJsonDocument<2048> doc;
  DeserializationError err = deserializeJson(doc, body);

  if (err) {
    server.send(400, "application/json", "{\"status\":\"ERROR\",\"message\":\"Malformed JSON payload\"}");
    return;
  }

  const char* material = doc["material_target"];
  JsonArray instructions = doc["instructions"];
  totalSteps = instructions.size();

  if (totalSteps > MAX_STEPS) {
    server.send(400, "application/json", "{\"status\":\"ERROR\",\"message\":\"Step count exceeds maximum limit\"}");
    return;
  }

  for (int i = 0; i < totalSteps; i++) {
    steps[i].seq = instructions[i]["seq"];
    strlcpy(steps[i].op, instructions[i]["op"] | "STIR", sizeof(steps[i].op));
    steps[i].target_temp_c = instructions[i]["target_temp_c"] | 25.0;
    steps[i].ramp_c_min = instructions[i]["ramp_c_min"] | 0.0;
    steps[i].dwell_sec = instructions[i]["dwell_sec"] | 60;
    steps[i].target_rpm = instructions[i]["rpm"] | 0;
    steps[i].uv_active = instructions[i]["uv_active"] | false;
  }

  currentStepIndex = 0;
  stepStartTime = millis();
  currentState = STATE_EXECUTING_STAGE;

  Serial.println(F("========================================"));
  Serial.print(F("[ESP8266:WEBHOOK] New Protocol Deployed: "));
  Serial.println(material);
  Serial.print(F("[ESP8266:STAGES] Total Stages Ingested: "));
  Serial.println(totalSteps);
  Serial.println(F("========================================"));

  server.send(200, "application/json", "{\"status\":\"ACK_RECEIVED\",\"state\":\"ARMED_EXECUTING\"}");
}

// Telemetry Status endpoint
void handleStatus() {
  StaticJsonDocument<512> doc;
  doc["state"] = (int)currentState;
  doc["current_temp_c"] = currentTemp;
  doc["current_rpm"] = currentRpm;
  doc["heater_duty_pwm"] = heaterDuty;
  doc["current_step"] = currentStepIndex + 1;
  doc["total_steps"] = totalSteps;

  String output;
  serializeJson(doc, output);
  server.send(200, "application/json", output);
}

void setup() {
  Serial.begin(115200);
  delay(500);

  pinMode(PIN_HEATER_PWM, OUTPUT);
  pinMode(PIN_STIRRER_PWM, OUTPUT);
  pinMode(PIN_LED_RED, OUTPUT);
  pinMode(PIN_LED_GREEN, OUTPUT);
  pinMode(PIN_LED_BLUE, OUTPUT);

  analogWrite(PIN_HEATER_PWM, 0);
  analogWrite(PIN_STIRRER_PWM, 0);
  setRgb(false, false, true); // Standby Blue

  Serial.println(F("\n[ESP8266:INIT] AutoLab OS Microcontroller Booting..."));

  // Connect to WiFi
  WiFi.begin(ssid, password);
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(250);
    Serial.print(F("."));
    attempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.print(F("\n[ESP8266:NET] Connected! IP Address: "));
    Serial.println(WiFi.localIP());
  } else {
    // Fallback to AP Mode for direct local tethering
    WiFi.softAP("AutoLab-Node-AP", "autolab2026");
    Serial.print(F("\n[ESP8266:AP] Direct Access Point active. IP: "));
    Serial.println(WiFi.softAPIP());
  }

  // Register Webhook Routes
  server.on("/api/protocol", HTTP_POST, handleDeployProtocol);
  server.on("/api/status", HTTP_GET, handleStatus);
  server.begin();
  Serial.println(F("[ESP8266:HTTP] REST Webhook Server Listening on port 80"));
}

void loop() {
  server.handleClient();

  static unsigned long lastLoop = 0;
  if (millis() - lastLoop >= 500) {
    lastLoop = millis();

    // Read Sensors
    currentTemp = readTemperatureC();

    if (currentState == STATE_EXECUTING_STAGE && currentStepIndex < totalSteps) {
      ExecutionStep& step = steps[currentStepIndex];
      setRgb(step.target_temp_c > 35, true, false);

      // Actuate Heating
      heaterDuty = computeHeaterPid(step.target_temp_c, currentTemp);
      analogWrite(PIN_HEATER_PWM, heaterDuty);

      // Actuate Stirrer Motor PWM (0-255 proportional to 0-1200 RPM)
      int stirrerPwm = map(step.target_rpm, 0, 1200, 0, 255);
      analogWrite(PIN_STIRRER_PWM, constrain(stirrerPwm, 0, 255));
      currentRpm = step.target_rpm;

      // Broadcast Serial Telemetry
      Serial.print(F("[STAGE:"));
      Serial.print(currentStepIndex + 1);
      Serial.print(F("] Temp: "));
      Serial.print(currentTemp, 1);
      Serial.print(F("°C (Target: "));
      Serial.print(step.target_temp_c, 1);
      Serial.print(F("°C) | RPM: "));
      Serial.print(currentRpm);
      Serial.print(F(" | PWM: "));
      Serial.print(heaterDuty);
      Serial.println(F("/255"));

      // Check Dwell Completion
      if (millis() - stepStartTime >= (step.dwell_sec * 1000)) {
        currentStepIndex++;
        stepStartTime = millis();
        if (currentStepIndex >= totalSteps) {
          currentState = STATE_COMPLETED;
          analogWrite(PIN_HEATER_PWM, 0);
          analogWrite(PIN_STIRRER_PWM, 0);
          setRgb(false, true, true);
          Serial.println(F("[ESP8266:DONE] Protocol synthesis completed successfully. Standby."));
        } else {
          Serial.print(F("[ESP8266:TRANSITION] Advancing to Stage "));
          Serial.println(currentStepIndex + 1);
        }
      }
    }
  }
}
