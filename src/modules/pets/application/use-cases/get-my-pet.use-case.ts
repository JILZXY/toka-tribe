import { Injectable } from '@nestjs/common';
import { Types } from 'mongoose';
import { PetRepository } from '../../infrastructure/persistence/repositories/pet.repository.js';
import { UserRepository } from '../../../users/infrastructure/persistence/repositories/user.repository.js';

@Injectable()
export class GetMyPetUseCase {
  constructor(
    private readonly petRepo: PetRepository,
    private readonly userRepo: UserRepository,
  ) {}

  async execute(tokaUserId: string) {
    const user = await this.userRepo.findByTokaUserIdOrThrow(tokaUserId);
    const pet = await this.petRepo.findPetByUserIdOrThrow(user._id as Types.ObjectId);
    return {
      id: pet._id,
      name: pet.name,
      unlockedItems: pet.unlockedItems,
      equippedItems: pet.equippedItems,
    };
  }
}
