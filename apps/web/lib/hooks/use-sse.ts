'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

type SSEEvent = 'connected' | 'file:created' | 'file:updated' | 'file:deleted';

interface SSEMessage {
  event: SSEEvent;
  data: any;
}

interface UseSSEOptions {
  onFileChanged?: () => void;
  onConnected?: () => void;
  onDisconnected?: () => void;
  enabled?: boolean;
}

export function useSSE(options: UseSSEOptions = {}) {
  const { onFileChanged, onConnected, onDisconnected, enabled = true } = options;
  const [isConnected, setIsConnected] = useState(false);
  const [lastEvent, setLastEvent] = useState<SSEEvent | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimerRef = useRef<NodeJS.Timeout | null>(null);

  const connect = useCallback(() => {
    if (!enabled) return;

    const eventSource = new EventSource('/api/events');

    eventSource.onopen = () => {
      setIsConnected(true);
      onConnected?.();
    };

    eventSource.onmessage = (event) => {
      try {
        const message: SSEMessage = JSON.parse(event.data);
        setLastEvent(message.event);

        if (message.event === 'connected') {
          onConnected?.();
        } else if (
          message.event === 'file:created' ||
          message.event === 'file:updated' ||
          message.event === 'file:deleted'
        ) {
          onFileChanged?.();
        }
      } catch {
        // Ignore parse errors
      }
    };

    eventSource.onerror = () => {
      setIsConnected(false);
      onDisconnected?.();
      eventSource.close();

      reconnectTimerRef.current = setTimeout(() => {
        connect();
      }, 5000);
    };

    eventSourceRef.current = eventSource;
  }, [enabled, onFileChanged, onConnected, onDisconnected]);

  useEffect(() => {
    connect();

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
      }
    };
  }, [connect]);

  return { isConnected, lastEvent };
}
