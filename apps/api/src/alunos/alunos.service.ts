import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAlunoDto } from './dto/create-aluno.dto';
import { UpdateAlunoDto } from './dto/update-aluno.dto';
import { QueryAlunoDto } from './dto/query-aluno.dto';

@Injectable()
export class AlunosService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly i18n: I18nService,
  ) {}

  async create(dto: CreateAlunoDto, lang: string) {
    if (dto.responsavelId && dto.responsavel) {
      throw new BadRequestException(this.i18n.t('alunos.responsavel_xor', { lang }));
    }

    return this.prisma.$transaction(async (tx) => {
      let responsavelId: string;

      if (dto.responsavel) {
        const existing = await tx.responsavel.findUnique({
          where: { cpf: dto.responsavel.cpf.replace(/\D/g, '') },
        });

        if (existing) {
          responsavelId = existing.id;
        } else {
          const created = await tx.responsavel.create({
            data: {
              nome: dto.responsavel.nome,
              cpf: dto.responsavel.cpf.replace(/\D/g, ''),
              telefone: dto.responsavel.telefone,
              email: dto.responsavel.email,
            },
          });
          responsavelId = created.id;
        }
      } else {
        const responsavel = await tx.responsavel.findUnique({
          where: { id: dto.responsavelId },
        });
        if (!responsavel) {
          throw new NotFoundException(this.i18n.t('alunos.responsavel_not_found', { lang }));
        }
        responsavelId = responsavel.id;
      }

      return tx.aluno.create({
        data: {
          nome: dto.nome,
          dataNascimento: new Date(dto.dataNascimento),
          fotoUrl: dto.fotoUrl,
          status: dto.status,
          responsavelId,
        },
        include: { responsavel: true },
      });
    });
  }

  async findAll(query: QueryAlunoDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where = query.status ? { status: query.status } : {};

    const [data, total] = await Promise.all([
      this.prisma.aluno.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.aluno.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  async findOne(id: string, lang: string) {
    const aluno = await this.prisma.aluno.findUnique({
      where: { id },
      include: { responsavel: true, autorizadosBusca: true },
    });

    if (!aluno) {
      throw new NotFoundException(this.i18n.t('alunos.not_found', { lang }));
    }

    return aluno;
  }

  async update(id: string, dto: UpdateAlunoDto, lang: string) {
    const existing = await this.prisma.aluno.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(this.i18n.t('alunos.not_found', { lang }));
    }

    return this.prisma.aluno.update({
      where: { id },
      data: {
        nome: dto.nome,
        dataNascimento: dto.dataNascimento ? new Date(dto.dataNascimento) : undefined,
        fotoUrl: dto.fotoUrl,
        status: dto.status,
      },
    });
  }

  async remove(id: string, lang: string) {
    const existing = await this.prisma.aluno.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(this.i18n.t('alunos.not_found', { lang }));
    }

    return this.prisma.aluno.update({
      where: { id },
      data: { status: 'INATIVO' },
    });
  }
}
