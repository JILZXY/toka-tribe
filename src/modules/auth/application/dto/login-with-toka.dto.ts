import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO para login con Toka.
 * OWASP A03: Validación estricta del authCode.
 */
export class LoginWithTokaDto {
  @ApiProperty({
    description: 'Código de autorización obtenido desde el frontend H5 (AlipayJSBridge)',
    example: 'QZvGrF',
  })
  @IsString({ message: 'El authCode debe ser una cadena de texto.' })
  @IsNotEmpty({ message: 'El authCode es obligatorio.' })
  @MaxLength(256, { message: 'El authCode excede la longitud permitida.' })
  authCode: string;
}
