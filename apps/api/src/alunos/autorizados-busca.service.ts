import { Injectable, NotFoundException } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAutorizadoBuscaDto } from './dto/create-autorizado-busca.dto';
import { UpdateAutorizadoBuscaDto } from './dto/update-autorizado-busca.dto';

@Injectable()
export class AutorizadosBuscaService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly i18n: I18nService,
  ) {}

  private async ensureAlunoExists(alunoId: string, lang: string) {
    const aluno = await this.prisma.aluno.findUnique({ where: { id: alunoId } });
    if (!aluno) {
      throw new NotFoundException(this.i18n.t('alunos.not_found', { lang }));
    }
  }

  private async findOwned(alunoId: string, id: string, lang: string) {
    const autorizado = await this.prisma.autorizadoBusca.findUnique({ where: { id } });
    if (!autorizado || autorizado.alunoId !== alunoId) {
      throw new NotFoundException(this.i18n.t('alunos.autorizado_not_found', { lang }));
    }
    return autorizado;
  }

  async create(alunoId: string, dto: CreateAutorizadoBuscaDto, lang: string) {
    await this.ensureAlunoExists(alunoId, lang);

    return this.prisma.autorizadoBusca.create({
      data: {
        nome: dto.nome,
        parentesco: dto.parentesco,
        telefone: dto.telefone,
        alunoId,
      },
    });
  }

  async findAll(alunoId: string, lang: string) {
    await this.ensureAlunoExists(alunoId, lang);

    return this.prisma.autorizadoBusca.findMany({ where: { alunoId } });
  }

  async update(alunoId: string, id: string, dto: UpdateAutorizadoBuscaDto, lang: string) {
    await this.findOwned(alunoId, id, lang);

    return this.prisma.autorizadoBusca.update({
      where: { id },
      data: {
        nome: dto.nome,
        parentesco: dto.parentesco,
        telefone: dto.telefone,
      },
    });
  }

  async remove(alunoId: string, id: string, lang: string) {
    await this.findOwned(alunoId, id, lang);

    await this.prisma.autorizadoBusca.delete({ where: { id } });
    return { ok: true };
  }
}
