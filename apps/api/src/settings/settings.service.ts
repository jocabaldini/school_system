import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateSettingsDto } from './dto/update-settings.dto';

@Injectable()
export class SettingsService {
  constructor(private readonly prisma: PrismaService) {}

  private async getRow() {
    const settings = await this.prisma.settings.findFirst();
    if (!settings) {
      throw new InternalServerErrorException('Settings row is missing');
    }
    return settings;
  }

  async findOne() {
    return this.getRow();
  }

  async update(dto: UpdateSettingsDto) {
    const existing = await this.getRow();

    return this.prisma.settings.update({
      where: { id: existing.id },
      data: {
        pricePerHour: dto.pricePerHour,
        defaultSchoolDays: dto.defaultSchoolDays,
        latePenaltyPercentage: dto.latePenaltyPercentage,
      },
    });
  }
}
