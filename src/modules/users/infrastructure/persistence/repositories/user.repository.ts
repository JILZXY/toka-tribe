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
    data: Partial<Pick<UserDocument, 'username' | 'avatarUrl' | 'tokaAccessToken' | 'fullName' | 'firstName' | 'lastName' | 'gender' | 'email' | 'mobilePhone' | 'birthday' | 'nationality' | 'birthState' | 'kycState'>>,
  ): Promise<UserDocument> {
    const user = await this.userModel
      .findOneAndUpdate(
        { tokaUserId },
        {
          // En inserción: poner tokaUserId y username provisional (el tokaUserId mismo)
          // Si el perfil ya fue sincronizado, $setOnInsert no sobreescribe valores existentes
          $setOnInsert: { tokaUserId, username: tokaUserId },
          $set: {
            ...(data.username && { username: data.username }),
            ...(data.avatarUrl && { avatarUrl: data.avatarUrl }),
            ...(data.tokaAccessToken && { tokaAccessToken: data.tokaAccessToken }),
            ...(data.fullName !== undefined && { fullName: data.fullName }),
            ...(data.firstName !== undefined && { firstName: data.firstName }),
            ...(data.lastName !== undefined && { lastName: data.lastName }),
            ...(data.gender !== undefined && { gender: data.gender }),
            ...(data.email !== undefined && { email: data.email }),
            ...(data.mobilePhone !== undefined && { mobilePhone: data.mobilePhone }),
            ...(data.birthday !== undefined && { birthday: data.birthday }),
            ...(data.nationality !== undefined && { nationality: data.nationality }),
            ...(data.birthState !== undefined && { birthState: data.birthState }),
            ...(data.kycState !== undefined && { kycState: data.kycState }),
          },
        },
        // runValidators: false para que no falle en upserts donde username aún no viene del perfil
        { upsert: true, returnDocument: 'after' },
      )
      .exec();
    return user!;
  }

  async updateProfile(
    tokaUserId: string,
    data: Partial<Pick<UserDocument, 'username' | 'avatarUrl'>>,
  ): Promise<UserDocument> {
    const user = await this.userModel
      .findOneAndUpdate({ tokaUserId }, { $set: data }, { returnDocument: 'after', runValidators: true })
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
