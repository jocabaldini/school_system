import { IsNumber, IsOptional, Matches, Max, Min } from 'class-validator';
import { TIME_REGEX } from '../time.util';

export class CalculateEnrollmentDto {
  @Matches(TIME_REGEX, { message: 'startTime must be in HH:mm format' })
  startTime!: string;

  @Matches(TIME_REGEX, { message: 'endTime must be in HH:mm format' })
  endTime!: string;

  @IsOptional()
  @Matches(TIME_REGEX, { message: 'breakStart must be in HH:mm format' })
  breakStart?: string;

  @IsOptional()
  @Matches(TIME_REGEX, { message: 'breakEnd must be in HH:mm format' })
  breakEnd?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  discountPercentage?: number;
}
