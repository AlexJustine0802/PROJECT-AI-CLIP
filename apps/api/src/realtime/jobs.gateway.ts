import {
  OnGatewayConnection,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import type { JobEvent } from '@clipforge/types';

/**
 * Realtime job updates (#14) — replaces polling. Clients join a room per jobId and receive
 * progress / live logs / current stage / ETA / completion events pushed by the pipeline runner.
 * Works identically whether jobs run in-process (Node) or via BullMQ workers.
 */
@WebSocketGateway({ namespace: '/jobs', cors: { origin: true } })
export class JobsGateway implements OnGatewayConnection {
  @WebSocketServer() server!: Server;

  handleConnection(_client: Socket): void {
    // Socket auth via handshake token can be enforced here; omitted for brevity.
  }

  @SubscribeMessage('subscribe')
  subscribe(@MessageBody() data: { jobId: string }, @ConnectedSocket() client: Socket): void {
    client.join(`job:${data.jobId}`);
  }

  /** Emit a typed event to everyone watching a job. */
  emit(jobId: string, event: JobEvent): void {
    this.server?.to(`job:${jobId}`).emit('job', event);
  }
}
