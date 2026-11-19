import React, { useEffect, useMemo, useState } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  Battery,
  Box,
  ChevronDown,
  Clock,
  Download,
  Factory,
  Leaf,
  Menu,
  Power,
  Snowflake,
  Wifi,
  WifiOff,
  Wrench,
  X,
} from 'lucide-react';
import { useTelemetry } from './hooks/useTelemetry';
import CoolerModel from './components/CoolerModel';
import Grainient from './components/Grainient';
import ThemeToggleButton from './components/ThemeToggleButton';
import UnitMonitoringDashboard from './components/UnitMonitoringDashboard';
import InterfaceFX, { Magnetic, Tilt, useReveal } from './components/InterfaceFX';
import { cropProfiles } from './data/cropProfiles';
import { conditionScore } from './intelligence/scoring';

const nav = [
  { label: 'Overview', icon: Activity, code: '01' },
  { label: 'Live Monitoring', icon: Activity, code: '02' },
  { label: 'Storage Units', icon: Box, code: '03' },
  { label: 'Crop Intelligence', icon: Leaf, code: '04' },
  { label: 'Energy Analytics', icon: Battery, code: '05' },
  { label: 'Alerts & Events', icon: AlertTriangle, code: '06' },
  { label: 'Maintenance', icon: Wrench, code: '07' },
  { label: 'Reports', icon: BarChart3, code: '08' },
];

const DEVICES = Array.from({ length: 6 }, (_, i) => `OPT-00${i + 1}`);
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

function Eyebrow({ children, index }) {
  return (
    <div className="eyebrow">
      <i />
      <span>{children}</span>
      {index && <em>{index}</em>}
    </div>
  );
}

function SectionHead({ eyebrow, title, count, action }) {
  return (
    <div className="section-head" data-reveal="up">
      <div>
        <Eyebrow>{eyebrow}</Eyebrow>
        <h2 className="section-head__title">
          {title} {count && <span>{count}</span>}
        </h2>
      </div>
      {action}
    </div>
  );
}

function PageIntro({ eyebrow, title, copy, children }) {
  return (
    <div className="page-intro" data-reveal="up">
      <div>
        <Eyebrow>{eyebrow}</Eyebrow>
        <h2>{title}</h2>
        <p>{copy}</p>
      </div>
      {children}
    </div>
  );
}

function Gauge({ title, value, unit, min, max, low, high, color, caption }) {
  const pct = Math.max(0, Math.min(1, (value - min) / (max - min)));
  const circ = 2 * Math.PI * 46;
  return (
    <div className="gauge-card">
      <div className="gauge-top">
        <span className="gauge-title">{title}</span>
        <span className="live-dot" />
      </div>
      <div className="gauge-wrap">
        <svg viewBox="0 0 112 112" aria-hidden="true">
          <circle cx="56" cy="56" r="46" className="gauge-track" />
          <circle
            cx="56"
            cy="56"
            r="46"
            className="gauge-value"
            stroke={color}
            strokeDasharray={`${circ * pct} ${circ}`}
            transform="rotate(-90 56 56)"
          />
        </svg>
        <div className="gauge-reading">
          <strong>{value}</strong>
          <span>{unit}</span>
        </div>
      </div>
      <div className="gauge-meta">
        <span>MIN <b>{low}</b></span>
        <span>MAX <b>{high}</b></span>
      </div>
      <div className="gauge-range">Scale {min}–{max} {unit}</div>
      <div className="zone">
        <i /><span>Normal</span>
        <i className="yellow" /><span>Warning</span>
        <i className="red" /><span>Critical</span>
      </div>
      <div className="gauge-caption">{caption}</div>
    </div>
  );
}

