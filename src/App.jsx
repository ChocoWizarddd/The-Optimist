import React, { lazy, memo, Suspense, useEffect, useMemo, useState } from 'react';
import FlipText from './components/FlipText';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  Box,
  ChevronDown,
  Clock,
  CloudSun,
  Download,
  Factory,
  Languages,
  Menu,
  Power,
  Wifi,
  WifiOff,
  Wrench,
  X,
} from 'lucide-react';
import { useTelemetry } from './hooks/useTelemetry';
import SerialBridgePanel from './components/SerialBridgePanel';
import Antigravity from './components/Antigravity';
import InterfaceFX, { Magnetic, Tilt, useReveal } from './components/InterfaceFX';
import { LANGUAGES, getLocale, languageLabel, translateNav, translateText as tx } from './utils/i18n';

const CoolerModel = lazy(() => import('./components/CoolerModel'));
const UnitMonitoringDashboard = lazy(() => import('./components/UnitMonitoringDashboard'));
const WeatherPage = lazy(() => import('./components/WeatherPage'));
const DarkVeil = lazy(() => import('./components/DarkVeil'));
const CurvedLoop = lazy(() => import('./components/CurvedLoop'));
const FallingText = lazy(() => import('./components/FallingText'));

const nav = [
  { label: 'Overview', icon: Activity, code: '01' },
  { label: 'Live Monitoring', icon: Activity, code: '02' },
  { label: 'Storage Units', icon: Box, code: '03' },
  { label: 'Weather', icon: CloudSun, code: '04' },
  { label: 'Alerts & Events', icon: AlertTriangle, code: '05' },
  { label: 'Maintenance', icon: Wrench, code: '06' },
  { label: 'Reports', icon: BarChart3, code: '07' },
];

const DEVICES = Array.from({ length: 6 }, (_, i) => `OPT-00${i + 1}`);
const ANTIGRAVITY_COLORS = ['#4e9bbf', '#84c4e0', '#d2efff'];
const RANGES = [
  ['6h', '6 hours'],
  ['7d', '7 days'],
];
const initSettings = {
  temperatureMin: 2,
  temperatureMax: 8,
  humidityMin: 65,
  humidityMax: 85,
  batteryWarning: 11.9,
  crop: 'Tomato',
};

const nfmt = (n, d = 1) => (Number.isFinite(+n) ? (+n).toFixed(d) : '—');

function Eyebrow({ children, index, language = 'en' }) {
  return (
    <div className="eyebrow">
      <span>{tx(children, language)}</span>
      {index && <em>{index}</em>}
    </div>
  );
}

function SectionHead({ eyebrow, title, count, action, language = 'en' }) {
  return (
    <div className="section-head" data-reveal="up">
      <div>
        <Eyebrow language={language}>{eyebrow}</Eyebrow>
        <h2 className="section-head__title">
          {(translateNav(title, language) !== title ? translateNav(title, language) : tx(title, language))} {count && <span>{count}</span>}
        </h2>
      </div>
      {action}
    </div>
  );
}

function PageIntro({ eyebrow, title, copy, children, language }) {
  return (
    <div className="page-intro" data-reveal="up">
      <div>
        <Eyebrow language={language}>{eyebrow}</Eyebrow>
        <h2>{translateNav(title, language) !== title ? translateNav(title, language) : tx(title, language)}</h2>
        <p>{tx(copy, language)}</p>
      </div>
      {children}
    </div>
  );
}

