import { IsEmail, IsOptional, IsString } from 'class-validator';
import { IsCPF } from '../../common/validators/is-cpf.validator';
import { i18nValidationMessage } from 'nestjs-i18n';

export class CreateResponsavelInlineDto {
  @IsString()
  nome!: string;

  @IsCPF({ message: i18nValidationMessage('validation.cpf') })
  cpf!: string;

  @IsOptional()
  @IsString()
  telefone?: string;

  @IsOptional()
  @IsEmail()
  email?: string;
}
