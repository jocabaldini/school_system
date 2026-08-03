import { Module } from '@nestjs/common';
import { StudentsService } from './students.service';
import { StudentsController } from './students.controller';
import { AuthorizedPickupsService } from './authorized-pickups.service';
import { AuthorizedPickupsController } from './authorized-pickups.controller';

@Module({
  providers: [StudentsService, AuthorizedPickupsService],
  controllers: [StudentsController, AuthorizedPickupsController],
  exports: [StudentsService],
})
export class StudentsModule {}
