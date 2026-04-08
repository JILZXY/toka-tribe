import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { JwtAuthGuard } from '../../../auth/infrastructure/guards/jwt-auth.guard.js';
import { LeaderboardSnapshotDocument } from '../../infrastructure/persistence/schemas/leaderboard-snapshot.schema.js';
import { SeasonRepository } from '../../../seasons/infrastructure/persistence/repositories/season.repository.js';

@ApiTags('leaderboard')
@ApiBearerAuth('jwt')
@UseGuards(JwtAuthGuard)
@Controller('leaderboard')
export class LeaderboardController {
  constructor(
    @InjectModel(LeaderboardSnapshotDocument.name) private readonly snapshotModel: Model<LeaderboardSnapshotDocument>,
    private readonly seasonRepo: SeasonRepository,
  ) {}

  @Get('divisions/:division')
  @ApiOperation({ summary: 'Leaderboard por división' })
  async byDivision(@Param('division') division: string) {
    const season = await this.seasonRepo.findActiveOrThrow();
    return this.snapshotModel
      .find({ seasonId: season._id, division })
      .sort({ rank: 1 })
      .limit(50)
      .exec();
  }

  @Get('current')
  @ApiOperation({ summary: 'Leaderboard actual completo' })
  async current() {
    const season = await this.seasonRepo.findActiveOrThrow();
    return this.snapshotModel.find({ seasonId: season._id }).sort({ division: 1, rank: 1 }).exec();
  }

  @Get('tribes/:tribeId/history')
  @ApiOperation({ summary: 'Historial de ranking de una tribu' })
  async tribeHistory(@Param('tribeId') tribeId: string) {
    return this.snapshotModel
      .find({ tribeId: new Types.ObjectId(tribeId) })
      .sort({ snapshotAt: -1 })
      .limit(20)
      .exec();
  }
}
