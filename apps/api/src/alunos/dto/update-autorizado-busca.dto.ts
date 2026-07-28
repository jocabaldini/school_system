import { IsOptional, IsString } from 'class-validator';

export class UpdateAutorizadoBuscaDto {
  @IsOptional()
  @IsString()
  nome?: string;

  @IsOptional()
  @IsString()
  parentesco?: string;

  @IsOptional()
  @IsString()
  telefone?: string;
}
