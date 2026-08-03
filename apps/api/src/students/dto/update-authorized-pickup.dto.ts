import { IsOptional, IsString } from 'class-validator';

export class UpdateAuthorizedPickupDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  relationship?: string;

  @IsOptional()
  @IsString()
  phone?: string;
}
