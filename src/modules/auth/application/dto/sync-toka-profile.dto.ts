import { IsArray, IsString, ArrayMinSize, ArrayMaxSize } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SyncTokaProfileDto {
  @ApiProperty({
    description: 'Array de códigos de autorización obtenidos vía getAuthCode (hasta 5).',
    example: ['rNAeg7', 'IfDTCP'],
    type: [String],
  })
  @IsArray({ message: 'authCodes debe ser un array.' })
  @ArrayMinSize(1, { message: 'Debe enviar al menos un authCode.' })
  @ArrayMaxSize(5, { message: 'No se pueden enviar más de 5 authCodes a la vez.' })
  @IsString({ each: true, message: 'Cada authCode debe ser una cadena de texto.' })
  authCodes: string[];
}
