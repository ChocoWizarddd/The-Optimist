"""Local USB serial bridge for OPTIMIST OS; reads telemetry only."""
from __future__ import annotations

import json
import math
import os
import threading
import time
from collections import defaultdict, deque
from datetime import datetime, timezone
from typing import Any

import serial
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from serial.tools import list_ports


def cors_origins() -> list[str]:
    defaults = ["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:4173", "https://theoptimist-delta.vercel.app"]
    extras = [value.strip() for value in os.getenv("OPTIMIST_CORS_ORIGINS", "").split(",") if value.strip()]
    return list(dict.fromkeys([*defaults, *extras]))


app = FastAPI(title="OPTIMIST OS USB Telemetry Bridge", version="1.0.0")
app.add_middleware(CORSMiddleware, allow_origins=cors_origins(), allow_methods=["GET", "POST", "OPTIONS"], allow_headers=["Content-Type"])
lock = threading.RLock()
serial_connection: serial.Serial | None = None
reader_thread: threading.Thread | None = None
stop_reader = threading.Event()
active_port: str | None = None
active_baud_rate: int | None = None
latest: dict[str, dict[str, Any]] = {}
history: dict[str, deque[dict[str, Any]]] = defaultdict(lambda: deque(maxlen=20_000))
last_serial_error: str | None = None


class ConnectRequest(BaseModel):
    port: str = Field(min_length=1, max_length=80)
    baud_rate: int = Field(ge=1200, le=2_000_000)


def normalize(payload: Any) -> dict[str, Any]:
    if not isinstance(payload, dict):
        raise ValueError("Each serial line must be a JSON object.")
    required = ("device_id", "temperature", "humidity", "battery_voltage", "compressor_running")
    missing = [key for key in required if key not in payload]
    if missing:
        raise ValueError(f"Missing required field(s): {', '.join(missing)}")

    def number(key: str) -> float:
        value = payload[key]
        if isinstance(value, bool):
            raise ValueError(f"{key} must be numeric.")
        result = float(value)
        if not math.isfinite(result):
            raise ValueError(f"{key} must be a finite number.")
        return result

    device_id = str(payload["device_id"]).strip()
    if not device_id or len(device_id) > 64:
        raise ValueError("device_id must be a non-empty string.")
    compressor = payload["compressor_running"]
    if not isinstance(compressor, bool):
        raise ValueError("compressor_running must be JSON true or false.")
    result: dict[str, Any] = {
        "device_id": device_id,
        "temperature": number("temperature"),
        "humidity": number("humidity"),
        "battery_voltage": number("battery_voltage"),
        "compressor_running": compressor,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "source": "LIVE",
    }
    if "uptime_seconds" in payload:
        result["uptime_seconds"] = max(0, int(payload["uptime_seconds"]))
    if isinstance(payload.get("sensor_health"), dict):
        if any(not isinstance(value, bool) for value in payload["sensor_health"].values()):
            raise ValueError("sensor_health values must be JSON true or false.")
        result["sensor_health"] = {str(key): bool(value) for key, value in payload["sensor_health"].items()}
    return result


def read_serial(connection: serial.Serial) -> None:
    global last_serial_error
    while not stop_reader.is_set():
        try:
            raw = connection.readline(4096)
            if not raw:
                continue
            reading = normalize(json.loads(raw.decode("utf-8-sig").strip()))
            with lock:
                latest[reading["device_id"]] = reading
                history[reading["device_id"]].append(reading)
                last_serial_error = None
        except (UnicodeDecodeError, json.JSONDecodeError, ValueError) as exc:
            with lock:
                last_serial_error = f"Ignored invalid serial line: {exc}"
        except (serial.SerialException, OSError) as exc:
            if not stop_reader.is_set():
                with lock:
                    last_serial_error = f"USB serial connection lost: {exc}"
            break


@app.get("/api/health")
def health() -> dict[str, Any]:
    with lock:
        connected = bool(serial_connection and serial_connection.is_open and reader_thread and reader_thread.is_alive())
        newest = max((item["timestamp"] for item in latest.values()), default=None)
        return {"status": "ok", "serial_connected": connected, "port": active_port, "baud_rate": active_baud_rate, "last_data_at": newest, "last_serial_error": last_serial_error}


@app.get("/api/ports")
def ports() -> dict[str, list[dict[str, str | None]]]:
    return {"ports": [{"device": item.device, "description": item.description, "hwid": item.hwid} for item in list_ports.comports()]}


@app.post("/api/serial/connect")
def connect(request: ConnectRequest) -> dict[str, Any]:
    global serial_connection, reader_thread, active_port, active_baud_rate, last_serial_error
    stop_reader.set()
    previous = serial_connection
    if previous and previous.is_open:
        previous.close()
    try:
        connection = serial.Serial(request.port, request.baud_rate, timeout=1, write_timeout=1)
    except (serial.SerialException, OSError, ValueError) as exc:
        with lock:
            serial_connection = None
            reader_thread = None
            active_port = active_baud_rate = None
            last_serial_error = str(exc)
        raise HTTPException(status_code=400, detail=f"Could not open {request.port}: {exc}") from exc
    stop_reader.clear()
    with lock:
        serial_connection = connection
        active_port = request.port
        active_baud_rate = request.baud_rate
        last_serial_error = None
    reader_thread = threading.Thread(target=read_serial, args=(connection,), name="optimist-serial-reader", daemon=True)
    reader_thread.start()
    return {"connected": True, "port": active_port, "baud_rate": active_baud_rate}


@app.post("/api/serial/disconnect")
def disconnect() -> dict[str, bool]:
    global serial_connection, reader_thread, active_port, active_baud_rate
    stop_reader.set()
    with lock:
        connection = serial_connection
        serial_connection = None
        reader_thread = None
        active_port = active_baud_rate = None
    if connection and connection.is_open:
        connection.close()
    return {"connected": False}


@app.get("/api/status")
def status(device_id: str = Query("OPT-001", min_length=1, max_length=64)) -> dict[str, Any]:
    with lock:
        reading = latest.get(device_id)
        if reading is None:
            raise HTTPException(status_code=503, detail=f"No real serial reading received for {device_id} yet.")
        age = (datetime.now(timezone.utc) - datetime.fromisoformat(reading["timestamp"])).total_seconds()
        if age > 10:
            raise HTTPException(status_code=503, detail=f"Last reading for {device_id} is stale ({int(age)} seconds old).")
        return dict(reading)


@app.get("/api/history")
def get_history(
    range: str = Query("6h", pattern="^(1h|6h|24h|7d)$"),
    device_id: str = Query("OPT-001", min_length=1, max_length=64),
) -> dict[str, list[dict[str, Any]]]:
    durations = {"1h": 3600, "6h": 6 * 3600, "24h": 24 * 3600, "7d": 7 * 24 * 3600}
    cutoff = time.time() - durations[range]
    with lock:
        points = [dict(point) for point in history.get(device_id, ()) if datetime.fromisoformat(point["timestamp"]).timestamp() >= cutoff]
    return {"history": points}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000, reload=False)
