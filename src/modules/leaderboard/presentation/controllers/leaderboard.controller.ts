import { Controller, Get, Param, UseGuards, UseInterceptors } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { QueryBus } from '@nestjs/cqrs';
import { CacheInterceptor, CacheTTL } from '@nestjs/cache-manager';
import { JwtAuthGuard } from '../../../auth/infrastructure/guards/jwt-auth.guard.js';
import { LeaderboardSnapshotDocument } from '../../infrastructure/persistence/schemas/leaderboard-snapshot.schema.js';
import { SeasonRepository } from '../../../seasons/infrastructure/persistence/repositories/season.repository.js';
import { GetTopLeaderboardQuery } from '../../application/queries/get-top-leaderboard.query.js';

@ApiTags('leaderboard')
@ApiBearerAuth('jwt')
@UseGuards(JwtAuthGuard)
@Controller('leaderboard')
export class LeaderboardController {
  constructor(
    @InjectModel(LeaderboardSnapshotDocument.name) private readonly snapshotModel: Model<LeaderboardSnapshotDocument>,
    private readonly seasonRepo: SeasonRepository,
    private readonly queryBus: QueryBus,
  ) {}

  @Get('divisions/:division')
  @ApiOperation({ summary: 'Leaderboard por división (Cacheado, CQRS)' })
  @ApiParam({ name: 'division', description: 'División (ej. BRONCE, ORO, PLATA) — insensible a mayúsculas', type: String })
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(parseInt(process.env.LEADERBOARD_CACHE_TTL_SECONDS as string, 10) * 1000)
  async byDivision(@Param('division') division: string) {
    const season = await this.seasonRepo.findActiveOrThrow();
    // Normalizar para que coincida con el Enum (ej: "bronce" -> "Bronce", "BRONCE" -> "Bronce")
    const normalizedDivision = division.charAt(0).toUpperCase() + division.slice(1).toLowerCase();
    return this.queryBus.execute(new GetTopLeaderboardQuery(normalizedDivision, season._id.toString(), 50));
  }

  @Get('current')
  @ApiOperation({ summary: 'Leaderboard actual completo (Cacheado)' })
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(parseInt(process.env.LEADERBOARD_CACHE_TTL_SECONDS as string, 10) * 1000)
  async current() {
    const season = await this.seasonRepo.findActiveOrThrow();
    return this.snapshotModel.find({ seasonId: season._id }).sort({ division: 1, rank: 1 }).lean().exec();
  }

  @Get('tribes/:tribeId/history')
  @ApiOperation({ summary: 'Historial de ranking de una tribu' })
  async tribeHistory(@Param('tribeId') tribeId: string) {
    return this.snapshotModel
      .find({ tribeId: new Types.ObjectId(tribeId) })
      .sort({ snapshotAt: -1 })
      .limit(20)
      .lean()
      .exec();
  }
}
