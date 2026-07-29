import { IsDateString, IsOptional, IsString } from 'class-validator';

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
}
