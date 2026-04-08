import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { LeagueRewardDocument, LeagueRewardSchema } from './infrastructure/persistence/schemas/league-reward.schema.js';
import { UserRewardClaimDocument, UserRewardClaimSchema } from './infrastructure/persistence/schemas/user-reward-claim.schema.js';
import { RewardsController, AdminRewardsController } from './presentation/controllers/rewards.controller.js';
import { AuthModule } from '../auth/auth.module.js';
import { UsersModule } from '../users/users.module.js';
import { SeasonsModule } from '../seasons/seasons.module.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: LeagueRewardDocument.name, schema: LeagueRewardSchema },
      { name: UserRewardClaimDocument.name, schema: UserRewardClaimSchema },
    ]),
    AuthModule,
    UsersModule,
    SeasonsModule,
  ],
  controllers: [RewardsController, AdminRewardsController],
})
export class RewardsModule {}
