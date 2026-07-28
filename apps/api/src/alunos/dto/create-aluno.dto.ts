import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { StatusAluno } from '@prisma/client';
import { CreateResponsavelInlineDto } from './create-responsavel-inline.dto';

export class CreateAlunoDto {
  @IsString()
  nome!: string;

  @IsDateString()
  dataNascimento!: string;

  @IsOptional()
  @IsString()
  fotoUrl?: string;

  @IsOptional()
  @IsEnum(StatusAluno)
  status?: StatusAluno;

  // Required when `responsavel` is not provided — see AlunosService.create for the XOR check.
  @ValidateIf((o: CreateAlunoDto) => o.responsavel === undefined)
  @IsString()
  responsavelId?: string;

  // Required when `responsavelId` is not provided — see AlunosService.create for the XOR check.
  @ValidateIf((o: CreateAlunoDto) => o.responsavelId === undefined)
  @ValidateNested()
  @Type(() => CreateResponsavelInlineDto)
  responsavel?: CreateResponsavelInlineDto;
}
