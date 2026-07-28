import { IsOptional, IsString } from 'class-validator';

export class CreateAutorizadoBuscaDto {
  @IsString()
  nome!: string;

  @IsString()
  parentesco!: string;

  @IsOptional()
  @IsString()
  telefone?: string;
}
