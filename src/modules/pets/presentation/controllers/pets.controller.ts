import { Controller, Post, Get, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../auth/infrastructure/guards/jwt-auth.guard.js';
import { CurrentUser } from '../../../../shared/presentation/decorators/current-user.decorator.js';
import { CreatePetUseCase } from '../../application/use-cases/create-pet.use-case.js';
import { GetMyPetUseCase } from '../../application/use-cases/get-my-pet.use-case.js';
import { UnlockPetItemUseCase } from '../../application/use-cases/unlock-pet-item.use-case.js';
import { EquipPetItemUseCase } from '../../application/use-cases/equip-pet-item.use-case.js';
import { CreatePetDto } from '../../application/dto/create-pet.dto.js';
import { EquipItemDto } from '../../application/dto/equip-item.dto.js';
import { PetRepository } from '../../infrastructure/persistence/repositories/pet.repository.js';

@ApiTags('pets')
@ApiBearerAuth('jwt')
@UseGuards(JwtAuthGuard)
@Controller('pets')
export class PetsController {
  constructor(
    private readonly createPet: CreatePetUseCase,
    private readonly getMyPet: GetMyPetUseCase,
    private readonly unlockItem: UnlockPetItemUseCase,
    private readonly equipItem: EquipPetItemUseCase,
    private readonly petRepo: PetRepository,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Crear mascota' })
  @ApiResponse({ status: 201, description: 'Mascota creada.' })
  @ApiResponse({ status: 409, description: 'El usuario ya tiene una mascota.' })
  async create(@CurrentUser() user: { userId: string }, @Body() dto: CreatePetDto) {
    return this.createPet.execute(user.userId, dto.name);
  }

  @Get('me')
  @ApiOperation({ summary: 'Obtener mi mascota' })
  @ApiResponse({ status: 200, description: 'Datos de la mascota.' })
  async me(@CurrentUser() user: { userId: string }) {
    return this.getMyPet.execute(user.userId);
  }

  @Post('me/equip')
  @ApiOperation({ summary: 'Equipar artículo a la mascota' })
  @ApiResponse({ status: 200, description: 'Artículo equipado.' })
  async equip(@CurrentUser() user: { userId: string }, @Body() dto: EquipItemDto) {
    return this.equipItem.execute(user.userId, dto.itemId);
  }

  @Get('items/store')
  @ApiOperation({ summary: 'Ver catálogo de artículos disponibles' })
  @ApiResponse({ status: 200, description: 'Lista de artículos.' })
  async store() {
    return this.petRepo.findAvailableItems();
  }

  @Post('items/:itemId/unlock')
  @ApiOperation({ summary: 'Desbloquear artículo con puntos' })
  @ApiResponse({ status: 200, description: 'Artículo desbloqueado.' })
  async unlock(@CurrentUser() user: { userId: string }, @Param('itemId') itemId: string) {
    return this.unlockItem.execute(user.userId, itemId);
  }
}