function UnitCard({ index, reading, mode, large = false }) {
  const id = `OPT-00${index + 1}`;
  const simulated = mode === 'demo' && reading?.source === 'SIMULATED';
  const hasReading = Boolean(reading);
  const state = simulated ? (index === 0 ? 'PROTOTYPE · SIM' : 'SIMULATED') : hasReading ? 'ONLINE' : 'OFFLINE';

  return (
    <Tilt className="unit-card-wrap" amount={4}>
      <article className={`unit-card ${hasReading ? 'healthy' : 'inactive'} ${large ? 'unit-card--large' : ''}`}>
        <div className="unit-card__glow" />
        <div className="unit-head">
          <div className="unit-head__id">
            <span className="unit-index">{String(index + 1).padStart(2, '0')}</span>
            <b>{id}</b>
          </div>
          <span className={`state ${hasReading ? 'ok' : 'muted'}`}><i />{state}</span>
        </div>
        {large && (
          <p className="unit-card__copy">
            {simulated
              ? index === 0
                ? 'Locally connected prototype · simulated readings'
                : 'Simulated unit readings'
              : hasReading
                ? 'Live backend readings'
                : `No telemetry reported for ${id}.`}
          </p>
        )}
        <div className="unit-values">
          <div><small>TEMP</small><b>{hasReading ? `${nfmt(reading.temperature)}°C` : '—'}</b></div>
          <div><small>HUMIDITY</small><b>{hasReading ? `${nfmt(reading.humidity)}%` : '—'}</b></div>
          <div><small>BATTERY</small><b>{hasReading ? `${nfmt(reading.battery_voltage, 2)} V` : '—'}</b></div>
        </div>
        <div className="unit-foot">
          <span>
            <Power size={13} />
            {hasReading ? (reading.compressor_running ? 'COMPRESSOR ON' : 'COMPRESSOR OFF') : 'NO TELEMETRY'}
          </span>
          <span>
            {simulated
              ? index === 0 ? 'LOCAL PROTOTYPE · SIM DATA' : 'SIMULATED UNIT'
              : hasReading ? 'LIVE TELEMETRY' : 'AWAITING BACKEND'}
          </span>
        </div>
      </article>
    </Tilt>
  );
}

