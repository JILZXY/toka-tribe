import { Controller, Get, Post, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { JwtAuthGuard } from '../../../auth/infrastructure/guards/jwt-auth.guard.js';
import { CurrentUser } from '../../../../shared/presentation/decorators/current-user.decorator.js';
import { LeagueRewardDocument } from '../../infrastructure/persistence/schemas/league-reward.schema.js';
import { UserRewardClaimDocument } from '../../infrastructure/persistence/schemas/user-reward-claim.schema.js';
import { UserRepository } from '../../../users/infrastructure/persistence/repositories/user.repository.js';
import { SeasonRepository } from '../../../seasons/infrastructure/persistence/repositories/season.repository.js';
import { AppException } from '../../../../shared/application/exceptions/app-exception.js';
import { ErrorCodes } from '../../../../config/constants/error-codes.js';

@ApiTags('rewards')
@ApiBearerAuth('jwt')
@UseGuards(JwtAuthGuard)
@Controller('rewards')
export class RewardsController {
  constructor(
    @InjectModel(LeagueRewardDocument.name) private readonly rewardModel: Model<LeagueRewardDocument>,
    @InjectModel(UserRewardClaimDocument.name) private readonly claimModel: Model<UserRewardClaimDocument>,
    private readonly userRepo: UserRepository,
    private readonly seasonRepo: SeasonRepository,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Listar recompensas con estado de elegibilidad para el usuario' })
  async list(@CurrentUser() user: { userId: string }) {
    const dbUser = await this.userRepo.findByTokaUserIdOrThrow(user.userId);
    const rewards = await this.rewardModel.find().sort({ requiredPoints: 1 }).lean().exec();

    return rewards.map((reward) => ({
      ...reward,
      isClaimable:
        dbUser.totalPoints >= reward.requiredPoints &&
        !(reward.isPremiumOnly && dbUser.leagueMembership === 'FREE'),
    }));
  }

  @Get('my-claims')
  @ApiOperation({ summary: 'Mis reclamos' })
  async myClaims(@CurrentUser() user: { userId: string }) {
    const dbUser = await this.userRepo.findByTokaUserIdOrThrow(user.userId);
    return this.claimModel.find({ userId: dbUser._id }).exec();
  }

  @Post(':rewardId/claim')
  @ApiOperation({ summary: 'Reclamar recompensa' })
  @ApiResponse({ status: 201, description: 'Recompensa reclamada.' })
  @ApiResponse({ status: 409, description: 'Ya reclamaste esta recompensa.' })
  async claim(
    @CurrentUser() user: { userId: string },
    @Param('rewardId') rewardId: string,
  ) {
    const dbUser = await this.userRepo.findByTokaUserIdOrThrow(user.userId);
    const season = await this.seasonRepo.findActiveOrThrow();
    const reward = await this.rewardModel.findById(rewardId).exec();

    if (!reward) {
      throw AppException.notFound(ErrorCodes.REWARD_NOT_FOUND, 'Recompensa no encontrada.');
    }

    // Validar elegibilidad
    if (dbUser.totalPoints < reward.requiredPoints) {
      throw new AppException(ErrorCodes.REWARD_NOT_ELIGIBLE, 'No cumples los puntos mínimos para esta recompensa.');
    }

    if (reward.isPremiumOnly && dbUser.leagueMembership === 'Free') {
      throw new AppException(ErrorCodes.REWARD_NOT_ELIGIBLE, 'Esta recompensa requiere membresía Premium.');
    }

    // Idempotencia: índice único userId+rewardId+seasonId previene duplicados
    try {
      await this.claimModel.create({
        userId: dbUser._id,
        rewardId: new Types.ObjectId(rewardId),
        seasonId: season._id,
      });
      return { claimed: true, rewardId, seasonId: season._id };
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'code' in error && (error as { code: number }).code === 11000) {
        throw AppException.conflict(ErrorCodes.REWARD_ALREADY_CLAIMED, 'Ya reclamaste esta recompensa en esta temporada.');
      }
      throw error;
    }
  }
}

@ApiTags('admin')
@ApiBearerAuth('jwt')
@UseGuards(JwtAuthGuard)
@Controller('admin/rewards')
export class AdminRewardsController {
  constructor(@InjectModel(LeagueRewardDocument.name) private readonly rewardModel: Model<LeagueRewardDocument>) {}

  @Post()
  @ApiOperation({ summary: 'Crear recompensa' })
  async create(@Body() body: { title: string; rewardType: string; requiredPoints: number; requiredDivision?: string; isPremiumOnly?: boolean; metadata?: Record<string, unknown> }) {
    return this.rewardModel.create(body);
  }
}
