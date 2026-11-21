import { useCallback, useEffect, useRef, useState } from 'react';
import { Cable, CircleCheck, PlugZap, RefreshCw, WifiOff } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

const isUsbPort = (item) => /usb|serial|uart|ch340|ch910|cp210|ftdi/i.test(`${item?.description || ''} ${item?.hwid || ''}`);

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
  const autoConnectAttempted = useRef('');

  const refresh = useCallback(async () => {
    try {
      const [portResult, healthResult] = await Promise.all([
        apiRequest('/api/ports'),
        apiRequest('/api/health'),
      ]);
      const nextPorts = Array.isArray(portResult.ports) ? portResult.ports : [];
      const usbPorts = nextPorts.filter(isUsbPort);
      setPorts(usbPorts);
      setHealth(healthResult);
      const activePort = nextPorts.find((item) => item.device === healthResult.port);
      const activeUsbPort = activePort && isUsbPort(activePort) ? activePort.device : '';
      setPort((selected) => activeUsbPort || (usbPorts.some((item) => item.device === selected) ? selected : usbPorts[0]?.device || ''));
      setError('');

      // If the only USB serial device is selected but a silent Bluetooth port is
      // active, move to the USB device automatically so readings arrive from ESP32.
      const wrongSilentPort = healthResult.serial_connected && !healthResult.last_data_at && (!activePort || !isUsbPort(activePort));
      const shouldConnect = usbPorts.length === 1 && (!healthResult.serial_connected || wrongSilentPort);
      const target = usbPorts[0];
      if (shouldConnect && target && autoConnectAttempted.current !== target.device) {
        autoConnectAttempted.current = target.device;
        setBusy(true);
        try {
          if (healthResult.serial_connected) await apiRequest('/api/serial/disconnect', { method: 'POST' });
          await apiRequest('/api/serial/connect', {
            method: 'POST',
            body: JSON.stringify({ port: target.device, baud_rate: 115200 }),
          });
          const connectedHealth = await apiRequest('/api/health');
          setHealth(connectedHealth);
          setPort(target.device);
        } catch (requestError) {
          setError(requestError.message);
        } finally {
          setBusy(false);
        }
      }
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
    <section className={`serial-bridge panel${connected ? ' serial-bridge--connected' : ''}`} aria-labelledby="serial-bridge-title">
      <div className="serial-bridge__header">
        <div className="serial-bridge__title">
          <span className="serial-bridge__icon"><Cable size={17} /></span>
          <div>
            <small>ESP32 USB</small>
            <h3 id="serial-bridge-title">Sensor readings</h3>
          </div>
        </div>
        <div className={`serial-bridge__status ${connected ? 'is-connected' : ''}`}>
          {connected ? <CircleCheck size={14} /> : <WifiOff size={14} />}
          <span>{connected ? `CONNECTED · ${health.port}` : 'NOT CONNECTED'}</span>
        </div>
      </div>
      {connected ? (
        <div className="serial-bridge__connected-row">
          <span><PlugZap size={14} /> USB · {health.port}</span>
          <button type="button" className="serial-bridge__disconnect" onClick={disconnect} disabled={busy}>
            {busy ? 'PLEASE WAIT' : 'DISCONNECT'}
          </button>
        </div>
      ) : (
        <>
          <div className="serial-bridge__controls">
            <label>
              <span>USB PORT</span>
              <select value={port} onChange={(event) => setPort(event.target.value)} disabled={busy}>
                {!ports.length && <option value="">No USB device found</option>}
                {ports.map((item) => <option key={item.device} value={item.device}>{item.device}{item.description ? ` · ${item.description}` : ''}</option>)}
              </select>
            </label>
            <label className="serial-bridge__baud">
              <span>BAUD RATE</span>
              <select value={baudRate} onChange={(event) => setBaudRate(event.target.value)} disabled={busy}>
                {[9600, 19200, 38400, 57600, 115200, 230400].map((rate) => <option key={rate} value={rate}>{rate.toLocaleString()}</option>)}
              </select>
            </label>
            <button type="button" className="btn btn--primary serial-bridge__action" onClick={connect} disabled={busy || !port}>
              <PlugZap size={15} /> {busy ? 'PLEASE WAIT' : 'CONNECT USB'}
            </button>
            <button type="button" className="serial-bridge__refresh" onClick={() => { autoConnectAttempted.current = ''; refresh(); }} disabled={busy} aria-label="Refresh serial ports" title="Refresh serial ports">
              <RefreshCw size={15} />
            </button>
          </div>
          {error && <p className="serial-bridge__message is-error" role="status">{error}</p>}
        </>
      )}
    </section>
  );
}
