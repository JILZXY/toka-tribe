import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TribeDocument, TribeSchema } from './infrastructure/persistence/schemas/tribe.schema.js';
import { TribeMemberDocument, TribeMemberSchema } from './infrastructure/persistence/schemas/tribe-member.schema.js';
import { TribeRepository } from './infrastructure/persistence/repositories/tribe.repository.js';
import { TribesController } from './presentation/controllers/tribes.controller.js';
import { AuthModule } from '../auth/auth.module.js';
import { UsersModule } from '../users/users.module.js';
import { SeasonsModule } from '../seasons/seasons.module.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: TribeDocument.name, schema: TribeSchema },
      { name: TribeMemberDocument.name, schema: TribeMemberSchema },
    ]),
    forwardRef(() => AuthModule),
    forwardRef(() => UsersModule),
    SeasonsModule,
  ],
  controllers: [TribesController],
  providers: [TribeRepository],
  exports: [TribeRepository],
})
export class TribesModule {}
