import { useCallback, useEffect, useState } from 'react';
import { Cable, CircleCheck, PlugZap, RefreshCw, WifiOff } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

async function apiRequest(path, options) {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(options?.headers || {}) },
    signal: AbortSignal.timeout(4000),
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.detail || `Bridge request failed (${response.status})`);
  return body;
}

export default function SerialBridgePanel() {
  const [ports, setPorts] = useState([]);
  const [port, setPort] = useState('');
  const [baudRate, setBaudRate] = useState('115200');
  const [health, setHealth] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const refresh = useCallback(async () => {
    try {
      const [portResult, healthResult] = await Promise.all([
        apiRequest('/api/ports'),
        apiRequest('/api/health'),
      ]);
      const nextPorts = Array.isArray(portResult.ports) ? portResult.ports : [];
      setPorts(nextPorts);
      setHealth(healthResult);
      setPort((selected) => healthResult.port || (nextPorts.some((item) => item.device === selected) ? selected : nextPorts[0]?.device || ''));
      setError('');
    } catch (requestError) {
      setHealth(null);
      setError(`${requestError.message}. Start the local FastAPI bridge to connect USB hardware.`);
    }
  }, []);

  useEffect(() => {
    refresh();
    const timer = window.setInterval(refresh, 3000);
    return () => window.clearInterval(timer);
  }, [refresh]);

  const connect = async () => {
    if (!port) {
      setError('No serial port is available. Connect the ESP32 by USB, then refresh ports.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      await apiRequest('/api/serial/connect', {
        method: 'POST',
        body: JSON.stringify({ port, baud_rate: Number(baudRate) }),
      });
      await refresh();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  };

  const disconnect = async () => {
    setBusy(true);
    try {
      await apiRequest('/api/serial/disconnect', { method: 'POST' });
      await refresh();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  };

  const connected = Boolean(health?.serial_connected);

  return (
    <section className="serial-bridge panel" aria-labelledby="serial-bridge-title">
      <div className="serial-bridge__header">
        <div className="serial-bridge__title">
          <span className="serial-bridge__icon"><Cable size={17} /></span>
          <div>
            <small>USB SERIAL BRIDGE</small>
            <h3 id="serial-bridge-title">Connect ESP32</h3>
          </div>
        </div>
        <div className={`serial-bridge__status ${connected ? 'is-connected' : ''}`}>
          {connected ? <CircleCheck size={14} /> : <WifiOff size={14} />}
          <span>{connected ? `CONNECTED · ${health.port}` : 'NOT CONNECTED'}</span>
        </div>
      </div>
      <p className="serial-bridge__help">Choose the COM port and baud rate used by your ESP32 firmware. Live mode displays only serial readings received from the device.</p>
      <div className="serial-bridge__controls">
        <label>
          <span>COM PORT</span>
          <select value={port} onChange={(event) => setPort(event.target.value)} disabled={connected || busy}>
            {!ports.length && <option value="">No ports found</option>}
            {ports.map((item) => <option key={item.device} value={item.device}>{item.device}{item.description ? ` · ${item.description}` : ''}</option>)}
          </select>
        </label>
        <label className="serial-bridge__baud">
          <span>BAUD RATE</span>
          <select value={baudRate} onChange={(event) => setBaudRate(event.target.value)} disabled={connected || busy}>
            {[9600, 19200, 38400, 57600, 115200, 230400].map((rate) => <option key={rate} value={rate}>{rate.toLocaleString()}</option>)}
          </select>
        </label>
        <button type="button" className="btn btn--primary serial-bridge__action" onClick={connected ? disconnect : connect} disabled={busy || (!connected && !port)}>
          <PlugZap size={15} /> {busy ? 'PLEASE WAIT' : connected ? 'DISCONNECT' : 'CONNECT USB'}
        </button>
        <button type="button" className="serial-bridge__refresh" onClick={refresh} disabled={busy} aria-label="Refresh serial ports" title="Refresh serial ports">
          <RefreshCw size={15} />
        </button>
      </div>
      {error && <p className="serial-bridge__message is-error" role="status">{error}</p>}
      {!error && connected && !health.last_data_at && <p className="serial-bridge__message" role="status">Port open. Waiting for the ESP32 to send a valid JSON telemetry line.</p>}
      {!error && health?.last_serial_error && <p className="serial-bridge__message is-error" role="status">{health.last_serial_error}</p>}
      <p className="serial-bridge__format">Expected: <code>device_id, temperature, humidity, battery_voltage, compressor_running</code> as newline-delimited JSON.</p>
    </section>
  );
}
