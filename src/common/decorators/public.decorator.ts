import { SetMetadata } from '@nestjs/common';

/**
 * Public Route Marker
 * This metadata key is used to mark routes as public (no authentication required)
 */
export const IS_PUBLIC_KEY = 'isPublic';

/**
 * Decorator for marking routes as public (no authentication required)
 * @example
 * @Public()
 * @Get('public-endpoint')
 * publicEndpoint() {
 *   return 'This is public';
 * }
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
