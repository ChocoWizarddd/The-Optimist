import { useEffect, useMemo, useState } from "react";
import { createDemoProvider } from "../services/dataProviders/demoProvider";
import { createHardwareProvider } from "../services/dataProviders/hardwareProvider";

const DEVICE_IDS = Array.from({ length: 6 }, (_, index) => `OPT-00${index + 1}`);
const rangeDuration = {
  "1h": 60 * 60 * 1000,
  "6h": 6 * 60 * 60 * 1000,
  "24h": 24 * 60 * 60 * 1000,
  "7d": 7 * 24 * 60 * 60 * 1000,
};

export function useTelemetry(mode, interval = 3000, range = "1h", deviceId = "OPT-001") {
  const provider = useMemo(
    () => (mode === "demo" ? createDemoProvider() : createHardwareProvider()),
    [mode],
  );
  const [fleet, setFleet] = useState([]);
  const [samples, setSamples] = useState([]);
  const [unitHistories, setUnitHistories] = useState({});
  const [error, setError] = useState("");
  const [historyError, setHistoryError] = useState("");
  const [lastSuccess, setLastSuccess] = useState(null);

  useEffect(() => {
    setFleet([]);
    setLastSuccess(null);
    setError("");
  }, [provider]);

  useEffect(() => {
    let active = true;
    const poll = async () => {
      try {
        const next = await provider.getStatus(deviceId);
        const nextFleet = provider.getFleet
          ? await provider.getFleet(next)
          : Array.isArray(next.units)
            ? next.units
            : [next];
        if (active) {
          setFleet(nextFleet);
          setLastSuccess(Date.now());
          setError("");
        }
      } catch (requestError) {
        if (active) setError(requestError.message || "Connection unavailable");
      }
    };
    poll();
    const id = setInterval(poll, interval);
    return () => {
      active = false;
      clearInterval(id);
    };
  }, [provider, interval, deviceId]);

  useEffect(() => {
    let active = true;
    setSamples([]);
    setHistoryError("");
    if (!provider.getHistory) return () => { active = false; };
    provider
      .getHistory(range, deviceId)
      .then((points) => {
        if (active) setSamples(Array.isArray(points) ? points : []);
      })
      .catch((requestError) => {
        if (active) setHistoryError(requestError.message || "History unavailable");
      });
    return () => {
      active = false;
    };
  }, [provider, range, deviceId]);

  useEffect(() => {
    let active = true;
    setUnitHistories({});
    if (!provider.getHistory) return () => { active = false; };
    Promise.allSettled(
      DEVICE_IDS.map(async (id) => [id, await provider.getHistory(range, id)]),
    ).then((results) => {
      if (!active) return;
      const next = {};
      results.forEach((result) => {
        if (result.status === "fulfilled") {
          const [id, points] = result.value;
          next[id] = Array.isArray(points) ? points : [];
        }
      });
      setUnitHistories(next);
    });
    return () => {
      active = false;
    };
  }, [provider, range]);

  useEffect(() => {
    if (!fleet.length) return;
    const cutoff = Date.now() - (rangeDuration[range] || rangeDuration["1h"]);
    setUnitHistories((current) => {
      let changed = false;
      const next = { ...current };
      fleet.forEach((reading) => {
        const id = reading.device_id;
        if (!id || !Object.hasOwn(next, id)) return;
        const points = [...next[id], reading]
          .filter((point) => new Date(point.timestamp).getTime() >= cutoff)
          .slice(-2500);
        next[id] = points;
        changed = true;
      });
      return changed ? next : current;
    });
  }, [fleet, range]);

  useEffect(() => {
    const selected = fleet.find((unit) => unit.device_id === deviceId);
    if (!selected) return;
    const cutoff = Date.now() - (rangeDuration[range] || rangeDuration["1h"]);
    setSamples((previous) =>
      [...previous, selected]
        .filter((point) => new Date(point.timestamp).getTime() >= cutoff)
        .slice(-2500),
    );
  }, [fleet, deviceId, range]);

  const reading = fleet.find((unit) => unit.device_id === deviceId) || null;
  return {
    reading,
    fleet,
    samples,
    unitHistories,
    error,
    historyError,
    lastSuccess,
    stale: mode === "live" && !!reading && Date.now() - lastSuccess > 10000,
  };
}
