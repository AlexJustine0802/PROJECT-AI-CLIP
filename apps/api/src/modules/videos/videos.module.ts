import {
  Body,
  Controller,
  Get,
  Inject,
  Injectable,
  Module,
  Param,
  Post,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString } from 'class-validator';
import { randomUUID } from 'node:crypto';
import type { StorageProvider } from '@clipforge/core';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { STORAGE_PROVIDER } from '../../infra/storage/storage.tokens';
import { JobsModule, JobsService } from '../jobs/jobs.module';

class UploadUrlDto {
  @IsString() projectId!: string;
  @IsString() filename!: string;
  @IsString() contentType!: string;
}

class ProcessDto {
  @IsOptional() @IsString() editingStyle?: string;
  @IsOptional() @IsBoolean() generateSeries?: boolean;
}

@Injectable()
export class VideosService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jobs: JobsService,
    @Inject(STORAGE_PROVIDER) private readonly storage: StorageProvider,
  ) {}

  /** Reserve a Video row + presigned upload URL. Clients upload directly to storage. */
  async createUploadUrl(dto: UploadUrlDto) {
    const key = `videos/${dto.projectId}/${randomUUID()}-${dto.filename}`;
    const video = await this.prisma.video.create({
      data: {
        projectId: dto.projectId,
        title: dto.filename,
        status: 'UPLOADING',
        storageProvider: (this.storage.type.toUpperCase() as any) ?? 'LOCAL',
        storageKey: key,
        originalName: dto.filename,
        mimeType: dto.contentType,
      },
    });
    const uploadUrl = await this.storage.presignUpload(key, { contentType: dto.contentType });
    return { videoId: video.id, uploadUrl, storageKey: key };
  }

  get(id: string) {
    return this.prisma.video.findUnique({
      where: { id },
      include: { clips: true, transcript: true, timeline: true },
    });
  }

  /** Mark uploaded and kick off the pipeline. */
  async process(id: string, dto: ProcessDto) {
    const video = await this.prisma.video.findUniqueOrThrow({
      where: { id },
      include: { project: { include: { team: true } } },
    });
    await this.prisma.video.update({ where: { id }, data: { status: 'UPLOADED' } });
    return this.jobs.enqueue({
      videoId: id,
      teamId: video.project.teamId,
      storageKey: video.storageKey,
      editingStyle: dto.editingStyle ?? video.project.editingStyle,
      generateSeries: dto.generateSeries ?? true,
    });
  }
}

@ApiTags('videos')
@Controller({ path: 'videos', version: '1' })
export class VideosController {
  constructor(private readonly videos: VideosService) {}

  @Post('upload-url')
  createUploadUrl(@Body() dto: UploadUrlDto) {
    return this.videos.createUploadUrl(dto);
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.videos.get(id);
  }

  @Post(':id/process')
  process(@Param('id') id: string, @Body() dto: ProcessDto) {
    return this.videos.process(id, dto);
  }
}

@Module({
  imports: [JobsModule],
  providers: [VideosService],
  controllers: [VideosController],
  exports: [VideosService],
})
export class VideosModule {}
