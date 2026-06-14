import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { AuthService } from '../auth.service';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    super({ usernameField: 'emailOrUsername' });
  }

  async validate(emailOrUsername: string, password: string) {
    const result = await this.authService.login({ emailOrUsername, password });
    if (!result) throw new UnauthorizedException();
    return result;
  }
}
