import { Field, ID, Float, Int, ObjectType, Query, Resolver, Args, Module } from '@nestjs/graphql';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { Public } from '../../common/decorators';

@ObjectType()
class ClipType {
  @Field(() => ID) id!: string;
  @Field() title!: string;
  @Field(() => Float) startSec!: number;
  @Field(() => Float) endSec!: number;
  @Field(() => Float, { nullable: true }) qualityScore?: number | null;
  @Field(() => Float, { nullable: true }) viralityScore?: number | null;
  @Field({ nullable: true }) reasoning?: string | null;
  @Field(() => Int, { nullable: true }) seriesPart?: number | null;
}

@ObjectType()
class ProjectType {
  @Field(() => ID) id!: string;
  @Field() name!: string;
  @Field({ nullable: true }) description?: string | null;
  @Field() editingStyle!: string;
}

/** GraphQL surface over the same persistence layer used by REST — no logic duplication. */
@Resolver()
class ClipforgeResolver {
  constructor(private readonly prisma: PrismaService) {}

  @Public()
  @Query(() => [ProjectType])
  projects(@Args('teamId') teamId: string) {
    return this.prisma.project.findMany({ where: { teamId } });
  }

  @Public()
  @Query(() => [ClipType])
  clips(@Args('videoId') videoId: string) {
    return this.prisma.clip.findMany({
      where: { videoId },
      orderBy: [{ seriesPart: 'asc' }, { qualityScore: 'desc' }],
    });
  }
}

@Module({
  providers: [ClipforgeResolver],
})
export class GraphqlFeatureModule {}