function Gauge({ title, value, unit, min, max, low, high, color, caption, language = 'en' }) {
  const pct = Math.max(0, Math.min(1, (value - min) / (max - min)));
  const circ = 2 * Math.PI * 46;
  return (
    <div className="gauge-card">
      <div className="gauge-top">
        <span className="gauge-title">{tx(title, language)}</span>
        <span className="live-dot" />
      </div>
      <div className="gauge-wrap">
        <svg viewBox="0 0 112 112" aria-hidden="true">
          <circle cx="56" cy="56" r="46" className="gauge-track" stroke="#1a1d1f" strokeWidth="14" />
          <circle
            cx="56"
            cy="56"
            r="46"
            className="gauge-value"
            stroke={color}
            strokeWidth="14"
            strokeLinecap="round"
            strokeDasharray={`${circ * pct} ${circ}`}
            transform="rotate(-90 56 56)"
          />
        </svg>
        <div className="gauge-reading">
          <strong>{value}</strong>
          <span className="gauge-unit">{unit}</span>
        </div>
      </div>
      <div className="gauge-meta">
          <span>{tx('Min', language).toUpperCase()} <b>{low}</b></span>
        <span>{tx('Max', language).toUpperCase()} <b>{high}</b></span>
      </div>
      <div className="gauge-range">{tx('Scale', language)} {min}–{max} {unit}</div>
      <div className="zone">
        <i /><span>{tx('Normal', language)}</span>
        <i className="yellow" /><span>{tx('Warning', language)}</span>
        <i className="red" /><span>{tx('Critical', language)}</span>
      </div>
        <div className="gauge-caption">{tx(caption, language)}</div>
    </div>
  );
}

function UnitCard({ index, reading, language = 'en' }) {
  const id = `OPT-00${index + 1}`;
  const hasReading = Boolean(reading);

  return (
    <Tilt className="unit-card-wrap" amount={4}>
      <article className={`unit-card ${hasReading ? 'healthy' : 'inactive'}`}>
        <div className="unit-head">
          <div className="unit-head__id">
            <b>{id}</b>
          </div>
        </div>
        <div className="unit-values">
          <div><small>{tx('Temperature', language)}</small><b>{hasReading ? `${nfmt(reading.temperature)}°C` : '—'}</b></div>
          <div><small>{tx('Humidity', language)}</small><b>{hasReading ? `${nfmt(reading.humidity)}%` : '—'}</b></div>
          <div><small>{tx('Battery', language)}</small><b>{hasReading ? `${nfmt(reading.battery_voltage, 2)} V` : '—'}</b></div>
        </div>
        <div className="unit-foot">
          <span>
            <Power size={13} />
            {hasReading && typeof reading.compressor_running === 'boolean'
              ? `${tx('Compressor', language)} ${tx(reading.compressor_running ? 'On' : 'Off', language)}`
              : hasReading ? tx('Sensor readings', language) : tx('No telemetry', language)}
          </span>
        </div>
      </article>
    </Tilt>
  );
}

function Hero({ reading, onNavigate, language = 'en', lightweight = false }) {
  const stats = [
    ['Chamber temperature', reading ? `${nfmt(reading.temperature)}°C` : '—'],
    ['Relative humidity', reading ? `${nfmt(reading.humidity)}%` : '—'],
    ['Battery voltage', reading ? `${nfmt(reading.battery_voltage, 2)} V` : '—'],
    ['Compressor', typeof reading?.compressor_running === 'boolean' ? (reading.compressor_running ? tx('On', language).toUpperCase() : tx('Idle', language).toUpperCase()) : '—'],
  ];
  const summary = tx('A field-ready control system for solar cold storage. Monitor chamber conditions and unit health.', language);

  return (
    <section className="hero" data-reveal="up">
      <div className="hero__content">
        <Eyebrow language={language} index="001 / FIELD SYSTEM">DECENTRALIZED COLD STORAGE</Eyebrow>
        <h1 className="hero__title">
          <FlipText className="hero__flip-line">{tx('Cold chain,', language)}</FlipText><br />
          <FlipText className="hero__flip-line hero__flip-line--accent">{tx('without compromise.', language)}</FlipText>
        </h1>
        <div className="hero__copy">
          {lightweight ? (
            <p className="hero__copy-static">{summary}</p>
          ) : (
            <Suspense fallback={<p className="hero__copy-static">{summary}</p>}>
              <FallingText
                text={summary}
                split="words"
                trigger="auto"
                gravity={0.9}
                bounciness={0.12}
                scatter={0.12}
                stagger={0.035}
                order="center"
                draggable
                cursorPush={0.9}
                restoreDelay={0.8}
                fontSize="1rem"
                className="hero__copy-falling"
              />
            </Suspense>
          )}
        </div>
        <div className="hero__actions">
          <Magnetic>
            <button className="btn btn--primary" onClick={() => onNavigate('Live Monitoring')}>
              {tx('Open live telemetry', language)} <ArrowUpRight size={16} />
            </button>
          </Magnetic>
          <Magnetic>
            <button className="btn btn--ghost" onClick={() => onNavigate('Storage Units')}>
              {tx('Explore the fleet', language)} <ArrowRight size={16} />
            </button>
          </Magnetic>
        </div>
        <div className="hero__stats">
          {stats.map(([label, value]) => (
            <div className="hero__stat" key={label}>
              <small>{tx(label, language)}</small>
              <b>{value}</b>
            </div>
          ))}
        </div>
      </div>
      <div className="hero__visual" aria-hidden="true">
        <div className="hero-orbit hero-orbit--outer" />
        <div className="hero-orbit hero-orbit--middle" />
        <div className="hero-orbit hero-orbit--inner" />
      </div>
    </section>
  );
}

