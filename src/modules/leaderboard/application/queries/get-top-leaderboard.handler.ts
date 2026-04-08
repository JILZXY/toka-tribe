import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { GetTopLeaderboardQuery } from './get-top-leaderboard.query.js';
import { LeaderboardSnapshotDocument } from '../../infrastructure/persistence/schemas/leaderboard-snapshot.schema.js';

@QueryHandler(GetTopLeaderboardQuery)
export class GetTopLeaderboardHandler implements IQueryHandler<GetTopLeaderboardQuery> {
  constructor(
    @InjectModel(LeaderboardSnapshotDocument.name)
    private readonly snapshotModel: Model<LeaderboardSnapshotDocument>,
  ) {}

  async execute(query: GetTopLeaderboardQuery) {
    const { division, seasonId, limit } = query;
    return this.snapshotModel
      .find({ seasonId: new Types.ObjectId(seasonId), division })
      .sort({ rank: 1 })
      .limit(limit)
      .lean() // Fundamental: Retorna JSON puro en vez de documentos Mongoose (más rápido)
      .exec();
  }
}