function HistoryChart({ title, dataKey, data, color, unit, threshold, range, setRange, domains }) {
  const values = data.map((d) => d[dataKey]).filter((v) => Number.isFinite(v));
  return (
    <section className="panel chart-panel" data-reveal="up">
      <div className="panel-heading">
        <div>
          <Eyebrow>HISTORY</Eyebrow>
          <h3>{title}</h3>
        </div>
      </div>
      <div className="chart-stats">
        <span>MIN <b>{nfmt(values.length ? Math.min(...values) : NaN, 1)} {unit}</b></span>
        <span>MAX <b>{nfmt(values.length ? Math.max(...values) : NaN, 1)} {unit}</b></span>
        <span className="chart-stats__hint">LIVE SAMPLE STREAM</span>
      </div>
      <div className="chart">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 6, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id={`fill-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.28} />
                <stop offset="100%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="rgba(255,255,255,.07)" strokeDasharray="3 5" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fill: '#7d8581', fontSize: 10, fontFamily: 'IBM Plex Mono' }}
              tickLine={false}
              axisLine={{ stroke: 'rgba(255,255,255,.08)' }}
              minTickGap={24}
            />
            <YAxis
              domain={domains}
              tick={{ fill: '#7d8581', fontSize: 10, fontFamily: 'IBM Plex Mono' }}
              tickLine={false}
              axisLine={false}
              width={40}
            />
            <Tooltip
              cursor={{ stroke: 'rgba(242,166,90,.35)', strokeDasharray: '3 3' }}
              contentStyle={{
                background: 'rgba(14,16,17,.96)',
                border: '1px solid rgba(255,255,255,.12)',
                borderRadius: 10,
                color: '#f3f1eb',
                fontFamily: 'IBM Plex Mono',
                fontSize: 11,
                boxShadow: '0 18px 40px rgba(0,0,0,.5)',
              }}
            />
            <ReferenceLine y={threshold} stroke="#f2a65a" strokeDasharray="4 4" strokeOpacity={0.8} />
            <Area
              type="monotone"
              dataKey={dataKey}
              stroke={color}
              strokeWidth={2}
              fill={`url(#fill-${dataKey})`}
              isAnimationActive={false}
              activeDot={{ r: 4, fill: color, stroke: '#0b0d0e', strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}

function Hero({ reading, mode, onNavigate, selectedDevice }) {
  const stats = [
    ['CHAMBER TEMP', reading ? `${nfmt(reading.temperature)}°C` : '—'],
    ['REL. HUMIDITY', reading ? `${nfmt(reading.humidity)}%` : '—'],
    ['BATTERY', reading ? `${nfmt(reading.battery_voltage, 2)} V` : '—'],
    ['COMPRESSOR', reading ? (reading.compressor_running ? 'RUNNING' : 'IDLE') : '—'],
  ];

  return (
    <section className="hero" data-reveal="up">
      <div className="hero__content">
        <Eyebrow index="001 / FIELD SYSTEM">DECENTRALIZED COLD STORAGE</Eyebrow>
        <h1 className="hero__title">
          Cold chain,<br />
          <span>without compromise.</span>
        </h1>
        <p className="hero__copy">
          A field-ready control layer for solar cold-storage units. Watch chamber conditions,
          fleet health and storage intelligence in one calm, honest view.
        </p>
        <div className="hero__actions">
          <Magnetic>
            <button className="btn btn--primary" onClick={() => onNavigate('Live Monitoring')}>
              Open live telemetry <ArrowUpRight size={16} />
            </button>
          </Magnetic>
          <Magnetic>
            <button className="btn btn--ghost" onClick={() => onNavigate('Storage Units')}>
              Explore the fleet <ArrowRight size={16} />
            </button>
          </Magnetic>
        </div>
        <div className="hero__stats">
          {stats.map(([label, value]) => (
            <div className="hero__stat" key={label}>
              <small>{label}</small>
              <b>{value}</b>
            </div>
          ))}
        </div>
      </div>
      <div className="hero__visual" aria-hidden="true">
        <div className="hero-orbit hero-orbit--outer" />
        <div className="hero-orbit hero-orbit--middle" />
        <div className="hero-orbit hero-orbit--inner" />
        <div className="hero-core">
          <Snowflake size={30} strokeWidth={1.1} />
          <span>{selectedDevice}</span>
        </div>
        <div className="hero-tag hero-tag--one">
          <i /> {mode === 'demo' ? 'SIMULATION ACTIVE' : 'HARDWARE LINK'}
        </div>
        <div className="hero-tag hero-tag--two">3s TELEMETRY INTERVAL</div>
      </div>
      <div className="hero__scroll">
        <span>SCROLL TO EXPLORE</span>
        <i />
      </div>
    </section>
  );
}

function Ticker({ reading, fleet, mode }) {
  const items = [
    `CHAMBER · ${reading ? `${nfmt(reading.temperature)} °C` : '—'}`,
    `HUMIDITY · ${reading ? `${nfmt(reading.humidity)} %` : '—'}`,
    `BATTERY · ${reading ? `${nfmt(reading.battery_voltage, 2)} V` : '—'}`,
    `UNITS ONLINE · ${fleet.filter((u) => u).length.toString().padStart(2, '0')} / 06`,
    `SOURCE · ${mode === 'demo' ? 'SIMULATED DATA' : 'LIVE HARDWARE'}`,
    `PROTOCOL · OPT/TELEMETRY-1.0`,
  ];
  return (
    <div className="ticker" aria-hidden="true">
      <div className="ticker__track">
        {[0, 1].map((copy) => (
          <div className="ticker__group" key={copy}>
            {items.map((item) => (
              <span key={item}><i />{item}</span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function App() {
  const [page, setPage] = useState('Overview');
  const [mode, setMode] = useState('demo');
  const [theme, setTheme] = useState(() => localStorage.getItem('optimist-theme') || 'black');
  const [selectedDevice, setSelectedDevice] = useState('OPT-001');
  const [range, setRange] = useState('6h');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [settings, setSettings] = useState(() => ({
    ...initSettings,
    ...JSON.parse(localStorage.getItem('optimist-settings') || '{}'),
  }));
  const [history, setHistory] = useState([]);
  const [alerts, setAlerts] = useState([]);

  const { reading, fleet, samples, unitHistories, error, lastSuccess } = useTelemetry(
    mode, 3000, range, selectedDevice,
  );
  useReveal(page);

  const score = useMemo(
    () => conditionScore(reading, cropProfiles[settings.crop]),
    [reading, settings.crop],
  );

  useEffect(() => {
    localStorage.setItem('optimist-theme', theme);
  }, [theme]);

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

  const update = (s) => {
    setSettings((v) => {
      const next = { ...v, ...s };
      localStorage.setItem('optimist-settings', JSON.stringify(next));
      return next;
    });
  };

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
            <Hero reading={reading} mode={mode} onNavigate={setPage} selectedDevice={selectedDevice} />
            <Ticker reading={reading} fleet={fleet} mode={mode} />

            <SectionHead
              eyebrow="INSTRUMENT BAY"
              title="The unit, up close"
              action={<span className="section-head__note">DRAG TO ROTATE · SCROLL TO ZOOM</span>}
            />
            <div className="overview-top" data-reveal="up">
              <div className="instrument-column">
                <Tilt className="model-wrap" amount={2}>
                  <CoolerModel />
                </Tilt>
                <div className="gauges">
                  {[
                    {
                      title: 'BATTERY VOLTAGE',
                      value: nfmt(reading?.battery_voltage, 2),
                      unit: 'V', min: 10, max: 14, low: '11.9 V', high: '12.8 V',
                      color: '#f2a65a', caption: 'Battery monitor',
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
                      <Gauge {...gauge} />
                    </Tilt>
                  ))}
                </div>
              </div>
            </div>

            <SectionHead
              eyebrow="FLEET STATUS"
              title="Storage units"
              count="06"
              action={
                <Magnetic>
                  <button className="text-btn" onClick={() => setPage('Storage Units')}>
                    View all <ArrowUpRight size={15} />
                  </button>
                </Magnetic>
              }
            />
            <div className="unit-grid">
              {DEVICES.map((id, i) => (
                <div key={id} data-reveal="up">
                  <UnitCard
                    index={i}
                    mode={mode}
                    reading={fleet.find((u) => u.device_id === id)}
                  />
                </div>
              ))}
            </div>
          </>
        );

      case 'Live Monitoring':
        return (
          <>
            <PageIntro eyebrow="TELEMETRY" title="Live Monitoring" copy="Live readings and historical graphs for every storage unit." />
            <div className="metric-row">
              {[
                ['Temperature', reading ? `${nfmt(reading.temperature)} °C` : '—'],
                ['Humidity', reading ? `${nfmt(reading.humidity)} %` : '—'],
                ['Battery voltage', reading ? `${nfmt(reading.battery_voltage, 2)} V` : '—'],
                ['Compressor', reading ? (reading.compressor_running ? 'RUNNING' : 'STOPPED') : '—'],
                ['Uptime', reading ? `${Math.floor(reading.uptime_seconds / 3600)} h` : '—'],
                ['Sensor health', reading ? '3 / 3 OK' : 'Unknown'],
              ].map(([label, value]) => (
                <div className="metric panel" key={label} data-reveal="up">
                  <small>{label}</small>
                  <b>{value}</b>
                </div>
              ))}
            </div>
            <SectionHead
              eyebrow="UNIT HISTORY"
              title="All six storage units"
              count="06"
              action={<span className={`pill ${mode === 'demo' ? 'demo' : 'live'}`}>{mode === 'demo' ? 'SIMULATED DATA' : 'LIVE HARDWARE'}</span>}
            />
            <UnitMonitoringDashboard
              fleet={fleet}
              histories={unitHistories}
              mode={mode}
              settings={settings}
              range={range}
              setRange={setRange}
            />
          </>
        );

      case 'Storage Units':
        return (
          <>
            <PageIntro
              eyebrow="FLEET"
              title="Storage Units"
              copy="One local prototype; the remaining entries are simulated units running the same telemetry contract."
            />
            <div className="unit-grid unit-grid--large">
              {DEVICES.map((id, i) => (
                <div key={id} data-reveal="up">
                  <UnitCard
                    index={i}
                    mode={mode}
                    large
                    reading={fleet.find((u) => u.device_id === id)}
                  />
                </div>
              ))}
            </div>
          </>
        );

      case 'Crop Intelligence': {
        const profile = cropProfiles[settings.crop];
        const outside = reading && (
          reading.temperature < profile.temperature[0] || reading.temperature > profile.temperature[1] ||
          reading.humidity < profile.humidity[0] || reading.humidity > profile.humidity[1]
        );
        return (
          <>
            <PageIntro eyebrow="POST HARVEST" title="Crop Intelligence" copy="Editable reference ranges — indicative defaults, not authoritative agronomic advice.">
              <label className="select-wrap select-wrap--page">
                <select value={settings.crop} onChange={(e) => update({ crop: e.target.value })} aria-label="Select crop">
                  {Object.keys(cropProfiles).map((crop) => <option key={crop}>{crop}</option>)}
                </select>
                <ChevronDown size={13} />
              </label>
            </PageIntro>
            <div className="two-col">
              <div className="panel" data-reveal="left">
                <Eyebrow>SELECTED CROP</Eyebrow>
                <h2 className="display-value">{settings.crop}</h2>
                <div className="detail-row"><span>Recommended temperature</span><b>{profile.temperature[0]}–{profile.temperature[1]} °C</b></div>
                <div className="detail-row"><span>Recommended RH</span><b>{profile.humidity[0]}–{profile.humidity[1]}%</b></div>
                <p>{profile.guidance}</p>
                <p className="muted-text">Profile source: configurable local reference file. Verify ranges with a qualified post-harvest advisor for your cultivar and storage duration.</p>
              </div>
              <div className="panel" data-reveal="right">
                <Eyebrow>MEASURED CONDITIONS</Eyebrow>
                <h3>{selectedDevice} · {mode === 'demo' ? 'SIMULATED DATA' : 'LIVE HARDWARE'}</h3>
                <div className="detail-row"><span>Temperature</span><b>{reading ? `${nfmt(reading.temperature)} °C` : '—'}</b></div>
                <div className="detail-row"><span>Humidity</span><b>{reading ? `${nfmt(reading.humidity)} %` : '—'}</b></div>
                <div className="detail-row"><span>Deviation</span><b className={outside ? 'is-alert' : 'is-good'}>{reading ? (outside ? 'Outside profile' : 'Within profile') : 'No reading'}</b></div>
                <div className="detail-row"><span>Condition score</span><b>{score ? `${score.score} / 100` : '—'}</b></div>
              </div>
            </div>
          </>
        );
      }

      case 'Energy Analytics':
        return (
          <>
            <PageIntro eyebrow="POWER SYSTEM" title="Energy Analytics" copy="Battery and compressor telemetry only. No solar or power consumption sensors are configured." />
            <HistoryChart
              title="Battery voltage history"
              dataKey="battery_voltage"
              data={data}
              color="#f2a65a"
              unit="V"
              threshold={+settings.batteryWarning}
              range={range}
              setRange={setRange}
              domains={[10, 14]}
            />
            <div className="two-col">
              <div className="panel" data-reveal="left">
                <Eyebrow>BATTERY MONITORING</Eyebrow>
                <h3 className="display-value">{reading ? `${nfmt(reading.battery_voltage, 2)} V` : 'No reading'}</h3>
                <p>Configured low-voltage warning: {settings.batteryWarning} V. Battery state of health cannot be calculated without capacity testing and calibrated discharge data.</p>
                <div className="detail-row"><span>Compressor running samples</span><b>{history.filter((x) => x.compressor_running).length}/{history.length}</b></div>
              </div>
              <div className="panel" data-reveal="right">
                <Eyebrow>ENERGY CONSUMPTION</Eyebrow>
                <h3>Not measured</h3>
                <p>Current and power measurements are not present in the confirmed prototype sensors. Solar generation and energy consumption are therefore not reported.</p>
              </div>
            </div>
          </>
        );

      case 'Alerts & Events':
        return (
          <>
            <PageIntro eyebrow="EVENT LOG" title="Alerts & Events" copy={`${unacknowledged} active · configured thresholds stored locally`} />
            <div className="panel table-wrap" data-reveal="up">
              <table>
                <thead>
                  <tr><th>Severity</th><th>Time</th><th>Device</th><th>Event</th><th>Description</th><th>Status</th><th /></tr>
                </thead>
                <tbody>
                  {alerts.length ? alerts.map((a, i) => (
                    <tr key={`${a.key}-${i}`}>
                      <td><span className={`severity ${a.severity.toLowerCase()}`}>{a.severity}</span></td>
                      <td>{new Date(a.time).toLocaleString()}</td>
                      <td>{a.device}</td>
                      <td>{a.type}</td>
                      <td>{a.description}</td>
                      <td>{a.acknowledged ? 'Acknowledged' : 'Active'}</td>
                      <td>
                        {!a.acknowledged && (
                          <button
                            className="small-btn"
                            onClick={() => setAlerts((xs) => xs.map((x, j) => (j === i ? { ...x, acknowledged: true } : x)))}
                          >
                            Acknowledge
                          </button>
                        )}
                      </td>
                    </tr>
                  )) : (
                    <tr><td colSpan="7" className="empty">No active alerts. Threshold-based events appear as readings cross configured limits.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            <p className="muted-text">Alert history is held in this browser session during simulation mode. Live alert API integration is pending.</p>
          </>
        );

      case 'Maintenance':
        return (
          <>
            <PageIntro eyebrow="RELIABILITY" title="Maintenance" copy="Inspection planning and current device health." />
            <div className="two-col">
              <div className="panel" data-reveal="left">
                <Eyebrow>DEVICE HEALTH</Eyebrow>
                <h3>{selectedDevice}</h3>
                <div className="detail-row"><span>Temperature sensor</span><b>{reading ? 'Connected' : 'Unknown'}</b></div>
                <div className="detail-row"><span>Humidity sensor</span><b>{reading ? 'Connected' : 'Unknown'}</b></div>
                <div className="detail-row"><span>Battery monitor</span><b>{reading ? 'Connected' : 'Unknown'}</b></div>
                <div className="detail-row"><span>Hardware backend</span><b>{mode === 'demo' ? 'Simulated provider' : error ? 'Disconnected' : 'Connected'}</b></div>
              </div>
              <div className="panel" data-reveal="right">
                <Eyebrow>RECOMMENDED CHECKS</Eyebrow>
                <h3>Inspection schedule</h3>
                <ul className="recommendations">
                  <li>Verify sensor readings against a reference instrument before commissioning.</li>
                  <li>Inspect wiring and connector strain relief before field deployment.</li>
                  <li>Review compressor duty pattern and cooling performance during chamber trials.</li>
                  <li>Perform battery capacity test before displaying runtime estimates.</li>
                </ul>
              </div>
              <div className="panel" data-reveal="up">
                <Eyebrow>MAINTENANCE RECORDS</Eyebrow>
                <h3>No service history</h3>
                <p>Records can be entered when maintenance workflows are connected.</p>
              </div>
            </div>
          </>
        );

      case 'Reports':
        return (
          <>
            <PageIntro eyebrow="DATA EXPORT" title="Reports" copy="Download locally collected samples as CSV.">
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
                  <b>{label}</b>
                  <small>
                    {key === 'alerts' ? alerts.length : key === 'condition' ? (score?.score ?? '—') : history.length}
                    <span> records in current session</span>
                  </small>
                  <button className="text-btn" onClick={exportCsv}>Export CSV <ArrowUpRight size={14} /></button>
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
    <div className={`app-shell ${theme === 'light' ? 'light-theme' : 'black-theme'}`}>
      <div className="background-stack" aria-hidden="true">
        <div className="bg-webgl">
          <Grainient
            colors={['#070809', '#0b0d0e', '#111315', '#1b1712', '#2a1c10']}
            angle={38}
            flow={0.42}
            silk={0.22}
            grainAmount={0.022}
            lightMode={theme === 'light'}
            interactive
            clickSwirl
            intro={false}
          />
        </div>
        <div className="bg-grid" />
        <div className="bg-glow bg-glow--amber" />
        <div className="bg-glow bg-glow--mint" />
        <div className="bg-noise" />
        <div className="bg-vignette" />
      </div>

      <InterfaceFX />

      <aside className={`sidebar ${mobileOpen ? 'open' : ''}`}>
        <div className="brand">
          <div className="brand-mark"><Snowflake size={20} strokeWidth={1.6} /></div>
          <div className="brand__text">
            <b>OPTAL <em>OS</em></b>
            <small>COLD STORAGE SYSTEMS</small>
          </div>
          <button className="close-nav" onClick={() => setMobileOpen(false)} aria-label="Close navigation"><X size={18} /></button>
        </div>

        <div className="nav-label">OPERATIONS</div>
        <nav>
          {nav.map(({ label, icon: Icon, code }) => (
            <button
              key={label}
              className={`nav-item ${page === label ? 'active' : ''}`}
              onClick={() => { setPage(label); setMobileOpen(false); }}
            >
              <span className="nav-item__icon"><Icon size={16} strokeWidth={1.8} /></span>
              <span className="nav-item__label">{label}</span>
              <span className="nav-item__code">{code}</span>
              {label === 'Alerts & Events' && unacknowledged > 0 && <i className="nav-count">{unacknowledged}</i>}
            </button>
          ))}
        </nav>

        <div className="side-status">
          <Eyebrow>SYSTEM STATUS</Eyebrow>
          <div className="status-row"><span>Telemetry provider</span><b className="green">{mode === 'demo' ? 'SIMULATOR' : 'BACKEND'}</b></div>
          <div className="status-row"><span>Active unit</span><b>{selectedDevice}</b></div>
          <div className="status-row"><span>Polling interval</span><b>3.0 s</b></div>
          <div className="status-bars" aria-hidden="true">
            {Array.from({ length: 22 }, (_, i) => <i key={i} style={{ animationDelay: `${i * 70}ms` }} />)}
          </div>
          <div className="side-clock"><span>LOCAL TIME</span><b>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</b></div>
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
            <strong>{page}</strong>
          </div>
          <div className="top-controls">
            <label className="device-select">
              <Factory size={15} />
              <select value={selectedDevice} onChange={(e) => setSelectedDevice(e.target.value)} aria-label="Select storage unit">
                {DEVICES.map((id) => <option key={id} value={id}>{id}</option>)}
              </select>
              <ChevronDown size={13} />
            </label>

            <div className="mode-switch" role="group" aria-label="Data source">
              <button className={mode === 'demo' ? 'chosen' : ''} onClick={() => setMode('demo')}><span />DEMO</button>
              <button className={mode === 'live' ? 'chosen live-chosen' : ''} onClick={() => setMode('live')}><span />LIVE</button>
            </div>

            <div className={`connection ${mode === 'demo' ? 'connected' : error ? 'disconnected' : 'connected'}`}>
              {mode === 'demo' || !error ? <Wifi size={14} /> : <WifiOff size={14} />}
              <span>{mode === 'demo' ? 'SIMULATED' : error ? 'OFFLINE' : 'CONNECTED'}</span>
            </div>

            <div className="avatar" aria-hidden="true">OP</div>
            <Magnetic strength={0.12}><ThemeToggleButton theme={theme} onToggle={setTheme} /></Magnetic>
          </div>
        </header>

        <section className="content" key={page}>
          <div className="page-heading">
            <div>
              <Eyebrow>{page === 'Overview' ? 'CONTROL ROOM' : 'OPTAL OS'}</Eyebrow>
              <h1>{page}</h1>
            </div>
            <div className="heading-meta">
              <span className={`pill ${mode === 'demo' ? 'demo' : 'live'}`}>{mode === 'demo' ? 'SIMULATED DATA' : 'LIVE MODE'}</span>
              <span><Clock size={13} /> {new Date().toLocaleDateString()}</span>
            </div>
          </div>

          {mode === 'live' && error && (
            <div className="offline-banner">
              <WifiOff size={17} />
              <div>
                <b>HARDWARE BACKEND DISCONNECTED</b>
                <small>
                  No simulated values are generated in Live mode.{' '}
                  {reading
                    ? `Showing last successful reading from ${new Date(lastSuccess).toLocaleTimeString()} as stale.`
                    : 'Waiting for /api/status from the FastAPI backend.'}
                </small>
              </div>
              {reading && <span className="stale-tag">STALE</span>}
            </div>
          )}
          {error && mode === 'demo' && <div className="error-banner">{error}</div>}

          {pageContent()}
        </section>
      </main>
    </div>
  );
}
