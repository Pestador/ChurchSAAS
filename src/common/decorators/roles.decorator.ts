import { SetMetadata } from '@nestjs/common';
import { UserRole } from '../../entities/user.entity';

export const ROLES_KEY = 'roles';

/**
 * Decorator for specifying which user roles can access a route
 * @param roles Array of UserRole values that can access the protected route
 * @example
 * @Roles(UserRole.ADMIN, UserRole.PASTOR)
 * @Get('secure-endpoint')
 * secureEndpoint() {
 *   return 'This is secure';
 * }
 */
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
