import { Injectable } from '@nestjs/common';
import { Types } from 'mongoose';
import { PetRepository } from '../../infrastructure/persistence/repositories/pet.repository.js';
import { UserRepository } from '../../../users/infrastructure/persistence/repositories/user.repository.js';
import { AppException } from '../../../../shared/application/exceptions/app-exception.js';
import { ErrorCodes } from '../../../../config/constants/error-codes.js';

@Injectable()
export class EquipPetItemUseCase {
  constructor(
    private readonly petRepo: PetRepository,
    private readonly userRepo: UserRepository,
  ) {}

  async execute(tokaUserId: string, itemId: string) {
    const user = await this.userRepo.findByTokaUserIdOrThrow(tokaUserId);
    const pet = await this.petRepo.findPetByUserIdOrThrow(user._id as Types.ObjectId);
    const item = await this.petRepo.findItemByIdOrThrow(itemId);

    // Validar que el item esté desbloqueado
    const isUnlocked = pet.unlockedItems.some(
      (id) => id.toString() === (item._id as Types.ObjectId).toString(),
    );
    if (!isUnlocked) {
      throw new AppException(
        ErrorCodes.PET_ITEM_NOT_OWNED,
        'No puedes equipar un artículo que no has desbloqueado.',
      );
    }

    const updated = await this.petRepo.equipItem(pet, item.slot, item._id as Types.ObjectId);
    return { equipped: true, slot: item.slot, itemId, equippedItems: updated.equippedItems };
  }
}
