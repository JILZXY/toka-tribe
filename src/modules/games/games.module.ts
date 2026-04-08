import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { GameDocument, GameSchema } from './infrastructure/persistence/schemas/game.schema.js';
import { GamesController, AdminGamesController } from './presentation/controllers/games.controller.js';
import { AuthModule } from '../auth/auth.module.js';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: GameDocument.name, schema: GameSchema }]),
    AuthModule,
  ],
  controllers: [GamesController, AdminGamesController],
  exports: [MongooseModule],
})
export class GamesModule {}
