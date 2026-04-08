import { IsString, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePetDto {
  @ApiProperty({ description: 'Nombre de la mascota', example: 'Firulais', minLength: 3, maxLength: 20 })
  @IsString({ message: 'El nombre debe ser una cadena de texto.' })
  @MinLength(3, { message: 'El nombre debe tener al menos 3 caracteres.' })
  @MaxLength(20, { message: 'El nombre no puede exceder 20 caracteres.' })
  name: string;
}
