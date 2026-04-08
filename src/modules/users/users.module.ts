import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UserDocument, UserSchema } from './infrastructure/persistence/schemas/user.schema.js';
import { UserRepository } from './infrastructure/persistence/repositories/user.repository.js';
import { GetMeUseCase } from './application/use-cases/get-me.use-case.js';
import { UpdateProfileUseCase } from './application/use-cases/update-profile.use-case.js';
import { UsersController } from './presentation/controllers/users.controller.js';
import { AuthModule } from '../auth/auth.module.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: UserDocument.name, schema: UserSchema },
    ]),
    forwardRef(() => AuthModule),
  ],
  controllers: [UsersController],
  providers: [UserRepository, GetMeUseCase, UpdateProfileUseCase],
  exports: [UserRepository],
})
export class UsersModule {}
