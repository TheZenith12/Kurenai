import { IsEmail, IsString, MinLength, MaxLength, Matches, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail({}, { message: 'Зөв имэйл хаяг оруулна уу' })
  email: string;

  @ApiProperty({ example: 'naruto_fan' })
  @IsString()
  @MinLength(3, { message: 'Хэрэглэгчийн нэр доод тал нь 3 тэмдэгт байна' })
  @MaxLength(20, { message: 'Хэрэглэгчийн нэр дээд тал нь 20 тэмдэгт байна' })
  @Matches(/^[a-zA-Z0-9_]+$/, { message: 'Зөвхөн үсэг, тоо, доогуур зураас ашиглана уу' })
  username: string;

  @ApiProperty({ example: 'Naruto Fan' })
  @IsString()
  @MinLength(8, { message: 'Нууц үг доод тал нь 8 тэмдэгт байна' })
  @MaxLength(100)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message: 'Нууц үг том үсэг, жижиг үсэг, тоо агуулсан байна',
  })
  password: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  displayName?: string;
}
