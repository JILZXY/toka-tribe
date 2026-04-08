import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { TribeDocument } from '../schemas/tribe.schema.js';
import { TribeMemberDocument } from '../schemas/tribe-member.schema.js';
import { AppException } from '../../../../../shared/application/exceptions/app-exception.js';
import { ErrorCodes } from '../../../../../config/constants/error-codes.js';
import { TribeRole } from '../../../../../shared/domain/enums/tribe-role.enum.js';

@Injectable()
export class TribeRepository {
  constructor(
    @InjectModel(TribeDocument.name)
    private readonly tribeModel: Model<TribeDocument>,
    @InjectModel(TribeMemberDocument.name)
    private readonly memberModel: Model<TribeMemberDocument>,
  ) {}

  async findByIdOrThrow(id: string): Promise<TribeDocument> {
    const tribe = await this.tribeModel.findById(id).exec();
    if (!tribe) {
      throw AppException.notFound(ErrorCodes.TRIBE_NOT_FOUND, 'Tribu no encontrada.');
    }
    return tribe;
  }

  async findPublicTribes(): Promise<TribeDocument[]> {
    const tribes = await this.tribeModel.find({ isPublic: true, status: 'active' }).sort({ seasonPoints: -1 }).limit(50).lean().exec();
    return tribes as unknown as TribeDocument[];
  }

  async createTribe(
    data: { name: string; slug: string; description?: string; leaderId: Types.ObjectId },
    seasonId: Types.ObjectId,
  ): Promise<TribeDocument> {
    const tribe = await this.tribeModel.create(data);
    // Crear miembro líder automáticamente
    await this.memberModel.create({
      tribeId: tribe._id,
      userId: data.leaderId,
      seasonId,
      role: TribeRole.LEADER,
    });
    return tribe;
  }

  async joinTribe(
    tribeId: Types.ObjectId,
    userId: Types.ObjectId,
    seasonId: Types.ObjectId,
  ): Promise<TribeMemberDocument> {
    // Idempotencia: índice único userId+seasonId previene duplicados
    try {
      const member = await this.memberModel.create({
        tribeId,
        userId,
        seasonId,
        role: TribeRole.MEMBER,
      });
      await this.tribeModel.findByIdAndUpdate(tribeId, { $inc: { memberCount: 1 } });
      return member;
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'code' in error && (error as { code: number }).code === 11000) {
        throw AppException.conflict(
          ErrorCodes.TRIBE_ALREADY_JOINED,
          'El usuario ya pertenece a una tribu en esta temporada.',
        );
      }
      throw error;
    }
  }

  async findMembersByTribe(tribeId: string, seasonId: string): Promise<TribeMemberDocument[]> {
    return this.memberModel
      .find({ tribeId: new Types.ObjectId(tribeId), seasonId: new Types.ObjectId(seasonId) })
      .sort({ pointsContributed: -1 })
      .exec();
  }

  async findMemberByUserAndSeason(userId: Types.ObjectId, seasonId: Types.ObjectId): Promise<TribeMemberDocument | null> {
    return this.memberModel.findOne({ userId, seasonId }).exec();
  }

  async leaveTribe(userId: Types.ObjectId, seasonId: Types.ObjectId): Promise<void> {
    const member = await this.memberModel.findOne({ userId, seasonId }).exec();
    if (!member) {
      throw AppException.notFound(ErrorCodes.TRIBE_NOT_A_MEMBER, 'No eres miembro de ninguna tribu.');
    }
    if (member.role === TribeRole.LEADER) {
      throw new AppException(ErrorCodes.TRIBE_LEADER_CANNOT_LEAVE, 'El líder no puede abandonar la tribu.');
    }
    await this.memberModel.deleteOne({ _id: member._id });
    await this.tribeModel.findByIdAndUpdate(member.tribeId, { $inc: { memberCount: -1 } });
  }
}
