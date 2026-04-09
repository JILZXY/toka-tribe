import {
  Controller,
  Get,
  Patch,
  Body,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../auth/infrastructure/guards/jwt-auth.guard.js';
import { CurrentUser } from '../../../../shared/presentation/decorators/current-user.decorator.js';
import { GetMeUseCase } from '../../application/use-cases/get-me.use-case.js';
import { GetUserSummaryUseCase } from '../../application/use-cases/get-summary.use-case.js';
import { UpdateProfileUseCase } from '../../application/use-cases/update-profile.use-case.js';
import { UpdateProfileDto } from '../../application/dto/update-profile.dto.js';

@ApiTags('users')
@ApiBearerAuth('jwt')
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(
    private readonly getMe: GetMeUseCase,
    private readonly getSummary: GetUserSummaryUseCase,
    private readonly updateProfile: UpdateProfileUseCase,
  ) {}

  @Get('me')
  @ApiOperation({ summary: 'Obtener perfil del usuario actual' })
  @ApiResponse({ status: 200, description: 'Perfil del usuario.' })
  @ApiResponse({ status: 401, description: 'No autorizado.' })
  async me(@CurrentUser() user: { userId: string }) {
    return this.getMe.execute(user.userId);
  }

  @Patch('me')
  @ApiOperation({ summary: 'Actualizar perfil del usuario actual' })
  @ApiResponse({ status: 200, description: 'Perfil actualizado.' })
  @ApiResponse({ status: 401, description: 'No autorizado.' })
  async update(
    @CurrentUser() user: { userId: string },
    @Body() dto: UpdateProfileDto,
  ) {
    return this.updateProfile.execute(user.userId, dto);
  }

  @Get('me/summary')
  @ApiOperation({ summary: 'Resumen consolidado del usuario para UI' })
  @ApiResponse({ status: 200, description: 'Resumen del usuario.' })
  async summary(@CurrentUser() user: { userId: string }) {
    return this.getSummary.execute(user.userId);
  }
}
