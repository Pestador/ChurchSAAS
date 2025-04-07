import { Injectable, CanActivate, ExecutionContext, Logger, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '../../entities/user.entity';
import { ROLES_KEY } from '../decorators/roles.decorator';

/**
 * Guard for protecting routes based on user roles
 * Works in conjunction with the @Roles decorator
 */
@Injectable()
export class RolesGuard implements CanActivate {
  private readonly logger = new Logger(RolesGuard.name);

  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Get required roles from route handler metadata
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // If no roles are required, allow access
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    // Get request object from context
    const { user } = context.switchToHttp().getRequest();

    // If no user is attached to request, deny access
    if (!user) {
      this.logger.warn('No user found in request - denied access to protected route');
      throw new ForbiddenException('Unauthorized access to protected resource');
    }

    // Check if user has the required role
    const hasRequiredRole = requiredRoles.some(role => user.role === role);

    // Admin access override - admin can access all protected routes
    const isAdmin = user.role === UserRole.ADMIN;

    // Log access information
    if (hasRequiredRole || isAdmin) {
      this.logger.debug(`User ${user.id} (${user.role}) granted access to protected route`);
    } else {
      this.logger.warn(`User ${user.id} (${user.role}) denied access - requires one of [${requiredRoles.join(', ')}]`);
      throw new ForbiddenException('Insufficient permissions to access resource');
    }

    return hasRequiredRole || isAdmin;
  }
}
