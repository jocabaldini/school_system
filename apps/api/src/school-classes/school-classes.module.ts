import { Module } from '@nestjs/common';
import { SchoolClassesService } from './school-classes.service';
import { SchoolClassesController } from './school-classes.controller';

@Module({
  providers: [SchoolClassesService],
  controllers: [SchoolClassesController],
})
export class SchoolClassesModule {}
