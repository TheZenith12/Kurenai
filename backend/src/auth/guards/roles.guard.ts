import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '../../common/enums';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) return true;

    const { user } = context.switchToHttp().getRequest();
    if (!user) throw new ForbiddenException('Нэвтрэх шаардлагатай байна');

    const hasRole = requiredRoles.some((role) => {
      if (role === UserRole.ADMIN) {
        return user.role === UserRole.ADMIN || user.role === UserRole.SUPER_ADMIN;
      }
      return user.role === role;
    });

    if (!hasRole) {
      throw new ForbiddenException('Энэ үйлдэл хийх эрх байхгүй байна');
    }

    return true;
  }
}
