import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('health')
@Controller('health')
export class HealthController {
  @Get()
  @ApiOperation({ summary: 'Estado general de la aplicación' })
  @ApiResponse({ status: 200, description: 'Aplicación en línea.' })
  check() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('ready')
  @ApiOperation({ summary: 'Verificar si la aplicación está lista para recibir tráfico' })
  @ApiResponse({ status: 200, description: 'La aplicación está lista.' })
  ready() {
    return {
      status: 'ready',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('live')
  @ApiOperation({ summary: 'Verificar si la aplicación está viva' })
  @ApiResponse({ status: 200, description: 'La aplicación está viva.' })
  live() {
    return {
      status: 'live',
      timestamp: new Date().toISOString(),
    };
  }
}