function Ticker({ reading, fleet, mode, language = 'en', lightweight = false }) {
  const items = [
    `${tx('Chamber temperature', language).toUpperCase()} · ${reading ? `${nfmt(reading.temperature)} °C` : '—'}`,
    `${tx('Humidity', language).toUpperCase()} · ${reading ? `${nfmt(reading.humidity)} %` : '—'}`,
    `${tx('Battery voltage', language).toUpperCase()} · ${reading ? `${nfmt(reading.battery_voltage, 2)} V` : '—'}`,
    `${tx('Storage Units', language).toUpperCase()} ${tx('Online', language).toUpperCase()} · ${fleet.filter((u) => u).length.toString().padStart(2, '0')} / 06`,
    `PROTOCOL · OPT/TELEMETRY-1.0`,
  ];
  const marqueeText = items.join('     •     ');
  if (lightweight) {
    return <div className="ticker ticker--static" aria-label={marqueeText}>{marqueeText}</div>;
  }
  return (
    <div className="ticker" aria-label={marqueeText}>
      <Suspense fallback={<span className="ticker__fallback" aria-label={marqueeText}>{marqueeText}</span>}>
        <CurvedLoop
          marqueeText={marqueeText}
          speed={1.2}
          curveAmount={24}
          direction="left"
          interactive
          pauseOnHover={false}
          className="ticker__text"
          fontSize={26}
          fontWeight={700}
          letterSpacing={1.1}
          edgeFade={0.08}
        />
      </Suspense>
    </div>
  );
}

