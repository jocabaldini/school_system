import { Module } from '@nestjs/common';
import { AlunosService } from './alunos.service';
import { AlunosController } from './alunos.controller';
import { AutorizadosBuscaService } from './autorizados-busca.service';
import { AutorizadosBuscaController } from './autorizados-busca.controller';

@Module({
  providers: [AlunosService, AutorizadosBuscaService],
  controllers: [AlunosController, AutorizadosBuscaController],
  exports: [AlunosService],
})
export class AlunosModule {}
