import { IsString, IsNotEmpty, IsNumber, IsOptional, IsObject } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateGameSessionDto {
  @ApiProperty({ description: 'ID del reto (challenge)', example: '64b8f1e2a3d4f5b6c7d8e9f0' })
  @IsString()
  @IsNotEmpty()
  challengeId: string;

  @ApiProperty({ description: 'Puntuación obtenida en la sesión', example: 120 })
  @IsNumber()
  score: number;

  @ApiProperty({ description: 'Duración en milisegundos (opcional)', example: 30000, required: false })
  @IsOptional()
  @IsNumber()
  durationMs?: number;

  @ApiProperty({ description: 'Metadata arbitraria y opcional del juego', required: false, type: Object })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}