const LocalClock = memo(function LocalClock({ language }) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <div className="topbar-clock" aria-label={`${tx('local time', language)} ${now.toLocaleTimeString(getLocale(language))}`}>
      <Clock size={14} aria-hidden="true" />
      <time dateTime={now.toISOString()}>
        {now.toLocaleTimeString(getLocale(language), { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
      </time>
    </div>
  );
});

function prefersLightweightMode() {
  if (typeof window === 'undefined') return false;
  const compactViewport = window.matchMedia('(max-width: 860px)').matches;
  const lowMemory = Number(navigator.deviceMemory) > 0 && Number(navigator.deviceMemory) <= 4;
  const fewCores = Number(navigator.hardwareConcurrency) > 0 && Number(navigator.hardwareConcurrency) <= 4;
  return compactViewport || lowMemory || fewCores;
}

export default function App() {
  const [page, setPage] = useState('Overview');
  const [mode, setMode] = useState(() => localStorage.getItem('optimist-mode') === 'live' ? 'live' : 'demo');
  const [theme] = useState(() => localStorage.getItem('optimist-theme') || 'black');
  const [selectedDevice, setSelectedDevice] = useState('OPT-001');
  const [range, setRange] = useState('6h');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [settings, setSettings] = useState(() => ({
    ...initSettings,
    ...JSON.parse(localStorage.getItem('optimist-settings') || '{}'),
  }));
  const [history, setHistory] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [language, setLanguage] = useState(() => localStorage.getItem('optimist-language') || 'en');
  const [lightweightMode, setLightweightMode] = useState(prefersLightweightMode);

  const { reading, fleet, samples, unitHistories, error, lastSuccess } = useTelemetry(
    mode, lightweightMode ? 5000 : 3000, range, selectedDevice,
  );
  useReveal(page);

  useEffect(() => {
    const viewport = window.matchMedia('(max-width: 860px)');
    const updateProfile = () => setLightweightMode(prefersLightweightMode());
    viewport.addEventListener?.('change', updateProfile);
    window.addEventListener('resize', updateProfile, { passive: true });
    return () => {
      viewport.removeEventListener?.('change', updateProfile);
      window.removeEventListener('resize', updateProfile);
    };
  }, []);

  useEffect(() => {
    localStorage.setItem('optimist-theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('optimist-language', language);
    document.documentElement.lang = language;
  }, [language]);

  useEffect(() => {
    localStorage.setItem('optimist-mode', mode);
  }, [mode]);

  useEffect(() => {
    if (!reading) return;
    setHistory((h) => [
      ...h.slice(-167),
      {
        ...reading,
        label: new Date(reading.timestamp).toLocaleTimeString([], {
          hour: '2-digit', minute: '2-digit', second: '2-digit',
        }),
      },
    ]);
  }, [reading, mode, selectedDevice]);

  useEffect(() => { setHistory([]); }, [mode, selectedDevice]);

  useEffect(() => {
    if (!reading) return;
    const checks = [
      { key: 'high-temp', active: reading.temperature > +settings.temperatureMax, severity: 'Warning', type: 'High temperature', description: 'Temperature is above configured upper threshold.' },
      { key: 'low-temp', active: reading.temperature < +settings.temperatureMin, severity: 'Warning', type: 'Low temperature', description: 'Temperature is below configured lower threshold.' },
      { key: 'high-humidity', active: reading.humidity > +settings.humidityMax, severity: 'Warning', type: 'High humidity', description: 'Humidity is above configured upper threshold.' },
      { key: 'low-humidity', active: reading.humidity < +settings.humidityMin, severity: 'Warning', type: 'Low humidity', description: 'Humidity is below configured lower threshold.' },
      { key: 'low-battery', active: reading.battery_voltage < +settings.batteryWarning, severity: 'Critical', type: 'Low battery voltage', description: 'Battery voltage is below configured warning threshold.' },
      { key: 'abnormal', active: !Number.isFinite(+reading.temperature) || !Number.isFinite(+reading.humidity) || !Number.isFinite(+reading.battery_voltage) || reading.temperature < -40 || reading.temperature > 85 || reading.humidity < 0 || reading.humidity > 100, severity: 'Critical', type: 'Abnormal sensor readings', description: 'One or more sensor values are missing or outside basic physical bounds.' },
      { key: 'sensor-disconnected', active: reading.sensor_health && Object.values(reading.sensor_health).some((x) => x === false), severity: 'Warning', type: 'Sensor disconnected', description: 'Backend reports one or more disconnected sensors.' },
    ];
    const active = checks.filter((x) => x.active);
    if (active.length) {
      setAlerts((a) => {
        const next = [...a];
        active.forEach((c) => {
          if (!next.some((x) => x.key === c.key && x.device === selectedDevice && !x.acknowledged)) {
            next.unshift({ ...c, device: selectedDevice, time: new Date().toISOString(), acknowledged: false });
          }
        });
        return next.slice(0, 40);
      });
    }
  }, [reading, settings, selectedDevice]);

  const data = samples.map((point) => ({
    ...point,
    label: new Date(point.timestamp).toLocaleString([], {
      ...(range === '7d' ? { month: 'numeric', day: 'numeric' } : {}),
      hour: '2-digit',
      minute: '2-digit',
    }),
  }));

  const exportCsv = () => {
    const rows = [
      ['timestamp', 'device_id', 'temperature_c', 'humidity_pct', 'battery_voltage_v', 'compressor_running', 'data_source'],
      ...history
        .filter((x) => x.source === (mode === 'demo' ? 'SIMULATED' : 'LIVE'))
        .map((x) => [x.timestamp, x.device_id, x.temperature, x.humidity, x.battery_voltage, x.compressor_running, x.source]),
    ];
    const blob = new Blob([rows.map((r) => r.join(',')).join('\n')], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `optimist-${mode}-report.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const unacknowledged = alerts.filter((a) => !a.acknowledged).length;

  const pageContent = () => {
    switch (page) {
      case 'Overview':
        return (
          <>
            <Hero reading={reading} onNavigate={setPage} language={language} lightweight={lightweightMode} />
            <Ticker reading={reading} fleet={fleet} mode={mode} language={language} lightweight={lightweightMode} />

            <SectionHead
              eyebrow="INSTRUMENT BAY"
              title="The unit, up close"
              language={language}
              action={<span className="section-head__note">DRAG TO ROTATE · SCROLL TO ZOOM</span>}
            />
            <div className="overview-top" data-reveal="up">
              <div className="instrument-column">
                <Tilt className="model-wrap" amount={2}>
                  <Suspense fallback={<div className="model-loading" aria-label="Loading 3D model" />}>
                    <CoolerModel lowPower={lightweightMode} />
                  </Suspense>
                </Tilt>
                <div className="gauges">
                  {[
                    {
                      title: 'BATTERY VOLTAGE',
                      value: nfmt(reading?.battery_voltage, 2),
                      unit: 'V', min: 10, max: 14, low: '11.9 V', high: '12.8 V',
                      color: '#8fcde8', caption: 'Battery monitor',
                    },
                    {
                      title: 'CHAMBER TEMPERATURE',
                      value: nfmt(reading?.temperature),
                      unit: '°C', min: -5, max: 20,
                      low: `${settings.temperatureMin}°`, high: `${settings.temperatureMax}°`,
                      color: reading?.temperature > settings.temperatureMax ? '#e2685a' : '#7fd1ae',
                      caption: 'Configured operating range',
                    },
                    {
                      title: 'RELATIVE HUMIDITY',
                      value: nfmt(reading?.humidity),
                      unit: '%', min: 0, max: 100,
                      low: `${settings.humidityMin}%`, high: `${settings.humidityMax}%`,
                      color: '#8fb8c9', caption: 'Relative humidity',
                    },
                  ].map((gauge) => (
                    <Tilt key={gauge.title} className="gauge-wrap-outer" amount={4}>
                      <Gauge {...gauge} language={language} />
                    </Tilt>
                  ))}
                </div>
              </div>
            </div>

            <SectionHead
              eyebrow="FLEET STATUS"
              title="Storage units"
              language={language}
              count="06"
              action={
                <Magnetic>
                  <button className="text-btn" onClick={() => setPage('Storage Units')}>
                    {tx('View all', language)} <ArrowUpRight size={15} />
                  </button>
                </Magnetic>
              }
            />
            <div className="unit-grid">
              {DEVICES.map((id, i) => (
                <div key={id} data-reveal="up">
                  <UnitCard
                    index={i}
                    reading={fleet.find((u) => u.device_id === id)}
                    language={language}
                  />
                </div>
              ))}
            </div>
          </>
        );

      case 'Live Monitoring':
        return (
          <>
            <PageIntro eyebrow="TELEMETRY" title="Live Monitoring" copy="Live readings and history for every storage unit." language={language} />
            <div className="metric-row metric-row--live">
              {[
                ['Temperature', reading ? `${nfmt(reading.temperature)} °C` : '—'],
                ['Humidity', reading ? `${nfmt(reading.humidity)} %` : '—'],
                ['Battery voltage', reading ? `${nfmt(reading.battery_voltage, 2)} V` : '—'],
                ['Compressor', typeof reading?.compressor_running === 'boolean' ? tx(reading.compressor_running ? 'On' : 'Off', language).toUpperCase() : '—'],
                ['Uptime', Number.isFinite(Number(reading?.uptime_seconds)) ? `${Math.floor(reading.uptime_seconds / 3600)} h` : '—'],
                [tx('Sensor health', language), reading?.sensor_health && Object.keys(reading.sensor_health).length
                  ? `${Object.values(reading.sensor_health).filter(Boolean).length} / ${Object.keys(reading.sensor_health).length} ${tx('OK', language)}`
                  : tx('Unknown', language)],
              ].map(([label, value]) => (
                <div className="metric panel" key={label} data-reveal="up">
                  <small>{tx(label, language)}</small>
                  <b>{value}</b>
                </div>
              ))}
            </div>
            <SectionHead
              eyebrow="UNIT HISTORY"
              title="Storage Units"
              language={language}
              count="06"
              action={null}
            />
            <Suspense fallback={<div className="panel page-loading">{tx('Loading', language)}…</div>}>
              <UnitMonitoringDashboard
                fleet={fleet}
                histories={unitHistories}
                mode={mode}
                settings={settings}
                range={range}
                setRange={setRange}
                language={language}
                lightweight={lightweightMode}
              />
            </Suspense>
          </>
        );

      case 'Storage Units':
        return (
          <>
            <PageIntro
              eyebrow="FLEET"
              title="Storage Units"
              copy="Unit readings and compressor status."
              language={language}
            />
            <div className="unit-grid unit-grid--large">
              {DEVICES.map((id, i) => (
                <div key={id} data-reveal="up">
                  <UnitCard
                    index={i}
                    reading={fleet.find((u) => u.device_id === id)}
                    language={language}
                  />
                </div>
              ))}
            </div>
          </>
        );

      case 'Weather':
        return (
          <>
            <PageIntro eyebrow="LOCAL CONDITIONS" title="Weather" copy="Current weather, seven-day outlook and hourly forecast." language={language} />
            <Suspense fallback={<div className="panel page-loading">{tx('Loading', language)}…</div>}>
              <WeatherPage language={language} />
            </Suspense>
          </>
        );

      case 'Alerts & Events':
        return (
          <>
            <PageIntro eyebrow="EVENT LOG" title="Alerts & Events" copy={`${unacknowledged} ${tx('active alerts', language)} · ${tx('Alert thresholds are stored locally.', language)}`} language={language} />
            <div className="panel table-wrap" data-reveal="up">
              <table>
                <thead>
                  <tr><th>{tx('Severity', language)}</th><th>{tx('Time', language)}</th><th>{tx('Device', language)}</th><th>{tx('Event', language)}</th><th>{tx('Description', language)}</th><th>{tx('Status', language)}</th><th /></tr>
                </thead>
                <tbody>
                  {alerts.length ? alerts.map((a, i) => (
                    <tr key={`${a.key}-${i}`}>
                      <td><span className={`severity ${a.severity.toLowerCase()}`}>{tx(a.severity, language)}</span></td>
                      <td>{new Date(a.time).toLocaleString(getLocale(language))}</td>
                      <td>{a.device}</td>
                      <td>{tx(a.type, language)}</td>
                      <td>{tx(a.description, language)}</td>
                      <td>{tx(a.acknowledged ? 'Acknowledged' : 'Active', language)}</td>
                      <td>
                        {!a.acknowledged && (
                          <button
                            className="small-btn"
                            onClick={() => setAlerts((xs) => xs.map((x, j) => (j === i ? { ...x, acknowledged: true } : x)))}
                          >
                            {tx('Acknowledge', language)}
                          </button>
                        )}
                      </td>
                    </tr>
                  )) : (
                    <tr><td colSpan="7" className="empty">{tx('No active alerts. Threshold-based events appear as readings cross configured limits.', language)}</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            <p className="muted-text">{tx('Alert history is held in this browser session. Live alert API integration is pending.', language)}</p>
          </>
        );

      case 'Maintenance':
        return (
          <>
            <PageIntro eyebrow="RELIABILITY" title="Maintenance" copy="Inspection planning and device health." language={language} />
            <div className="two-col maintenance-grid">
              <div className="panel" data-reveal="left">
                <Eyebrow language={language}>DEVICE HEALTH</Eyebrow>
                <h3>{selectedDevice}</h3>
                <div className="detail-row"><span>{tx('Temperature sensor', language)}</span><b>{tx(reading ? 'Connected' : 'Unknown', language)}</b></div>
                <div className="detail-row"><span>{tx('Humidity sensor', language)}</span><b>{tx(reading ? 'Connected' : 'Unknown', language)}</b></div>
                <div className="detail-row"><span>{tx('Battery monitor', language)}</span><b>{tx(reading ? 'Connected' : 'Unknown', language)}</b></div>
                <div className="detail-row"><span>{tx('Hardware backend', language)}</span><b>{tx(error ? 'Disconnected' : 'Connected', language)}</b></div>
              </div>
              <div className="panel" data-reveal="right">
                <Eyebrow language={language}>RECOMMENDED CHECKS</Eyebrow>
                <h3>{tx('Inspection schedule', language)}</h3>
                <ul className="recommendations">
                  <li>{tx('Check sensor readings', language)}</li>
                  <li>{tx('Inspect wiring and connections', language)}</li>
                  <li>{tx('Review cooling and compressor operation', language)}</li>
                  <li>{tx('Test battery capacity', language)}</li>
                </ul>
              </div>
              <div className="panel" data-reveal="up">
                <Eyebrow language={language}>MAINTENANCE RECORDS</Eyebrow>
                <h3>{tx('No service history', language)}</h3>
                <p>{tx('Records can be entered when maintenance workflows are connected.', language)}</p>
              </div>
            </div>
          </>
        );

      case 'Reports':
        return (
          <>
            <PageIntro eyebrow="DATA EXPORT" title="Reports" copy="Download session data as CSV." language={language}>
              <Magnetic>
                <button className="btn btn--primary" onClick={exportCsv}><Download size={15} /> Export CSV</button>
              </Magnetic>
            </PageIntro>
            <div className="metric-row metric-row--reports">
              {[
                ['Temperature report', 'temperature'],
                ['Humidity report', 'humidity'],
                ['Battery voltage report', 'battery_voltage'],
                ['Compressor uptime report', 'compressor_running'],
                ['Alerts summary', 'alerts'],
                ['Storage condition report', 'condition'],
              ].map(([label, key]) => (
                <div className="panel report-card" key={key} data-reveal="up">
                  <div className="report-card__icon"><BarChart3 size={19} /></div>
                  <b>{tx(label, language)}</b>
                  <small>
                    {key === 'alerts' ? alerts.length : history.length}
                    <span> {tx('records in current session', language)}</span>
                  </small>
                  <button className="text-btn" onClick={exportCsv}>{tx('Export CSV', language)} <ArrowUpRight size={14} /></button>
                </div>
              ))}
            </div>
          </>
        );

      default:
        return null;
    }
  };

  return (
    <div className={`app-shell ${theme === 'light' ? 'light-theme' : 'black-theme'}${lightweightMode ? ' lightweight-mode' : ''}`}>
      <div className="background-stack" aria-hidden="true">
        <Antigravity
          count={lightweightMode ? 140 : 650}
          colors={ANTIGRAVITY_COLORS}
          colorMode="radial"
          colorSpeed={0.025}
          ringRadius={7}
          waveSpeed={0.28}
          waveAmplitude={0.72}
          waveCount={2}
          particleSize={0.68}
          particleVariance={0.7}
          rotationSpeed={0.035}
          depthFactor={0.72}
          pulseSpeed={2.1}
          fieldStrength={8}
          ambient={0.16}
          interactive
          clickBurst
          opacity={lightweightMode ? 0.22 : 0.42}
          maxDevicePixelRatio={lightweightMode ? 0.8 : 1.2}
          maxFPS={lightweightMode ? 24 : 45}
          className="app-antigravity"
        />
        <div className="bg-vignette" />
      </div>

      <InterfaceFX />

      <aside className={`sidebar ${mobileOpen ? 'open' : ''}`}>
        {!lightweightMode && <Suspense fallback={null}><DarkVeil
          className="sidebar-dark-veil"
          color="#347fa0"
          speed={0.2}
          scale={1.1}
          flow={0.8}
          warp={0.26}
          brightness={1.15}
          glow={0.48}
          grain={0.012}
          quality={0.38}
          mouseInteraction
          mouseStrength={0.65}
          opacity={0.88}
        /></Suspense>}
        <button className="close-nav" onClick={() => setMobileOpen(false)} aria-label="Close navigation"><X size={18} /></button>

        <div className="nav-label">OPERATIONS</div>
        <nav>
          {nav.map(({ label, icon: Icon, code }) => (
            <button
              key={label}
              className={`nav-item ${page === label ? 'active' : ''}`}
              onClick={() => { setPage(label); setMobileOpen(false); }}
            >
              <span className="nav-item__icon"><Icon size={16} strokeWidth={1.8} /></span>
              <span className="nav-item__label">{translateNav(label, language)}</span>
              <span className="nav-item__code">{code}</span>
              {label === 'Alerts & Events' && unacknowledged > 0 && <i className="nav-count">{unacknowledged}</i>}
            </button>
          ))}
        </nav>

        <div className="sidebar-brand-area">
          <div className="language-picker language-picker--sidebar" title={languageLabel(language)}>
            <Languages size={14} aria-hidden="true" />
            <select value={language} onChange={(event) => setLanguage(event.target.value)} aria-label={languageLabel(language)}>
              <option value="en">English · English</option>
              {LANGUAGES.map(({ code, label }) => <option key={code} value={code}>{label}</option>)}
            </select>
            <span className="language-picker__value" aria-hidden="true">
              {language === 'en' ? 'English · English' : LANGUAGES.find(({ code }) => code === language)?.label || 'English · English'}
            </span>
            <ChevronDown size={12} aria-hidden="true" />
          </div>
          <div className="sidebar-logo">
            <img src="/optimist-eco-tech-logo.png" alt="Optimist Eco-Tech" />
          </div>
        </div>
        <div className="sidebar-foot">OPTAL OS · FIELD BUILD 1.0</div>
      </aside>

      {mobileOpen && <div className="scrim" onClick={() => setMobileOpen(false)} />}

      <main className="main">
        <header className="topbar">
          <button className="menu-btn" onClick={() => setMobileOpen(true)} aria-label="Open navigation"><Menu size={19} /></button>
          <div className="crumb">
            <span>OPTAL OS</span>
            <b>/</b>
            <strong>{translateNav(page, language)}</strong>
          </div>
          <div className="top-controls">
            <div className="mode-switch" role="group" aria-label="Telemetry source">
              <button
                type="button"
                className={mode === 'demo' ? 'chosen' : ''}
                aria-pressed={mode === 'demo'}
                onClick={() => setMode('demo')}
                title="Use generated demonstration readings"
              >
                {mode === 'demo' && <span aria-hidden="true" />}{tx('Demo', language)}
              </button>
              <button
                type="button"
                className={mode === 'live' ? 'live-chosen' : ''}
                aria-pressed={mode === 'live'}
                onClick={() => setMode('live')}
                title="Read telemetry from the ESP32 USB serial bridge"
              >
                {mode === 'live' && <span aria-hidden="true" />}{tx('Live', language)}
              </button>
            </div>
            <LocalClock language={language} />
            <label className="device-select">
              <Factory size={15} />
              <select value={selectedDevice} onChange={(e) => setSelectedDevice(e.target.value)} aria-label="Select storage unit">
                {DEVICES.map((id) => <option key={id} value={id}>{id}</option>)}
              </select>
              <ChevronDown size={13} />
            </label>

            <div className={`connection ${mode === 'demo' || lastSuccess ? 'connected' : error ? 'disconnected' : ''}`}>
              {mode === 'live' && error ? <WifiOff size={14} /> : <Wifi size={14} />}
              <span>{mode === 'demo' ? tx('Demo', language).toUpperCase() : lastSuccess ? tx('Connected', language).toUpperCase() : error ? tx('Disconnected', language).toUpperCase() : tx('Connecting', language).toUpperCase()}</span>
            </div>

            <div className="avatar" aria-hidden="true">OP</div>
          </div>
        </header>

        <section className={`content ${page === 'Overview' ? 'content--overview' : 'content--inner'}`} key={page}>
          <div className="page-heading">
            <div>
              <Eyebrow language={language}>{page === 'Overview' ? 'CONTROL ROOM' : 'OPTAL OS'}</Eyebrow>
              <h1>{translateNav(page, language)}</h1>
            </div>
            <div className="heading-meta">
              <span><Clock size={13} /> {new Date().toLocaleDateString(getLocale(language))}</span>
            </div>
          </div>

          {mode === 'live' && <SerialBridgePanel />}

          {error && mode === 'demo' && <div className="error-banner">{error}</div>}

          {pageContent()}
        </section>
      </main>
    </div>
  );
}
