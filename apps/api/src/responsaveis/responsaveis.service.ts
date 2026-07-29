import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { QueryResponsavelDto } from './dto/query-responsavel.dto';
import { UpdateResponsavelDto } from './dto/update-responsavel.dto';

@Injectable()
export class ResponsaveisService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly i18n: I18nService,
  ) {}

  findAll(query: QueryResponsavelDto) {
    const where = query.q
      ? {
          OR: [
            { nome: { contains: query.q, mode: 'insensitive' as const } },
            { cpf: { contains: query.q.replace(/\D/g, '') || query.q } },
          ],
        }
      : {};

    return this.prisma.responsavel.findMany({ where, orderBy: { nome: 'asc' } });
  }

  async findOne(id: string, lang: string) {
    const responsavel = await this.prisma.responsavel.findUnique({ where: { id } });
    if (!responsavel) {
      throw new NotFoundException(this.i18n.t('responsaveis.not_found', { lang }));
    }
    return responsavel;
  }

  async update(id: string, dto: UpdateResponsavelDto, lang: string) {
    const existing = await this.prisma.responsavel.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(this.i18n.t('responsaveis.not_found', { lang }));
    }

    const cpf = dto.cpf ? dto.cpf.replace(/\D/g, '') : undefined;

    if (cpf) {
      const cpfOwner = await this.prisma.responsavel.findUnique({ where: { cpf } });
      if (cpfOwner && cpfOwner.id !== id) {
        throw new ConflictException(this.i18n.t('responsaveis.cpf_in_use', { lang }));
      }
    }

    try {
      return await this.prisma.responsavel.update({
        where: { id },
        data: {
          nome: dto.nome,
          telefone: dto.telefone,
          email: dto.email,
          cpf,
        },
      });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        throw new ConflictException(this.i18n.t('responsaveis.cpf_in_use', { lang }));
      }
      throw err;
    }
  }
}
