import { Injectable } from '@nestjs/common';
import { Types } from 'mongoose';
import { UserRepository } from '../../infrastructure/persistence/repositories/user.repository.js';
import { TribeRepository } from '../../../tribes/infrastructure/persistence/repositories/tribe.repository.js';
import { SeasonRepository } from '../../../seasons/infrastructure/persistence/repositories/season.repository.js';

/**
 * Caso de uso: Obtener perfil del usuario actual.
 * Incluye contexto de tribu (tribeName, activeTier, activeMultiplier) para que
 * el frontend no necesite hacer llamadas adicionales para pintar el dashboard.
 */
@Injectable()
export class GetMeUseCase {
  constructor(
    private readonly userRepo: UserRepository,
    private readonly tribeRepo: TribeRepository,
    private readonly seasonRepo: SeasonRepository,
  ) {}

  async execute(tokaUserId: string) {
    const user = await this.userRepo.findByTokaUserIdOrThrow(tokaUserId);

    // Buscar la temporada activa y la membresía de tribu del usuario
    let tribeContext: {
      tribeId: string;
      tribeName: string;
      activeTier: string;
      activeMultiplier: number;
      memberRole: string;
    } | null = null;

    try {
      const season = await this.seasonRepo.findActiveOrThrow();
      const member = await this.tribeRepo.findMemberByUserAndSeason(
        user._id as Types.ObjectId,
        season._id as Types.ObjectId,
      );

      if (member) {
        const tribe = await this.tribeRepo.findByIdOrThrow((member.tribeId as Types.ObjectId).toString());
        tribeContext = {
          tribeId: tribe._id.toString(),
          tribeName: tribe.name,
          activeTier: member.activeTier,
          activeMultiplier: member.activeMultiplier,
          memberRole: member.role,
        };
      }
    } catch {
      // Si no hay temporada activa, devolvemos perfil sin contexto de tribu
      tribeContext = null;
    }

    return {
      id: user._id,
      tokaUserId: user.tokaUserId,
      username: user.username,
      avatarUrl: user.avatarUrl,
      totalPoints: user.totalPoints,
      currentDivision: user.currentDivision,
      currentStreak: user.currentStreak,
      lastPlayedDate: user.lastPlayedDate,
      leagueMembership: user.leagueMembership,
      tribe: tribeContext,
    };
  }
}
