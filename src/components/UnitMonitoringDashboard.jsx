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
import { translateText as tx } from "../utils/i18n";

const DEVICES = Array.from({ length: 6 }, (_, index) => `OPT-00${index + 1}`);
const CHARTS = [
  { title: "Temperature", dataKey: "temperature", unit: "°C", color: "#69baf0", domain: [-2, 16] },
  { title: "Humidity", dataKey: "humidity", unit: "%", color: "#9bd8fa", domain: [30, 100] },
  { title: "Battery voltage", dataKey: "battery_voltage", unit: "V", color: "#76c8f2", domain: [10, 14] },
];

const format = (value, digits = 1) =>
  Number.isFinite(Number(value)) ? Number(value).toFixed(digits) : "—";

function UnitChart({ title, dataKey, unit, color, domain, threshold, points, range, setRange, language }) {
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
        <h4>{tx(title, language)}</h4>
        <div className="unit-history-tools">
          {values.length > 0 && (
            <span>
              {format(Math.min(...values))}–{format(Math.max(...values))} {unit}
            </span>
          )}
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
        <div className="unit-history-empty">{tx("No history available for this unit.", language)}</div>
      )}
    </section>
  );
}

export default function UnitMonitoringDashboard({
  fleet,
  histories,
  settings,
  range,
  setRange,
  language = "en",
}) {
  return (
    <div className="unit-monitoring-grid">
      {DEVICES.map((deviceId, index) => {
        const reading = fleet.find((unit) => unit.device_id === deviceId);
        const points = histories[deviceId] || [];
        return (
          <section className="panel unit-monitoring-card" key={deviceId}>
            <header className="unit-monitoring-header">
              <div>
                <small>{tx("Storage Units", language).toUpperCase()} · {range.toUpperCase()} {tx("Unit history", language).toUpperCase()}</small>
                <h3>{deviceId}</h3>
              </div>
              <span className={`state ${reading ? "ok" : "muted"}`}>
                <i />
                {reading ? tx("Online", language).toUpperCase() : tx("No telemetry", language).toUpperCase()}
              </span>
            </header>
            <div className="unit-monitoring-readings">
              <div><small>{tx("Temperature", language).toUpperCase()}</small><b>{reading ? `${format(reading.temperature)}°C` : "—"}</b></div>
              <div><small>{tx("Humidity", language).toUpperCase()}</small><b>{reading ? `${format(reading.humidity)}%` : "—"}</b></div>
              <div><small>{tx("Battery", language).toUpperCase()}</small><b>{reading ? `${format(reading.battery_voltage, 2)} V` : "—"}</b></div>
              <div><small>{tx("Compressor", language).toUpperCase()}</small><b>{reading ? tx(reading.compressor_running ? "On" : "Off", language).toUpperCase() : "—"}</b></div>
            </div>
            <div className="unit-monitoring-charts">
              {CHARTS.map((chart) => (
                <UnitChart
                  key={chart.dataKey}
                  {...chart}
                  points={points}
                  range={range}
                  setRange={setRange}
                  language={language}
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
              {tx(reading?.compressor_running ? "Compressor running" : reading ? "Compressor stopped" : "Waiting for telemetry", language)}
              <span>{String(index + 1).padStart(2, "0")}</span>
            </footer>
          </section>
        );
      })}
    </div>
  );
}
