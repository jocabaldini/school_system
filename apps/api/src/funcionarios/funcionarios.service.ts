import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFuncionarioDto } from './dto/create-funcionario.dto';
import { UpdateFuncionarioDto } from './dto/update-funcionario.dto';
import { QueryFuncionarioDto } from './dto/query-funcionario.dto';

@Injectable()
export class FuncionariosService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly i18n: I18nService,
  ) {}

  private buildWhere(query: QueryFuncionarioDto): Prisma.FuncionarioWhereInput {
    const where: Prisma.FuncionarioWhereInput = {};

    if (query.status === 'ATIVO') where.deletedAt = null;
    else if (query.status === 'INATIVO') where.deletedAt = { not: null };

    if (query.q) where.nome = { contains: query.q, mode: 'insensitive' };

    return where;
  }

  async create(dto: CreateFuncionarioDto, lang: string) {
    const cpf = dto.cpf ? dto.cpf.replace(/\D/g, '') : undefined;

    if (cpf) {
      const existing = await this.prisma.funcionario.findUnique({ where: { cpf } });
      if (existing) {
        throw new ConflictException(this.i18n.t('funcionarios.cpf_in_use', { lang }));
      }
    }

    return this.prisma.funcionario.create({
      data: {
        nome: dto.nome,
        cargo: dto.cargo,
        cpf,
        telefone: dto.telefone,
        email: dto.email,
      },
    });
  }

  async findAll(query: QueryFuncionarioDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where = this.buildWhere(query);

    const [data, total] = await Promise.all([
      this.prisma.funcionario.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.funcionario.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  async findOne(id: string, lang: string) {
    const funcionario = await this.prisma.funcionario.findUnique({ where: { id } });
    if (!funcionario) {
      throw new NotFoundException(this.i18n.t('funcionarios.not_found', { lang }));
    }
    return funcionario;
  }

  async update(id: string, dto: UpdateFuncionarioDto, lang: string) {
    await this.findOne(id, lang);

    const cpf = dto.cpf ? dto.cpf.replace(/\D/g, '') : undefined;

    if (cpf) {
      const cpfOwner = await this.prisma.funcionario.findUnique({ where: { cpf } });
      if (cpfOwner && cpfOwner.id !== id) {
        throw new ConflictException(this.i18n.t('funcionarios.cpf_in_use', { lang }));
      }
    }

    try {
      return await this.prisma.funcionario.update({
        where: { id },
        data: {
          nome: dto.nome,
          cargo: dto.cargo,
          telefone: dto.telefone,
          email: dto.email,
          cpf,
        },
      });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        throw new ConflictException(this.i18n.t('funcionarios.cpf_in_use', { lang }));
      }
      throw err;
    }
  }

  async remove(id: string, lang: string) {
    await this.findOne(id, lang);

    return this.prisma.funcionario.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async reactivate(id: string, lang: string) {
    await this.findOne(id, lang);

    return this.prisma.funcionario.update({
      where: { id },
      data: { deletedAt: null },
    });
  }
}
