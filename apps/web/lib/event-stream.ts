type EventCallback = (message: string) => void;

const subscribers = new Map<EventCallback, boolean>();

export function broadcast(event: string, data: unknown) {
  const message = JSON.stringify({ event, data });
  const envelope = `data: ${message}\n\n`;

  for (const callback of subscribers.keys()) {
    try {
      callback(envelope);
    } catch {
      subscribers.delete(callback);
    }
  }
}

export function subscribe(callback: EventCallback) {
  subscribers.set(callback, true);
  return () => subscribers.delete(callback);
}
