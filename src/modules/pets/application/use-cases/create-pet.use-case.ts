import { Injectable } from '@nestjs/common';
import { Types } from 'mongoose';
import { PetRepository } from '../../infrastructure/persistence/repositories/pet.repository.js';
import { UserRepository } from '../../../users/infrastructure/persistence/repositories/user.repository.js';

@Injectable()
export class CreatePetUseCase {
  constructor(
    private readonly petRepo: PetRepository,
    private readonly userRepo: UserRepository,
  ) {}

  async execute(tokaUserId: string, name: string) {
    const user = await this.userRepo.findByTokaUserIdOrThrow(tokaUserId);
    const pet = await this.petRepo.createPet(user._id as Types.ObjectId, name);
    return { id: pet._id, name: pet.name, userId: pet.userId };
  }
}
