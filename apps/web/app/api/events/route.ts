import { NextRequest, NextResponse } from 'next/server';
import { getUserId } from '@/lib/api-middleware';
import { subscribe } from '@/lib/event-stream';

export async function GET(request: NextRequest) {
  const userId = await getUserId(request);

  if (!userId) {
    return new Response('Unauthorized', { status: 401 });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      const unsubscribe = subscribe((message) => {
        if (controller.desiredSize == null || controller.desiredSize <= 0) {
          unsubscribe();
          return;
        }
        controller.enqueue(encoder.encode(message));
      });

      setInterval(() => {
        if (controller.desiredSize == null || controller.desiredSize <= 0) {
          unsubscribe();
          return;
        }
        controller.enqueue(encoder.encode(': heartbeat\n\n'));
      }, 30000);

      controller.enqueue(encoder.encode(`data: {"event":"connected","data":{"userId":"${userId}"}}\n\n`));
    },
    cancel() {
      console.log('SSE connection closed');
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
