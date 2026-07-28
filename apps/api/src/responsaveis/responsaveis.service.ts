import { Injectable, NotFoundException } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { PrismaService } from '../prisma/prisma.service';
import { QueryResponsavelDto } from './dto/query-responsavel.dto';

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
}
