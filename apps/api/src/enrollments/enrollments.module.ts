import { Module } from '@nestjs/common';
import { EnrollmentsService } from './enrollments.service';
import { EnrollmentsController } from './enrollments.controller';
import { EnrollmentsCalculateController } from './enrollments-calculate.controller';

@Module({
  providers: [EnrollmentsService],
  controllers: [EnrollmentsController, EnrollmentsCalculateController],
})
export class EnrollmentsModule {}
