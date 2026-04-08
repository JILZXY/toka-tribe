import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { SeasonDocument } from '../schemas/season.schema.js';
import { AppException } from '../../../../../shared/application/exceptions/app-exception.js';
import { ErrorCodes } from '../../../../../config/constants/error-codes.js';
import { SeasonStatus } from '../../../../../shared/domain/enums/season-status.enum.js';

@Injectable()
export class SeasonRepository {
  constructor(
    @InjectModel(SeasonDocument.name)
    private readonly seasonModel: Model<SeasonDocument>,
  ) {}

  async findActive(): Promise<SeasonDocument | null> {
    return this.seasonModel.findOne({ status: SeasonStatus.ACTIVE }).exec();
  }

  async findActiveOrThrow(): Promise<SeasonDocument> {
    const season = await this.findActive();
    if (!season) {
      throw AppException.notFound(ErrorCodes.SEASON_NOT_ACTIVE, 'No hay temporada activa.');
    }
    return season;
  }

  async findByIdOrThrow(id: string): Promise<SeasonDocument> {
    const season = await this.seasonModel.findById(id).exec();
    if (!season) {
      throw AppException.notFound(ErrorCodes.SEASON_NOT_FOUND, 'Temporada no encontrada.');
    }
    return season;
  }

  async create(data: {
    name: string;
    startDate: Date;
    endDate: Date;
    promotionRules?: { topPercentPromote: number; bottomPercentRelegate: number };
  }): Promise<SeasonDocument> {
    const existing = await this.findActive();
    if (existing) {
      throw AppException.conflict(
        ErrorCodes.SEASON_ALREADY_ACTIVE,
        'Ya existe una temporada activa. Ciérrala antes de crear otra.',
      );
    }
    return this.seasonModel.create(data);
  }

  async closeSeason(seasonId: string): Promise<SeasonDocument> {
    const season = await this.findByIdOrThrow(seasonId);
    season.status = SeasonStatus.CLOSING;
    return season.save();
  }
}
