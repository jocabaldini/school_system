import { IsOptional, IsString } from 'class-validator';

export class CreateAuthorizedPickupDto {
  @IsString()
  name!: string;

  @IsString()
  relationship!: string;

  @IsOptional()
  @IsString()
  phone?: string;
}
