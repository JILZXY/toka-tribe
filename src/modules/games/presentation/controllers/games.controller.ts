import { Controller, Get, Post, Patch, Param, Body, Delete, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { JwtAuthGuard } from '../../../auth/infrastructure/guards/jwt-auth.guard.js';
import { GameDocument } from '../../infrastructure/persistence/schemas/game.schema.js';

@ApiTags('games')
@ApiBearerAuth('jwt')
@UseGuards(JwtAuthGuard)
@Controller('games')
export class GamesController {
  constructor(@InjectModel(GameDocument.name) private readonly gameModel: Model<GameDocument>) {}

  @Get()
  @ApiOperation({ summary: 'Listar juegos' })
  async list() {
    return this.gameModel.find({ isActive: true }).exec();
  }

  @Get(':gameId')
  @ApiOperation({ summary: 'Detalle de juego' })
  async detail(@Param('gameId') gameId: string) {
    return this.gameModel.findById(gameId).exec();
  }
}

@ApiTags('admin')
@ApiBearerAuth('jwt')
@UseGuards(JwtAuthGuard)
@Controller('admin/games')
export class AdminGamesController {
  constructor(@InjectModel(GameDocument.name) private readonly gameModel: Model<GameDocument>) {}

  @Post()
  @ApiOperation({ summary: 'Crear juego' })
  async create(@Body() body: { type: string; title: string; description?: string; config: Record<string, unknown> }) {
    return this.gameModel.create(body);
  }

  @Patch(':gameId')
  @ApiOperation({ summary: 'Actualizar juego' })
  async update(@Param('gameId') gameId: string, @Body() body: Partial<GameDocument>) {
    return this.gameModel.findByIdAndUpdate(gameId, { $set: body }, { new: true }).exec();
  }

  @Delete(':gameId')
  @ApiOperation({ summary: 'Desactivar juego' })
  async deactivate(@Param('gameId') gameId: string) {
    return this.gameModel.findByIdAndUpdate(gameId, { $set: { isActive: false } }, { new: true }).exec();
  }
}
