import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class CreateSchoolClassDto {
  @IsString()
  name!: string;

  @IsInt()
  schoolYear!: number;

  @IsInt()
  @Min(1)
  maxCapacity!: number;

  @IsString()
  teacherId!: string;

  @IsOptional()
  @IsString()
  assistantId?: string;
}
