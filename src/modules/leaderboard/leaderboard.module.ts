import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { LeaderboardSnapshotDocument, LeaderboardSnapshotSchema } from './infrastructure/persistence/schemas/leaderboard-snapshot.schema.js';
import { LeaderboardController } from './presentation/controllers/leaderboard.controller.js';
import { AuthModule } from '../auth/auth.module.js';
import { SeasonsModule } from '../seasons/seasons.module.js';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: LeaderboardSnapshotDocument.name, schema: LeaderboardSnapshotSchema }]),
    AuthModule,
    SeasonsModule,
  ],
  controllers: [LeaderboardController],
  exports: [MongooseModule],
})
export class LeaderboardModule {}
