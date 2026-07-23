import {
  Body,
  Controller,
  Get,
  Injectable,
  Module,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { PrismaService } from '../../infra/prisma/prisma.service';

class UpdateClipDto {
  @IsOptional() @IsString() reasoning?: string;
  @IsOptional() @IsString() title?: string;
}

class ExportClipDto {
  @IsString() presetKey!: string;
}

@Injectable()
export class ClipsService {
  constructor(private readonly prisma: PrismaService) {}

  listForVideo(videoId: string) {
    return this.prisma.clip.findMany({
      where: { videoId },
      orderBy: [{ seriesPart: 'asc' }, { qualityScore: 'desc' }],
      include: { subtitles: true, series: true },
    });
  }

  /** Edit the AI reasoning (differentiator: reasoning is user-editable). */
  async update(id: string, dto: UpdateClipDto) {
    return this.prisma.clip.update({
      where: { id },
      data: {
        ...(dto.reasoning !== undefined ? { reasoning: dto.reasoning, reasoningEdited: true } : {}),
        ...(dto.title !== undefined ? { title: dto.title } : {}),
      },
    });
  }

  async export(clipId: string, dto: ExportClipDto) {
    const preset = await this.prisma.exportPreset.findUniqueOrThrow({ where: { key: dto.presetKey } });
    const target = await this.prisma.exportTarget.create({
      data: {
        clipId,
        platform: preset.platform,
        presetKey: preset.key,
        aspectRatio: preset.aspectRatio,
        resolution: preset.resolution,
        status: 'QUEUED',
      },
    });
    // An export queue worker (same pattern as JobsProcessor) renders via the AI service.
    return { exportId: target.id, status: target.status };
  }
}

@ApiTags('clips')
@Controller({ path: 'clips', version: '1' })
export class ClipsController {
  constructor(private readonly clips: ClipsService) {}

  @Get()
  list(@Query('videoId') videoId: string) {
    return this.clips.listForVideo(videoId);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateClipDto) {
    return this.clips.update(id, dto);
  }

  @Post(':id/export')
  export(@Param('id') id: string, @Body() dto: ExportClipDto) {
    return this.clips.export(id, dto);
  }
}

@Module({
  providers: [ClipsService],
  controllers: [ClipsController],
  exports: [ClipsService],
})
export class ClipsModule {}
