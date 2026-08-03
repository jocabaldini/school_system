import { IsEmail, IsOptional, IsString } from 'class-validator';
import { IsCPF } from '../../common/validators/is-cpf.validator';
import { i18nValidationMessage } from 'nestjs-i18n';

export class CreateGuardianInlineDto {
  @IsString()
  name!: string;

  @IsCPF({ message: i18nValidationMessage('validation.cpf') })
  cpf!: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsEmail()
  email?: string;
}
