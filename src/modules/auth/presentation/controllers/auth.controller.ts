import {
  Controller,
  Post,
  Body,
  UseGuards,
  Get,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { LoginWithTokaUseCase } from '../../application/use-cases/login-with-toka.use-case.js';
import { LoginWithTokaDto } from '../../application/dto/login-with-toka.dto.js';
import { JwtAuthGuard } from '../../infrastructure/guards/jwt-auth.guard.js';
import { CurrentUser } from '../../../../shared/presentation/decorators/current-user.decorator.js';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly loginWithToka: LoginWithTokaUseCase) {}

  @Post('toka/login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Autenticación con código de Toka' })
  @ApiResponse({
    status: 200,
    description: 'Login exitoso con JWT interno.',
  })
  @ApiResponse({
    status: 400,
    description: 'Código de autorización inválido.',
  })
  @ApiResponse({
    status: 503,
    description: 'Proveedor de autenticación no disponible.',
  })
  async login(@Body() dto: LoginWithTokaDto) {
    return this.loginWithToka.execute(dto.authCode);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('jwt')
  @ApiOperation({ summary: 'Obtener usuario autenticado actual' })
  @ApiResponse({
    status: 200,
    description: 'Datos del usuario autenticado.',
  })
  @ApiResponse({ status: 401, description: 'No autorizado.' })
  me(@CurrentUser() user: { userId: string }) {
    return { userId: user.userId };
  }
}
