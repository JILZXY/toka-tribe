import { Injectable } from '@nestjs/common';
import { UserRepository } from '../../infrastructure/persistence/repositories/user.repository.js';

/**
 * Caso de uso: Obtener perfil del usuario actual.
 */
@Injectable()
export class GetMeUseCase {
  constructor(private readonly userRepo: UserRepository) {}

  async execute(tokaUserId: string) {
    const user = await this.userRepo.findByTokaUserIdOrThrow(tokaUserId);
    return {
      id: user._id,
      tokaUserId: user.tokaUserId,
      username: user.username,
      avatarUrl: user.avatarUrl,
      totalPoints: user.totalPoints,
      currentDivision: user.currentDivision,
      currentStreak: user.currentStreak ?? 0,
      lastPlayedDate: user.lastPlayedDate,
      leagueMembership: user.leagueMembership,
    };
  }
}
