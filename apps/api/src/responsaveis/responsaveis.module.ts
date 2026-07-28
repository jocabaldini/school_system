import { Module } from '@nestjs/common';
import { ResponsaveisService } from './responsaveis.service';
import { ResponsaveisController } from './responsaveis.controller';

@Module({
  providers: [ResponsaveisService],
  controllers: [ResponsaveisController],
})
export class ResponsaveisModule {}
