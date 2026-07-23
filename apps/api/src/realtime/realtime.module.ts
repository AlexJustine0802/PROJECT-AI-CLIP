import { Global, Module } from '@nestjs/common';
import { JobsGateway } from './jobs.gateway';

/** Global realtime module so the queue runner and the jobs API share one gateway instance. */
@Global()
@Module({
  providers: [JobsGateway],
  exports: [JobsGateway],
})
export class RealtimeModule {}
