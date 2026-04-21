import type { SseEvent } from "../types";

// Encode an SseEvent for the Hono SSEStreamingApi.
export function encodeSse(evt: SseEvent): { event: string; data: string; id?: string } {
  return {
    event: evt.event,
    data: JSON.stringify(evt.data),
  };
}
