import { Controller, Post, Get, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { JwtAuthGuard } from '../../../auth/infrastructure/guards/jwt-auth.guard.js';
import { CurrentUser } from '../../../../shared/presentation/decorators/current-user.decorator.js';
import { GameSessionDocument } from '../../infrastructure/persistence/schemas/game-session.schema.js';
import { UserRepository } from '../../../users/infrastructure/persistence/repositories/user.repository.js';
import { TribeRepository } from '../../../tribes/infrastructure/persistence/repositories/tribe.repository.js';
import { SeasonRepository } from '../../../seasons/infrastructure/persistence/repositories/season.repository.js';
import { AppException } from '../../../../shared/application/exceptions/app-exception.js';
import { ErrorCodes } from '../../../../config/constants/error-codes.js';

@ApiTags('scoring')
@ApiBearerAuth('jwt')
@UseGuards(JwtAuthGuard)
@Controller('game-sessions')
export class GameSessionsController {
  constructor(
    @InjectModel(GameSessionDocument.name) private readonly sessionModel: Model<GameSessionDocument>,
    private readonly userRepo: UserRepository,
    private readonly tribeRepo: TribeRepository,
    private readonly seasonRepo: SeasonRepository,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Registrar sesión de juego' })
  @ApiResponse({ status: 201, description: 'Sesión registrada.' })
  @ApiResponse({ status: 409, description: 'Ya jugaste este reto.' })
  async register(
    @CurrentUser() user: { userId: string },
    @Body() body: { challengeId: string; score: number; durationMs?: number; metadata?: Record<string, unknown> },
  ) {
    const dbUser = await this.userRepo.findByTokaUserIdOrThrow(user.userId);
    const season = await this.seasonRepo.findActiveOrThrow();
    const member = await this.tribeRepo.findMemberByUserAndSeason(
      dbUser._id as Types.ObjectId,
      season._id as Types.ObjectId,
    );

    if (!member) {
      throw new AppException(ErrorCodes.TRIBE_NOT_A_MEMBER, 'Debes pertenecer a una tribu para jugar.');
    }

    // Calcular puntos (simplificado — en producción esto sería un domain service)
    const pointsEarned = Math.min(body.score, 1000);

    try {
      const session = await this.sessionModel.create({
        challengeId: new Types.ObjectId(body.challengeId),
        userId: dbUser._id,
        tribeId: member.tribeId,
        score: body.score,
        pointsEarned,
        durationMs: body.durationMs,
        metadata: body.metadata,
      });

      // Actualizar puntos del usuario y contribución del miembro
      dbUser.totalPoints += pointsEarned;
      dbUser.currentStreak += 1;
      dbUser.lastPlayedDate = new Date();
      await dbUser.save();

      member.pointsContributed += pointsEarned;
      await member.save();

      return {
        sessionId: session._id,
        score: body.score,
        pointsEarned,
        totalPoints: dbUser.totalPoints,
        currentStreak: dbUser.currentStreak,
      };
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'code' in error && (error as { code: number }).code === 11000) {
        throw AppException.conflict(ErrorCodes.CHALLENGE_ALREADY_PLAYED, 'Ya has jugado este reto.');
      }
      throw error;
    }
  }

  @Get('me')
  @ApiOperation({ summary: 'Mis sesiones de juego' })
  async mySessions(@CurrentUser() user: { userId: string }) {
    const dbUser = await this.userRepo.findByTokaUserIdOrThrow(user.userId);
    return this.sessionModel.find({ userId: dbUser._id }).sort({ playedAt: -1 }).limit(50).exec();
  }
}
