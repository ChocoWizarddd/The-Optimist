# OPTAL OS

Industrial-style dashboard for a decentralized solar cold-storage prototype. This first phase runs fully in a browser with a local simulated provider. Simulated values are labeled SIMULATED DATA; Live mode makes backend requests and never substitutes generated values.

## Technology

React, Vite, JavaScript, Recharts, Lucide React and modular CSS. The provider boundary is in `src/services/dataProviders/`. Crop reference defaults are isolated in `src/data/cropProfiles.js`. User-configurable thresholds persist in browser localStorage.

## Structure

- `src/components/` reusable UI components (reserved for extracted components)
- `src/pages/` page implementations (currently composed in `App.jsx`)
- `src/hooks/useTelemetry.js` provider polling and stale/error state
- `src/services/dataProviders/demoProvider.js` deterministic-range sensor simulator
- `src/services/dataProviders/hardwareProvider.js` future FastAPI provider
- `src/services/api.js` future history, alert, health and ports API wrappers
- `src/intelligence/scoring.js` explainable local score and backup-estimate readiness
- `src/data/cropProfiles.js` editable local crop profile defaults

## Install and run

```bash
npm install
npm run dev
```

Open the local URL printed by Vite. `npm run build` creates the production bundle.

## Simulated mode

Simulation mode is selected initially. It updates readings for OPT-001 and five simulated fleet units every three seconds, including compressor state. Use the device selector in the top bar to switch the selected unit; its gauges, charts, crop readings, alerts and reports follow that unit. Each simulated unit has its own changing readings and history. Threshold alerts are generated from the active unit. CSV export downloads current-session telemetry. Settings are local to the browser. All generated readings are labeled as simulated and are never presented as hardware data.

Crop profiles are illustrative defaults for software demonstration and must be verified for the target cultivar, maturity, packaging and storage duration by an agricultural specialist.

## Live hardware mode / future USB integration

Live mode polls `GET /api/status?device_id=OPT-001` for the selected device at `http://127.0.0.1:8000` by default (override with `VITE_API_BASE_URL`). The local FastAPI/PySerial bridge lives in `backend/main.py`. In Live mode, the dashboard shows serial-port controls; choose the ESP32 COM port and the baud rate configured by its firmware, then connect. The bridge accepts newline-terminated JSON telemetry, validates actual sensor fields, and serves `/api/status`, `/api/history`, `/api/health`, and `/api/ports`. Live mode never runs the simulator.

### Install and run the USB bridge on Windows

1. Connect the ESP32 to this computer with a USB data cable. Close Arduino Serial Monitor or other programs that may have the COM port open.
2. From the project folder, create the Python environment and install the bridge packages:

   ```powershell
   powershell -ExecutionPolicy Bypass -File backend\setup.ps1
   ```

3. List the detected ports and start the bridge:

   ```powershell
   backend\.venv\Scripts\python.exe -m serial.tools.list_ports
   powershell -ExecutionPolicy Bypass -File backend\start.ps1
   ```

   Keep this terminal open. The bridge listens only on this computer at `127.0.0.1:8000`.
4. Start the React app with `npm run dev`, choose **Live**, then select the ESP32 COM port and matching baud rate in the **Connect ESP32** panel.
5. The ESP32 firmware must print one JSON object per line, ending in a newline. Required keys and types:

   ```json
   {"device_id":"OPT-001","temperature":8.2,"humidity":72,"battery_voltage":12.4,"compressor_running":true}
   ```

   This is a payload example only; it is not a claimed sensor reading. Send real measured values from the ESP32. `uptime_seconds` and a boolean `sensor_health` object are optional. Do not leave Arduino Serial Monitor open while the bridge owns the port.

The COM port list is discovered by PySerial. The UI reports disconnected until the bridge has received valid, fresh serial data for the selected device. If your firmware currently emits CSV or text rather than JSON lines, update its output format (or adapt `normalize()` in `backend/main.py`) before connecting. The bridge is read-only and does not issue compressor commands.

The Vercel-hosted UI can only see a bridge running on the same computer as the browser, and browser security/CORS settings can affect that setup. For initial hardware bring-up, use the local Vite dashboard and local bridge on the same laptop.

Target data path:

```
ESP32 USB Serial → Python PySerial bridge → FastAPI → React provider
```

Implement FastAPI endpoints `GET /api/status`, `/api/history`, `/api/alerts`, `/api/health` and `/api/ports`. Status JSON should include device ID, temperature, humidity, battery voltage, compressor state and a timestamp. The frontend expects matching field names (`device_id`, `temperature`, `humidity`, `battery_voltage`, `compressor_running`). Add backend validation, timestamps and CORS for the Vite origin before connecting hardware. The COM selector is a prepared interface and does not claim to enumerate ports yet; the settings screen explains that firmware and bridge configuration are required.

Battery runtime and energy consumption are not invented: reliable runtime requires battery capacity, load current and a calibrated discharge curve; energy reporting requires current/power measurements. Temperature and humidity alone do not determine food spoilage. AI recommendations do not control the compressor.

## 3D prototype viewer

The dashboard background uses the React Bits Grainient WebGL component, with the supplied dark-to-orange palette in Black mode and the component's adapted light palette in Light mode. It is bundled locally and renders behind the interface without an external image or service.

The Overview now displays the supplied `public/models/cooler3Dmodel1.glb` above the three compact telemetry gauges. The viewer uses Three.js with local GLB loading and interactive orbit controls: drag to rotate and scroll to zoom. The model asset is served by Vite from the app itself; no external model host is required. If WebGL is unavailable or the asset fails to load, the viewer displays an inline status message.


The 3D viewer places the cooler in a locally rendered farm scene with open sky and clouds, crop rows, trees, a red barn and a produce warehouse. A concrete service pad keeps the prototype grounded in the farm environment. The scene is generated in Three.js and requires no remote background image.

The Black/Light theme switch uses the supplied Skiper-style rectangle reveal from the bottom edge, with a rotating sun/moon control. It uses the native View Transitions API where available and respects reduced-motion preferences.
