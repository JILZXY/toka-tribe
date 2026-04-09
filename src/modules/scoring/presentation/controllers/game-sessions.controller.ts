import { Controller, Post, Get, Body, UseGuards, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { JwtAuthGuard } from '../../../auth/infrastructure/guards/jwt-auth.guard.js';
import { CurrentUser } from '../../../../shared/presentation/decorators/current-user.decorator.js';
import { GameSessionDocument } from '../../infrastructure/persistence/schemas/game-session.schema.js';
import { CreateGameSessionDto } from '../../application/dto/create-game-session.dto.js';
import { ChallengeDocument } from '../../../challenges/infrastructure/persistence/schemas/challenge.schema.js';
import { GameDocument } from '../../../games/infrastructure/persistence/schemas/game.schema.js';
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
  private readonly logger = new Logger(GameSessionsController.name);

  constructor(
    @InjectModel(GameSessionDocument.name) private readonly sessionModel: Model<GameSessionDocument>,
    @InjectModel(ChallengeDocument.name) private readonly challengeModel: Model<ChallengeDocument>,
    @InjectModel(GameDocument.name) private readonly gameModel: Model<GameDocument>,
    private readonly userRepo: UserRepository,
    private readonly tribeRepo: TribeRepository,
    private readonly seasonRepo: SeasonRepository,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Registrar sesión de juego' })
  @ApiResponse({ status: 201, description: 'Sesión registrada.' })
  @ApiBody({ type: CreateGameSessionDto })
  @ApiResponse({ status: 404, description: 'Reto no encontrado.' })
  @ApiResponse({ status: 409, description: 'Ya jugaste este reto.' })
  async register(
    @CurrentUser() user: { userId: string },
    @Body() dto: CreateGameSessionDto,
  ) {
    const dbUser = await this.userRepo.findByTokaUserIdOrThrow(user.userId);
    const season = await this.seasonRepo.findActiveOrThrow();

    // Validar que el reto exista y esté activo
    const challenge = await this.challengeModel.findById(dto.challengeId).exec();
    if (!challenge) {
      throw AppException.notFound(ErrorCodes.CHALLENGE_NOT_FOUND, 'El reto no existe.');
    }

    // Obtener el tipo de juego para poblar gameType
    const game = await this.gameModel.findById(challenge.gameId).lean().exec();
    const gameType = game?.type ?? 'unknown';

    const member = await this.tribeRepo.findMemberByUserAndSeason(
      dbUser._id as Types.ObjectId,
      season._id as Types.ObjectId,
    );

    if (!member) {
      throw new AppException(ErrorCodes.TRIBE_NOT_A_MEMBER, 'Debes pertenecer a una tribu para jugar.');
    }

    // Verificar si el usuario ya jugó y ganó el bono de este reto
    const previousBonusSession = await this.sessionModel.findOne({
      challengeId: new Types.ObjectId(dto.challengeId),
      userId: dbUser._id,
      isChallengeBonusAwarded: true,
    }).exec();

    // Lógica dinámica de puntos:
    // - Si NO ha ganado el bono: Gana su score (base) + el bono del reto (maxPointsPerUser). Ambos en un solo pago por límite.
    //   Para conservar equilibrio, si el score no llega máximo pero hay reto, se podría sumar ambos. Asumiremos 
    //   que pointsEarned = Math.min(dto.score, 1000) (puntos normales del juego) + (BONUS si aplica).
    //   En la redacción asumamos: pointsEarned = min(dto.score, MAX_POR_JUEGO) + (esPrimeraVez ? bonoReto : 0).
    const BASE_MAX_SCORE_PER_PLAY = 1000;
    const baseScore = Math.min(dto.score, BASE_MAX_SCORE_PER_PLAY);
    
    let pointsEarned = baseScore;
    let isChallengeBonusAwarded = false;

    if (!previousBonusSession) {
      // Primera vez cobrando el reto, gana bono extra.
      pointsEarned += challenge.maxPointsPerUser;
      isChallengeBonusAwarded = true;
    }

    try {
      const session = await this.sessionModel.create({
        challengeId: new Types.ObjectId(dto.challengeId),
        userId: dbUser._id,
        tribeId: member.tribeId,
        score: dto.score,
        pointsEarned,
        gameType,
        isChallengeBonusAwarded,
        durationMs: dto.durationMs,
        metadata: dto.metadata,
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
        score: dto.score,
        pointsEarned,
        gameType,
        totalPoints: dbUser.totalPoints,
        currentStreak: dbUser.currentStreak,
      };
    } catch (error: unknown) {
      this.logger?.error('Error registrando sesión de juego', error);
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
