import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CqrsModule } from '@nestjs/cqrs';
import { LeaderboardSnapshotDocument, LeaderboardSnapshotSchema } from './infrastructure/persistence/schemas/leaderboard-snapshot.schema.js';
import { LeaderboardController } from './presentation/controllers/leaderboard.controller.js';
import { GetTopLeaderboardHandler } from './application/queries/get-top-leaderboard.handler.js';
import { AuthModule } from '../auth/auth.module.js';
import { SeasonsModule } from '../seasons/seasons.module.js';

@Module({
  imports: [
    CqrsModule,
    MongooseModule.forFeature([{ name: LeaderboardSnapshotDocument.name, schema: LeaderboardSnapshotSchema }]),
    AuthModule,
    SeasonsModule,
  ],
  controllers: [LeaderboardController],
  providers: [GetTopLeaderboardHandler],
  exports: [MongooseModule],
})
export class LeaderboardModule {}
