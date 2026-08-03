import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { QueryGuardianDto } from './dto/query-guardian.dto';
import { UpdateGuardianDto } from './dto/update-guardian.dto';

@Injectable()
export class GuardiansService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly i18n: I18nService,
  ) {}

  findAll(query: QueryGuardianDto) {
    const where = query.q
      ? {
          OR: [
            { name: { contains: query.q, mode: 'insensitive' as const } },
            { cpf: { contains: query.q.replace(/\D/g, '') || query.q } },
          ],
        }
      : {};

    return this.prisma.guardian.findMany({ where, orderBy: { name: 'asc' } });
  }

  async findOne(id: string, lang: string) {
    const guardian = await this.prisma.guardian.findUnique({ where: { id } });
    if (!guardian) {
      throw new NotFoundException(this.i18n.t('guardians.not_found', { lang }));
    }
    return guardian;
  }

  async update(id: string, dto: UpdateGuardianDto, lang: string) {
    const existing = await this.prisma.guardian.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(this.i18n.t('guardians.not_found', { lang }));
    }

    const cpf = dto.cpf ? dto.cpf.replace(/\D/g, '') : undefined;

    if (cpf) {
      const cpfOwner = await this.prisma.guardian.findUnique({ where: { cpf } });
      if (cpfOwner && cpfOwner.id !== id) {
        throw new ConflictException(this.i18n.t('guardians.cpf_in_use', { lang }));
      }
    }

    try {
      return await this.prisma.guardian.update({
        where: { id },
        data: {
          name: dto.name,
          phone: dto.phone,
          email: dto.email,
          cpf,
        },
      });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        throw new ConflictException(this.i18n.t('guardians.cpf_in_use', { lang }));
      }
      throw err;
    }
  }
}
