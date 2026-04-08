import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ChallengeDocument, ChallengeSchema } from './infrastructure/persistence/schemas/challenge.schema.js';
import { ChallengesController, AdminChallengesController } from './presentation/controllers/challenges.controller.js';
import { AuthModule } from '../auth/auth.module.js';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: ChallengeDocument.name, schema: ChallengeSchema }]),
    AuthModule,
  ],
  controllers: [ChallengesController, AdminChallengesController],
  exports: [MongooseModule],
})
export class ChallengesModule {}
