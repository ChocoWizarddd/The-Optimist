import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const DEVICES = Array.from({ length: 6 }, (_, index) => `OPT-00${index + 1}`);
const CHARTS = [
  { title: "Temperature", dataKey: "temperature", unit: "°C", color: "#69baf0", domain: [-2, 16] },
  { title: "Humidity", dataKey: "humidity", unit: "%", color: "#9bd8fa", domain: [30, 100] },
  { title: "Battery voltage", dataKey: "battery_voltage", unit: "V", color: "#76c8f2", domain: [10, 14] },
];

const format = (value, digits = 1) =>
  Number.isFinite(Number(value)) ? Number(value).toFixed(digits) : "—";

function UnitChart({ title, dataKey, unit, color, domain, threshold, points, range, setRange }) {
  const values = points
    .map((point) => Number(point[dataKey]))
    .filter(Number.isFinite);
  const data = points.map((point) => ({
    ...point,
    label: new Date(point.timestamp).toLocaleString([], {
      hour: "2-digit",
      minute: "2-digit",
      ...(point.timestamp && new Date(point.timestamp).getDate() !== new Date().getDate()
        ? { month: "numeric", day: "numeric" }
        : {}),
    }),
  }));

  return (
    <section className="unit-history-chart">
      <div className="unit-history-heading">
        <h4>{title}</h4>
        <div className="unit-history-tools">
          {values.length > 0 && (
            <span>
              {format(Math.min(...values))}–{format(Math.max(...values))} {unit}
            </span>
          )}
          <select
            value={range}
            onChange={(event) => setRange(event.target.value)}
            aria-label={`${title} history range`}
          >
            <option value="1h">1 hour</option>
            <option value="6h">6 hours</option>
            <option value="24h">1 day</option>
            <option value="7d">7 days</option>
          </select>
        </div>
      </div>
      {data.length > 0 ? (
        <div className="unit-history-plot">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id={`unit-fill-${dataKey}-${title}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={color} stopOpacity={0.18} />
                  <stop offset="100%" stopColor={color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#27343d" strokeDasharray="3 3" />
              <XAxis
                dataKey="label"
                tick={{ fill: "#8295a0", fontSize: 10, fontWeight: 600 }}
                tickLine={false}
                axisLine={{ stroke: "#34434d" }}
                minTickGap={24}
              />
              <YAxis
                domain={domain}
                width={34}
                tick={{ fill: "#8295a0", fontSize: 10, fontWeight: 600 }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                formatter={(value) => [`${format(value)} ${unit}`, title]}
                contentStyle={{ background: "#080b08", border: "1px solid #394a55", color: "#e5eff5" }}
              />
              <ReferenceLine y={threshold} stroke="#d4aa47" strokeDasharray="4 4" />
              <Area
                type="monotone"
                dataKey={dataKey}
                stroke={color}
                strokeWidth={1.7}
                fill={`url(#unit-fill-${dataKey}-${title})`}
                isAnimationActive={false}
                connectNulls={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="unit-history-empty">No history available for this unit.</div>
      )}
    </section>
  );
}

export default function UnitMonitoringDashboard({
  fleet,
  histories,
  mode,
  settings,
  range,
  setRange,
}) {
  return (
    <div className="unit-monitoring-grid">
      {DEVICES.map((deviceId, index) => {
        const reading = fleet.find((unit) => unit.device_id === deviceId);
        const demo = mode === "demo" && reading?.source === "DEMO";
        const points = histories[deviceId] || [];
        return (
          <section className="panel unit-monitoring-card" key={deviceId}>
            <header className="unit-monitoring-header">
              <div>
                <small>STORAGE UNIT · {range.toUpperCase()} HISTORY</small>
                <h3>{deviceId}</h3>
              </div>
              <span className={`state ${reading ? "ok" : "muted"}`}>
                <i />
                {reading ? (demo ? "DEMO" : "ONLINE") : "NO TELEMETRY"}
              </span>
            </header>
            <div className="unit-monitoring-readings">
              <div><small>TEMP</small><b>{reading ? `${format(reading.temperature)}°C` : "—"}</b></div>
              <div><small>HUMIDITY</small><b>{reading ? `${format(reading.humidity)}%` : "—"}</b></div>
              <div><small>BATTERY</small><b>{reading ? `${format(reading.battery_voltage, 2)} V` : "—"}</b></div>
              <div><small>COMPRESSOR</small><b>{reading ? (reading.compressor_running ? "ON" : "OFF") : "—"}</b></div>
            </div>
            <div className="unit-monitoring-charts">
              {CHARTS.map((chart) => (
                <UnitChart
                  key={chart.dataKey}
                  {...chart}
                  points={points}
                  range={range}
                  setRange={setRange}
                  threshold={
                    chart.dataKey === "temperature"
                      ? +settings.temperatureMax
                      : chart.dataKey === "humidity"
                        ? +settings.humidityMax
                        : +settings.batteryWarning
                  }
                />
              ))}
            </div>
            <footer className="unit-monitoring-foot">
              {reading?.compressor_running ? "Compressor running" : reading ? "Compressor stopped" : "Waiting for telemetry"}
              <span>{demo ? "DEMO DATA" : mode === "live" ? "LIVE DATA" : `UNIT ${String(index + 1).padStart(2, "0")}`}</span>
            </footer>
          </section>
        );
      })}
    </div>
  );
}
