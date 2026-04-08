import { Controller, Get, Post, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../auth/infrastructure/guards/jwt-auth.guard.js';
import { SeasonRepository } from '../../infrastructure/persistence/repositories/season.repository.js';

@ApiTags('seasons')
@ApiBearerAuth('jwt')
@UseGuards(JwtAuthGuard)
@Controller('seasons')
export class SeasonsController {
  constructor(private readonly seasonRepo: SeasonRepository) {}

  @Get('current')
  @ApiOperation({ summary: 'Obtener temporada activa' })
  @ApiResponse({ status: 200, description: 'Temporada activa.' })
  async current() {
    return this.seasonRepo.findActiveOrThrow();
  }

  @Get(':seasonId')
  @ApiOperation({ summary: 'Obtener temporada por ID' })
  @ApiResponse({ status: 200, description: 'Datos de la temporada.' })
  async findById(@Param('seasonId') seasonId: string) {
    return this.seasonRepo.findByIdOrThrow(seasonId);
  }
}

@ApiTags('admin')
@ApiBearerAuth('jwt')
@UseGuards(JwtAuthGuard)
@Controller('admin/seasons')
export class AdminSeasonsController {
  constructor(private readonly seasonRepo: SeasonRepository) {}

  @Post()
  @ApiOperation({ summary: 'Crear nueva temporada' })
  @ApiResponse({ status: 201, description: 'Temporada creada.' })
  @ApiResponse({ status: 409, description: 'Ya hay una temporada activa.' })
  async create(
    @Body() body: { name: string; startDate: string; endDate: string },
  ) {
    return this.seasonRepo.create({
      name: body.name,
      startDate: new Date(body.startDate),
      endDate: new Date(body.endDate),
    });
  }

  @Post(':seasonId/close')
  @ApiOperation({ summary: 'Cerrar temporada' })
  @ApiResponse({ status: 200, description: 'Temporada cerrada.' })
  async close(@Param('seasonId') seasonId: string) {
    return this.seasonRepo.closeSeason(seasonId);
  }
}
