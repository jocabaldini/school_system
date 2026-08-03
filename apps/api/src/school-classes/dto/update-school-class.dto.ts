import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class UpdateSchoolClassDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsInt()
  schoolYear?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  maxCapacity?: number;

  @IsOptional()
  @IsString()
  teacherId?: string;

  @IsOptional()
  @IsString()
  assistantId?: string | null;
}
