import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateProfileDto {
  @ApiPropertyOptional({ description: 'Nombre de usuario', example: 'jeshua' })
  @IsOptional()
  @IsString({ message: 'El username debe ser una cadena de texto.' })
  @MinLength(3, { message: 'El username debe tener al menos 3 caracteres.' })
  @MaxLength(30, { message: 'El username no puede exceder 30 caracteres.' })
  username?: string;

  @ApiPropertyOptional({
    description: 'URL del avatar',
    example: 'https://example.com/avatar.png',
  })
  @IsOptional()
  @IsString({ message: 'El avatarUrl debe ser una cadena de texto.' })
  @MaxLength(512, { message: 'El avatarUrl no puede exceder 512 caracteres.' })
  avatarUrl?: string;
}
