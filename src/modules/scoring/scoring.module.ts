import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { GameSessionDocument, GameSessionSchema } from './infrastructure/persistence/schemas/game-session.schema.js';
import { ChallengeDocument, ChallengeSchema } from '../challenges/infrastructure/persistence/schemas/challenge.schema.js';
import { GameDocument, GameSchema } from '../games/infrastructure/persistence/schemas/game.schema.js';
import { GameSessionsController } from './presentation/controllers/game-sessions.controller.js';
import { AuthModule } from '../auth/auth.module.js';
import { UsersModule } from '../users/users.module.js';
import { TribesModule } from '../tribes/tribes.module.js';
import { SeasonsModule } from '../seasons/seasons.module.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: GameSessionDocument.name, schema: GameSessionSchema },
      { name: ChallengeDocument.name, schema: ChallengeSchema },
      { name: GameDocument.name, schema: GameSchema },
    ]),
    AuthModule,
    UsersModule,
    TribesModule,
    SeasonsModule,
  ],
  controllers: [GameSessionsController],
  exports: [MongooseModule],
})
export class ScoringModule {}

