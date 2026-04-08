import { Controller, Get, Post, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Types } from 'mongoose';
import { JwtAuthGuard } from '../../../auth/infrastructure/guards/jwt-auth.guard.js';
import { CurrentUser } from '../../../../shared/presentation/decorators/current-user.decorator.js';
import { TribeRepository } from '../../infrastructure/persistence/repositories/tribe.repository.js';
import { UserRepository } from '../../../users/infrastructure/persistence/repositories/user.repository.js';
import { SeasonRepository } from '../../../seasons/infrastructure/persistence/repositories/season.repository.js';

@ApiTags('tribes')
@ApiBearerAuth('jwt')
@UseGuards(JwtAuthGuard)
@Controller('tribes')
export class TribesController {
  constructor(
    private readonly tribeRepo: TribeRepository,
    private readonly userRepo: UserRepository,
    private readonly seasonRepo: SeasonRepository,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Listar tribus públicas' })
  async list() {
    return this.tribeRepo.findPublicTribes();
  }

  @Post()
  @ApiOperation({ summary: 'Crear tribu' })
  @ApiResponse({ status: 201, description: 'Tribu creada.' })
  async create(
    @CurrentUser() user: { userId: string },
    @Body() body: { name: string; slug: string; description?: string },
  ) {
    const dbUser = await this.userRepo.findByTokaUserIdOrThrow(user.userId);
    const season = await this.seasonRepo.findActiveOrThrow();
    return this.tribeRepo.createTribe(
      { name: body.name, slug: body.slug, description: body.description, leaderId: dbUser._id as Types.ObjectId },
      season._id as Types.ObjectId,
    );
  }

  @Get(':tribeId')
  @ApiOperation({ summary: 'Detalle de tribu' })
  async detail(@Param('tribeId') tribeId: string) {
    return this.tribeRepo.findByIdOrThrow(tribeId);
  }

  @Post(':tribeId/join')
  @ApiOperation({ summary: 'Unirse a tribu' })
  @ApiResponse({ status: 201, description: 'Unido a la tribu.' })
  @ApiResponse({ status: 409, description: 'Ya estás en una tribu esta temporada.' })
  async join(
    @CurrentUser() user: { userId: string },
    @Param('tribeId') tribeId: string,
  ) {
    const dbUser = await this.userRepo.findByTokaUserIdOrThrow(user.userId);
    const season = await this.seasonRepo.findActiveOrThrow();
    return this.tribeRepo.joinTribe(
      new Types.ObjectId(tribeId),
      dbUser._id as Types.ObjectId,
      season._id as Types.ObjectId,
    );
  }

  @Post(':tribeId/leave')
  @ApiOperation({ summary: 'Abandonar tribu' })
  async leave(@CurrentUser() user: { userId: string }) {
    const dbUser = await this.userRepo.findByTokaUserIdOrThrow(user.userId);
    const season = await this.seasonRepo.findActiveOrThrow();
    await this.tribeRepo.leaveTribe(dbUser._id as Types.ObjectId, season._id as Types.ObjectId);
    return { left: true };
  }

  @Get(':tribeId/members')
  @ApiOperation({ summary: 'Miembros de la tribu' })
  async members(@Param('tribeId') tribeId: string) {
    const season = await this.seasonRepo.findActiveOrThrow();
    return this.tribeRepo.findMembersByTribe(tribeId, (season._id as Types.ObjectId).toString());
  }
}
