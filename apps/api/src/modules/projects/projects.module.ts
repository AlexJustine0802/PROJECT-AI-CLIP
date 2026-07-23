import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { Module, Injectable } from '@nestjs/common';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { CurrentUser, type AuthUser } from '../../common/decorators';

class CreateProjectDto {
  @IsString() teamId!: string;
  @IsString() name!: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() editingStyle?: string;
}

@Injectable()
class ProjectsService {
  constructor(private readonly prisma: PrismaService) {}

  list(teamId: string) {
    return this.prisma.project.findMany({
      where: { teamId },
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { videos: true } } },
    });
  }

  create(dto: CreateProjectDto) {
    return this.prisma.project.create({
      data: {
        teamId: dto.teamId,
        name: dto.name,
        description: dto.description,
        editingStyle: (dto.editingStyle?.toUpperCase() as any) ?? 'AUTO',
      },
    });
  }

  get(id: string) {
    return this.prisma.project.findUnique({ where: { id }, include: { videos: true } });
  }
}

@ApiTags('projects')
@Controller({ path: 'projects', version: '1' })
class ProjectsController {
  constructor(private readonly projects: ProjectsService) {}

  @Get()
  list(@Query('teamId') teamId: string) {
    return this.projects.list(teamId);
  }

  @Post()
  create(@Body() dto: CreateProjectDto, @CurrentUser() _user: AuthUser) {
    return this.projects.create(dto);
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.projects.get(id);
  }
}

@Module({
  providers: [ProjectsService],
  controllers: [ProjectsController],
  exports: [ProjectsService],
})
export class ProjectsModule {}
