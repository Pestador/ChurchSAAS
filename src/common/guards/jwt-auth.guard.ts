import { ExecutionContext, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';

/**
 * JWT Authentication Guard
 * Extends Passport's AuthGuard to provide JWT-based authentication
 * Can be used with IS_PUBLIC_KEY metadata to allow public access to specific routes
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  private readonly logger = new Logger(JwtAuthGuard.name);

  constructor(private reflector: Reflector) {
    super();
  }

  /**
   * Determines if the current route requires authentication
   */
  canActivate(context: ExecutionContext) {
    // Check if route is marked as public
    const isPublic = this.reflector.getAllAndOverride<boolean>('isPublic', [
      context.getHandler(),
      context.getClass(),
    ]);

    // Allow access to public routes without authentication
    if (isPublic) {
      this.logger.debug('Allowing access to public route without authentication');
      return true;
    }

    // For protected routes, use the JWT strategy
    return super.canActivate(context);
  }

  /**
   * Custom error handling for authentication failures
   */
  handleRequest(err, user, info) {
    // Handle various authentication errors
    if (err || !user) {
      let errorMessage = 'Unauthorized access';
      
      if (info) {
        if (info.name === 'TokenExpiredError') {
          errorMessage = 'Authentication token has expired';
        } else if (info.name === 'JsonWebTokenError') {
          errorMessage = 'Invalid authentication token';
        }
      }
      
      this.logger.warn(`Authentication failed: ${errorMessage}`);
      throw new UnauthorizedException(errorMessage);
    }
    
    return user;
  }
}
