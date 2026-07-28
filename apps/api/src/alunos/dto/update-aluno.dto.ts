import { IsDateString, IsEnum, IsOptional, IsString } from 'class-validator';
import { StatusAluno } from '@prisma/client';

export class UpdateAlunoDto {
  @IsOptional()
  @IsString()
  nome?: string;

  @IsOptional()
  @IsDateString()
  dataNascimento?: string;

  @IsOptional()
  @IsString()
  fotoUrl?: string;

  @IsOptional()
  @IsEnum(StatusAluno)
  status?: StatusAluno;
}
