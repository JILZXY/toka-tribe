import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class EquipItemDto {
  @ApiProperty({ description: 'ID del artículo a equipar', example: 'hat_crown_gold' })
  @IsString()
  @IsNotEmpty({ message: 'El itemId es obligatorio.' })
  itemId: string;
}
