import { IsInt, IsNumber, IsOptional, Min } from 'class-validator';

export class UpdateSettingsDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  pricePerHour?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  defaultSchoolDays?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  latePenaltyPercentage?: number;
}
