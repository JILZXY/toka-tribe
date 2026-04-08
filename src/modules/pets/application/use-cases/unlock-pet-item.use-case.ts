import { Injectable } from '@nestjs/common';
import { Types } from 'mongoose';
import { PetRepository } from '../../infrastructure/persistence/repositories/pet.repository.js';
import { UserRepository } from '../../../users/infrastructure/persistence/repositories/user.repository.js';
import { AppException } from '../../../../shared/application/exceptions/app-exception.js';
import { ErrorCodes } from '../../../../config/constants/error-codes.js';

@Injectable()
export class UnlockPetItemUseCase {
  constructor(
    private readonly petRepo: PetRepository,
    private readonly userRepo: UserRepository,
  ) {}

  /**
   * Desbloquea un artículo para la mascota del usuario.
   * Idempotente: si ya está desbloqueado, no produce error.
   * Valida puntos suficientes y descuenta.
   */
  async execute(tokaUserId: string, itemId: string) {
    const user = await this.userRepo.findByTokaUserIdOrThrow(tokaUserId);
    const pet = await this.petRepo.findPetByUserIdOrThrow(user._id as Types.ObjectId);
    const item = await this.petRepo.findItemByIdOrThrow(itemId);

    // Idempotencia: si ya lo tiene, retornar sin error
    const alreadyUnlocked = pet.unlockedItems.some(
      (id) => id.toString() === (item._id as Types.ObjectId).toString(),
    );
    if (alreadyUnlocked) {
      return { unlocked: true, itemId, alreadyOwned: true };
    }

    // Validar puntos suficientes
    if (user.totalPoints < item.pointCost) {
      throw new AppException(
        ErrorCodes.PET_INSUFFICIENT_POINTS,
        `Puntos insuficientes. Necesitas ${item.pointCost} puntos.`,
      );
    }

    // Descontar puntos y desbloquear
    user.totalPoints -= item.pointCost;
    await user.save();
    await this.petRepo.unlockItem(pet, item._id as Types.ObjectId);

    return { unlocked: true, itemId, pointsRemaining: user.totalPoints };
  }
}
