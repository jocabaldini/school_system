import { IsEmail, IsOptional, IsString } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';
import { IsCPF } from '../../common/validators/is-cpf.validator';

export class UpdateResponsavelDto {
  @IsOptional()
  @IsString()
  nome?: string;

  @IsOptional()
  @IsCPF({ message: i18nValidationMessage('validation.cpf') })
  cpf?: string;

  @IsOptional()
  @IsString()
  telefone?: string;

  @IsOptional()
  @IsEmail()
  email?: string;
}
