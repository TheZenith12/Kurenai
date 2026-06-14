import { Module } from '@nestjs/common';
import { LoginStreakService } from './login-streak.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [LoginStreakService],
  exports: [LoginStreakService],
})
export class LoginStreakModule {}
