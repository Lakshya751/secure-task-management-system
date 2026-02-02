import { SetMetadata, createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Permission } from '@app/data';

// Mark route as public (no auth required)
export const Public = () => SetMetadata('isPublic', true);

// Require specific permissions
export const RequirePermissions = (...permissions: Permission[]) =>
  SetMetadata('permissions', permissions);

// Get current user from request
export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
