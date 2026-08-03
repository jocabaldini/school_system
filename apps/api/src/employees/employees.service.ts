import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { QueryEmployeeDto } from './dto/query-employee.dto';

@Injectable()
export class EmployeesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly i18n: I18nService,
  ) {}

  private buildWhere(query: QueryEmployeeDto): Prisma.EmployeeWhereInput {
    const where: Prisma.EmployeeWhereInput = {};

    if (query.status === 'ACTIVE') where.deletedAt = null;
    else if (query.status === 'INACTIVE') where.deletedAt = { not: null };

    if (query.q) where.name = { contains: query.q, mode: 'insensitive' };

    return where;
  }

  async create(dto: CreateEmployeeDto, lang: string) {
    const cpf = dto.cpf ? dto.cpf.replace(/\D/g, '') : undefined;

    if (cpf) {
      const existing = await this.prisma.employee.findUnique({ where: { cpf } });
      if (existing) {
        throw new ConflictException(this.i18n.t('employees.cpf_in_use', { lang }));
      }
    }

    return this.prisma.employee.create({
      data: {
        name: dto.name,
        position: dto.position,
        cpf,
        phone: dto.phone,
        email: dto.email,
      },
    });
  }

  async findAll(query: QueryEmployeeDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where = this.buildWhere(query);

    const [data, total] = await Promise.all([
      this.prisma.employee.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.employee.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  async findOne(id: string, lang: string) {
    const employee = await this.prisma.employee.findUnique({ where: { id } });
    if (!employee) {
      throw new NotFoundException(this.i18n.t('employees.not_found', { lang }));
    }
    return employee;
  }

  async update(id: string, dto: UpdateEmployeeDto, lang: string) {
    await this.findOne(id, lang);

    const cpf = dto.cpf ? dto.cpf.replace(/\D/g, '') : undefined;

    if (cpf) {
      const cpfOwner = await this.prisma.employee.findUnique({ where: { cpf } });
      if (cpfOwner && cpfOwner.id !== id) {
        throw new ConflictException(this.i18n.t('employees.cpf_in_use', { lang }));
      }
    }

    try {
      return await this.prisma.employee.update({
        where: { id },
        data: {
          name: dto.name,
          position: dto.position,
          phone: dto.phone,
          email: dto.email,
          cpf,
        },
      });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        throw new ConflictException(this.i18n.t('employees.cpf_in_use', { lang }));
      }
      throw err;
    }
  }

  async remove(id: string, lang: string) {
    await this.findOne(id, lang);

    return this.prisma.employee.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async reactivate(id: string, lang: string) {
    await this.findOne(id, lang);

    return this.prisma.employee.update({
      where: { id },
      data: { deletedAt: null },
    });
  }
}
