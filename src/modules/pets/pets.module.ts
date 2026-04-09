import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PetDocument, PetSchema } from './infrastructure/persistence/schemas/pet.schema.js';
import { PetItemDocument, PetItemSchema } from './infrastructure/persistence/schemas/pet-item.schema.js';
import { PetRepository } from './infrastructure/persistence/repositories/pet.repository.js';
import { CreatePetUseCase } from './application/use-cases/create-pet.use-case.js';
import { GetMyPetUseCase } from './application/use-cases/get-my-pet.use-case.js';
import { UnlockPetItemUseCase } from './application/use-cases/unlock-pet-item.use-case.js';
import { EquipPetItemUseCase } from './application/use-cases/equip-pet-item.use-case.js';
import { PetsController } from './presentation/controllers/pets.controller.js';
import { SeedPetItemsTask } from '../../tasks/seed-pet-items.task.js';
import { AuthModule } from '../auth/auth.module.js';
import { UsersModule } from '../users/users.module.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: PetDocument.name, schema: PetSchema },
      { name: PetItemDocument.name, schema: PetItemSchema },
    ]),
    AuthModule,
    UsersModule,
  ],
  controllers: [PetsController],
  providers: [PetRepository, CreatePetUseCase, GetMyPetUseCase, UnlockPetItemUseCase, EquipPetItemUseCase, SeedPetItemsTask],
  exports: [PetRepository],
})
export class PetsModule {}
