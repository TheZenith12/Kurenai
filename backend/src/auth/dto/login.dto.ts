import { IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'user@example.com эсвэл username' })
  @IsString()
  emailOrUsername: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  password: string;
}
