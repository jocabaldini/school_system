import { IsDateString, IsOptional, IsString, ValidateIf, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateGuardianInlineDto } from './create-guardian-inline.dto';

export class CreateStudentDto {
  @IsString()
  name!: string;

  @IsDateString()
  birthDate!: string;

  @IsOptional()
  @IsString()
  photoUrl?: string;

  // Required when `guardian` is not provided — see StudentsService.create for the XOR check.
  @ValidateIf((o: CreateStudentDto) => o.guardian === undefined)
  @IsString()
  guardianId?: string;

  // Required when `guardianId` is not provided — see StudentsService.create for the XOR check.
  @ValidateIf((o: CreateStudentDto) => o.guardianId === undefined)
  @ValidateNested()
  @Type(() => CreateGuardianInlineDto)
  guardian?: CreateGuardianInlineDto;
}
