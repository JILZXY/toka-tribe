import { Controller, Get, Post, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { JwtAuthGuard } from '../../../auth/infrastructure/guards/jwt-auth.guard.js';
import { ChallengeDocument } from '../../infrastructure/persistence/schemas/challenge.schema.js';
import { ChallengeStatus } from '../../../../shared/domain/enums/challenge-status.enum.js';

@ApiTags('challenges')
@ApiBearerAuth('jwt')
@UseGuards(JwtAuthGuard)
@Controller('challenges')
export class ChallengesController {
  constructor(@InjectModel(ChallengeDocument.name) private readonly challengeModel: Model<ChallengeDocument>) {}

  @Get('active')
  @ApiOperation({ summary: 'Listar retos activos' })
  async active() {
    return this.challengeModel.find({ status: ChallengeStatus.ACTIVE }).exec();
  }

  @Get(':challengeId')
  @ApiOperation({ summary: 'Detalle del reto' })
  async detail(@Param('challengeId') challengeId: string) {
    return this.challengeModel.findById(challengeId).exec();
  }
}

@ApiTags('admin')
@ApiBearerAuth('jwt')
@UseGuards(JwtAuthGuard)
@Controller('admin/challenges')
export class AdminChallengesController {
  constructor(@InjectModel(ChallengeDocument.name) private readonly challengeModel: Model<ChallengeDocument>) {}

  @Post()
  @ApiOperation({ summary: 'Crear reto' })
  async create(@Body() body: { seasonId: string; gameId: string; title: string; startDate: string; endDate: string; maxPointsPerUser?: number }) {
    return this.challengeModel.create({ ...body, startDate: new Date(body.startDate), endDate: new Date(body.endDate) });
  }

  @Post(':challengeId/activate')
  @ApiOperation({ summary: 'Activar reto' })
  async activate(@Param('challengeId') challengeId: string) {
    return this.challengeModel.findByIdAndUpdate(challengeId, { $set: { status: ChallengeStatus.ACTIVE } }, { new: true }).exec();
  }

  @Post(':challengeId/close')
  @ApiOperation({ summary: 'Cerrar reto' })
  async close(@Param('challengeId') challengeId: string) {
    return this.challengeModel.findByIdAndUpdate(challengeId, { $set: { status: ChallengeStatus.CLOSED } }, { new: true }).exec();
  }
}
