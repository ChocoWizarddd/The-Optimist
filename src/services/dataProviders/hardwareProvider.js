const BASE = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

export function createHardwareProvider() {
  return {
    mode: 'live',
    async getStatus(deviceId = 'OPT-001') {
      const response = await fetch(`${BASE}/api/status?device_id=${encodeURIComponent(deviceId)}`, {
        signal: AbortSignal.timeout(2500),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.detail || `Backend returned ${response.status}`);
      }
      const data = await response.json();
      return { ...data, source: 'LIVE', received_at: new Date().toISOString() };
    },
    async getHistory(range, deviceId = 'OPT-001') {
      const params = new URLSearchParams({ range, device_id: deviceId });
      const response = await fetch(`${BASE}/api/history?${params}`, { signal: AbortSignal.timeout(4000) });
      if (!response.ok) throw new Error(`History endpoint returned ${response.status}`);
      const body = await response.json();
      const points = Array.isArray(body) ? body : body.history || body.items || body.data || [];
      return Array.isArray(points) ? points.map((point) => ({ ...point, source: 'LIVE' })) : [];
    },
  };
}
