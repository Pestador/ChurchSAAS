import { Injectable, CanActivate, ExecutionContext, Logger, ForbiddenException } from '@nestjs/common';

/**
 * Guard for enforcing multi-tenant security
 * Ensures users can only access data from their own church
 */
@Injectable()
export class ChurchTenantGuard implements CanActivate {
  private readonly logger = new Logger(ChurchTenantGuard.name);

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const { user, params } = request;

    // If no user is attached to request, deny access
    if (!user) {
      this.logger.warn('No user found in request - denied access to tenant resource');
      throw new ForbiddenException('Unauthorized access to tenant resource');
    }

    // Get churchId from request route params or query params
    const resourceChurchId = params.churchId || request.body?.churchId || request.query?.churchId;

    // If no churchId parameter exists in the request, we can't verify tenant access
    if (!resourceChurchId) {
      // Skip this guard if no churchId is specified in the request
      this.logger.debug('No churchId parameter found in request - skipping tenant check');
      return true;
    }

    // Get user's churchId from the JWT token
    const userChurchId = user.churchId;

    // Platform admins can access any tenant's data
    if (user.role === 'admin') {
      this.logger.debug(`Admin user ${user.id} granted cross-tenant access to church ${resourceChurchId}`);
      return true;
    }

    // Check if user is trying to access a resource from their own church
    const isSameTenant = userChurchId === resourceChurchId;

    if (!isSameTenant) {
      this.logger.warn(
        `User ${user.id} from church ${userChurchId} denied access to resource from church ${resourceChurchId}`
      );
      throw new ForbiddenException('You can only access resources from your own church');
    }

    this.logger.debug(`User ${user.id} granted access to resource from own church ${userChurchId}`);
    return true;
  }
}
