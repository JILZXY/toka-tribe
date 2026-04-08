import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UserDocument } from '../schemas/user.schema.js';
import { AppException } from '../../../../../shared/application/exceptions/app-exception.js';
import { ErrorCodes } from '../../../../../config/constants/error-codes.js';

@Injectable()
export class UserRepository {
  constructor(
    @InjectModel(UserDocument.name)
    private readonly userModel: Model<UserDocument>,
  ) {}

  async findByTokaUserId(tokaUserId: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ tokaUserId }).exec();
  }

  async findByIdOrThrow(id: string): Promise<UserDocument> {
    const user = await this.userModel.findById(id).exec();
    if (!user) {
      throw AppException.notFound(
        ErrorCodes.USER_NOT_FOUND,
        'Usuario no encontrado.',
      );
    }
    return user;
  }

  async findByTokaUserIdOrThrow(tokaUserId: string): Promise<UserDocument> {
    const user = await this.userModel.findOne({ tokaUserId }).exec();
    if (!user) {
      throw AppException.notFound(
        ErrorCodes.USER_NOT_FOUND,
        'Usuario no encontrado.',
      );
    }
    return user;
  }

  /**
   * Crea o actualiza usuario (upsert).
   * Idempotente: si el usuario ya existe, actualiza datos básicos.
   */
  async upsertByTokaUserId(
    tokaUserId: string,
    data: Partial<Pick<UserDocument, 'username' | 'avatarUrl'>>,
  ): Promise<UserDocument> {
    const user = await this.userModel
      .findOneAndUpdate(
        { tokaUserId },
        {
          $setOnInsert: { tokaUserId },
          $set: {
            ...(data.username && { username: data.username }),
            ...(data.avatarUrl && { avatarUrl: data.avatarUrl }),
          },
        },
        { upsert: true, new: true, runValidators: true },
      )
      .exec();
    return user!;
  }

  async updateProfile(
    tokaUserId: string,
    data: Partial<Pick<UserDocument, 'username' | 'avatarUrl'>>,
  ): Promise<UserDocument> {
    const user = await this.userModel
      .findOneAndUpdate({ tokaUserId }, { $set: data }, { new: true, runValidators: true })
      .exec();
    if (!user) {
      throw AppException.notFound(
        ErrorCodes.USER_NOT_FOUND,
        'Usuario no encontrado.',
      );
    }
    return user;
  }
}
