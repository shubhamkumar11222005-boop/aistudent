import { useState, useEffect, useCallback } from 'react';
import { checkBackendHealth } from '../services/api';

export function useHealthCheck(pollIntervalMs = 15000) {
  const [health, setHealth] = useState({
    loading: true,
    success: false,
    status: "checking",
    application: "StudyAI",
    latencyMs: 0,
    error: null,
    lastChecked: null,
  });

  const refresh = useCallback(async () => {
    setHealth((prev) => ({ ...prev, loading: true, error: null }));
    const result = await checkBackendHealth();
    setHealth({
      loading: false,
      success: result.success,
      status: result.status,
      application: result.application,
      latencyMs: result.latencyMs,
      error: result.error || null,
      lastChecked: new Date(),
    });
  }, []);

  useEffect(() => {
    refresh();

    if (pollIntervalMs > 0) {
      const interval = setInterval(refresh, pollIntervalMs);
      return () => clearInterval(interval);
    }
  }, [refresh, pollIntervalMs]);

  return { ...health, refresh };
}
