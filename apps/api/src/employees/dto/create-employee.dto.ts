import { IsEmail, IsOptional, IsString } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';
import { IsCPF } from '../../common/validators/is-cpf.validator';

export class CreateEmployeeDto {
  @IsString()
  name!: string;

  @IsString()
  position!: string;

  @IsOptional()
  @IsCPF({ message: i18nValidationMessage('validation.cpf') })
  cpf?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsEmail()
  email?: string;
}
