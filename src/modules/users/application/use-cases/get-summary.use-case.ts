import { Injectable } from '@nestjs/common';
import { UserRepository } from '../../infrastructure/persistence/repositories/user.repository.js';
import { TribeRepository } from '../../../tribes/infrastructure/persistence/repositories/tribe.repository.js';
import { SeasonRepository } from '../../../seasons/infrastructure/persistence/repositories/season.repository.js';
import { Types } from 'mongoose';

@Injectable()
export class GetUserSummaryUseCase {
  constructor(
    private readonly userRepo: UserRepository,
    private readonly tribeRepo: TribeRepository,
    private readonly seasonRepo: SeasonRepository,
  ) {}

  async execute(tokaUserId: string) {
    const user = await this.userRepo.findByTokaUserIdOrThrow(tokaUserId);
    const season = await this.seasonRepo.findActiveOrThrow();

    const member = await this.tribeRepo.findMemberByUserAndSeason(
      new Types.ObjectId(user._id as any),
      season._id as any,
    );

    let tribeResult: null | {
      id: any;
      name: string;
    } = null;

    if (member) {
      const tribe = await this.tribeRepo.findByIdOrThrow((member.tribeId as Types.ObjectId).toString());
      tribeResult = { id: tribe._id, name: tribe.name };
    }

    return {
      user: {
        id: user._id,
        username: user.username,
        avatarUrl: user.avatarUrl,
        leagueMembership: user.leagueMembership,
      },
      tribe: member
        ? {
            id: tribeResult!.id,
            name: tribeResult!.name,
            tier: member.activeTier,
            memberRole: member.role,
          }
        : null,
      points: {
        totalPoints: user.totalPoints,
        seasonPoints: member ? member.pointsContributed : 0,
        currentStreak: user.currentStreak,
        maxStreak: (user as any).maxStreak ?? null,
      },
      season: {
        id: season._id,
        name: season.name,
        status: season.status,
        endsAt: season.endDate,
        targetPoints: (season as any).targetPoints ?? 50000,
        currentPoints: user.totalPoints,
      },
    };
  }
}
