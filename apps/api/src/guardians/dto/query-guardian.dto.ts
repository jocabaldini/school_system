import { IsOptional, IsString } from 'class-validator';

export class QueryGuardianDto {
  @IsOptional()
  @IsString()
  q?: string;
}
