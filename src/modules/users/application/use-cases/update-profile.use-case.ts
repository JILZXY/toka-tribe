import { Injectable } from '@nestjs/common';
import { UserRepository } from '../../infrastructure/persistence/repositories/user.repository.js';
import { UpdateProfileDto } from '../dto/update-profile.dto.js';

/**
 * Caso de uso: Actualizar perfil del usuario.
 * Idempotente: actualizar con los mismos datos siempre da el mismo resultado.
 */
@Injectable()
export class UpdateProfileUseCase {
  constructor(private readonly userRepo: UserRepository) {}

  async execute(tokaUserId: string, dto: UpdateProfileDto) {
    const user = await this.userRepo.updateProfile(tokaUserId, dto);
    return {
      id: user._id,
      tokaUserId: user.tokaUserId,
      username: user.username,
      avatarUrl: user.avatarUrl,
    };
  }
}
