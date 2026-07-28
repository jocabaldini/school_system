import { IsOptional, IsString } from 'class-validator';

export class QueryResponsavelDto {
  @IsOptional()
  @IsString()
  q?: string;
}
