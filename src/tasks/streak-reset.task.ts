import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UserDocument } from '../modules/users/infrastructure/persistence/schemas/user.schema.js';

/**
 * Tarea programada: Reseteo diario de rachas.
 * Si un usuario no ha jugado en las últimas 36 horas, su racha se resetea a 0.
 * La ventana de 36h (en vez de 24h exactas) deja cierto margen para zonas horarias
 * y no penalizar a usuarios que juegan tarde o temprano vs el día anterior.
 */
@Injectable()
export class StreakResetTask {
  private readonly logger = new Logger(StreakResetTask.name);
  private readonly STREAK_WINDOW_HOURS = 36;

  constructor(
    @InjectModel(UserDocument.name)
    private readonly userModel: Model<UserDocument>,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async resetExpiredStreaks(): Promise<void> {
    const cutoffDate = new Date();
    cutoffDate.setHours(cutoffDate.getHours() - this.STREAK_WINDOW_HOURS);

    const result = await this.userModel.updateMany(
      {
        currentStreak: { $gt: 0 },
        lastPlayedDate: { $lt: cutoffDate },
      },
      {
        $set: { currentStreak: 0 },
      },
    );

    this.logger.log(
      `Reseteo de rachas completado: ${result.modifiedCount} usuario(s) afectado(s).`,
    );
  }
}
