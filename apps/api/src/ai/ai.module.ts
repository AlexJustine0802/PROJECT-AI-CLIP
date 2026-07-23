import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AI_PIPELINE } from './ai.port';
import { NodeAiService } from './node-ai.service';
import { HttpAiService } from './http-ai.service';

/**
 * Selects the AI pipeline driver by config (#interface-first). Default `node` runs entirely
 * in-process — no Python, ffmpeg, or Docker required. `http` delegates to the FastAPI service.
 */
@Global()
@Module({
  providers: [
    NodeAiService,
    HttpAiService,
    {
      provide: AI_PIPELINE,
      inject: [ConfigService, NodeAiService, HttpAiService],
      useFactory: (config: ConfigService, node: NodeAiService, http: HttpAiService) =>
        config.get<string>('ai.driver') === 'http' ? http : node,
    },
  ],
  exports: [AI_PIPELINE],
})
export class AiModule {}
