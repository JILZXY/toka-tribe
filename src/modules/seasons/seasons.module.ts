import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SeasonDocument, SeasonSchema } from './infrastructure/persistence/schemas/season.schema.js';
import { SeasonRepository } from './infrastructure/persistence/repositories/season.repository.js';
import { SeasonsController, AdminSeasonsController } from './presentation/controllers/seasons.controller.js';
import { AuthModule } from '../auth/auth.module.js';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: SeasonDocument.name, schema: SeasonSchema }]),
    forwardRef(() => AuthModule),
  ],
  controllers: [SeasonsController, AdminSeasonsController],
  providers: [SeasonRepository],
  exports: [SeasonRepository],
})
export class SeasonsModule {}
