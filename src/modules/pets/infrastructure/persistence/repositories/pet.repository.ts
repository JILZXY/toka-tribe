import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { PetDocument } from '../schemas/pet.schema.js';
import { PetItemDocument } from '../schemas/pet-item.schema.js';
import { AppException } from '../../../../../shared/application/exceptions/app-exception.js';
import { ErrorCodes } from '../../../../../config/constants/error-codes.js';

@Injectable()
export class PetRepository {
  constructor(
    @InjectModel(PetDocument.name)
    private readonly petModel: Model<PetDocument>,
    @InjectModel(PetItemDocument.name)
    private readonly petItemModel: Model<PetItemDocument>,
  ) {}

  async findPetByUserId(userId: Types.ObjectId): Promise<PetDocument | null> {
    return this.petModel.findOne({ userId }).exec();
  }

  async findPetByUserIdOrThrow(userId: Types.ObjectId): Promise<PetDocument> {
    const pet = await this.petModel.findOne({ userId }).exec();
    if (!pet) {
      throw AppException.notFound(ErrorCodes.PET_NOT_FOUND, 'No se encontró la mascota.');
    }
    return pet;
  }

  async createPet(userId: Types.ObjectId, name: string): Promise<PetDocument> {
    const existing = await this.petModel.findOne({ userId }).exec();
    if (existing) {
      throw AppException.conflict(ErrorCodes.PET_ALREADY_EXISTS, 'El usuario ya tiene una mascota.');
    }
    return this.petModel.create({ userId, name });
  }

  async findAvailableItems(): Promise<PetItemDocument[]> {
    return this.petItemModel.find({ isAvailable: true }).sort({ pointCost: 1 }).exec();
  }

  async findItemByIdOrThrow(itemId: string): Promise<PetItemDocument> {
    const item = await this.petItemModel.findOne({ itemId }).exec();
    if (!item) {
      throw AppException.notFound(ErrorCodes.PET_ITEM_NOT_FOUND, 'Artículo no encontrado.');
    }
    return item;
  }

  async unlockItem(pet: PetDocument, itemObjectId: Types.ObjectId): Promise<PetDocument> {
    return this.petModel
      .findByIdAndUpdate(
        pet._id,
        { $addToSet: { unlockedItems: itemObjectId } },
        { new: true },
      )
      .exec() as Promise<PetDocument>;
  }

  async equipItem(
    pet: PetDocument,
    slot: string,
    itemObjectId: Types.ObjectId | null,
  ): Promise<PetDocument> {
    return this.petModel
      .findByIdAndUpdate(
        pet._id,
        { $set: { [`equippedItems.${slot}`]: itemObjectId } },
        { new: true },
      )
      .exec() as Promise<PetDocument>;
  }
}
