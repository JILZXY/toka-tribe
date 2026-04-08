import { Injectable, Inject, Logger } from '@nestjs/common';
import { TOKA_USER_INFO_PORT, type TokaUserInfoPort } from '../ports/toka-user-info.port.js';
import { UserRepository } from '../../../users/infrastructure/persistence/repositories/user.repository.js';
import { AppException } from '../../../../shared/application/exceptions/app-exception.js';
import { ErrorCodes } from '../../../../config/constants/error-codes.js';

@Injectable()
export class SyncTokaProfileUseCase {
  private readonly logger = new Logger(SyncTokaProfileUseCase.name);

  constructor(
    @Inject(TOKA_USER_INFO_PORT)
    private readonly tokaUserInfo: TokaUserInfoPort,
    private readonly userRepo: UserRepository,
  ) {}

  async execute(tokaUserId: string, authCodes: string[]): Promise<void> {
    // 1. Obtener usuario local para extraer el accessToken (cachead en login)
    const dbUser = await this.userRepo.findByTokaUserIdOrThrow(tokaUserId);
    if (!dbUser.tokaAccessToken) {
      this.logger.warn(`Intento de sincronizar perfil sin token para ${tokaUserId}`);
      throw new AppException(
        ErrorCodes.AUTH_EXPIRED_TOKEN,
        'Se requiere volver a iniciar sesión para sincronizar el perfil.',
      );
    }

    // 2. Obtener info de Toka usando múltiples authCodes
    const tokaInfo = await this.tokaUserInfo.getUserInfo(dbUser.tokaAccessToken, authCodes);

    // 3. Mappear los campos recibidos a la base de datos
    // Limitaremos lo que se actualiza a lo que nos manda Toka
    const updatePayload: Record<string, any> = {};
    if (tokaInfo.nickName) updatePayload.username = tokaInfo.nickName;
    if (tokaInfo.avatar) updatePayload.avatarUrl = tokaInfo.avatar;

    // Solo actualizamos si hay algo que actualizar
    if (Object.keys(updatePayload).length > 0) {
      await this.userRepo.updateProfile(tokaUserId, updatePayload);
      this.logger.log(`Perfil sincronizado exitosamente para ${tokaUserId}`);
    } else {
      this.logger.log(`Carga útil de sincronización vacía para ${tokaUserId}`);
    }
  }
}
