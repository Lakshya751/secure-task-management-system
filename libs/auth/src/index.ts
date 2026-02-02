import { UserRole, Permission } from '@app/data';

// Role to Permissions mapping
const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  [UserRole.VIEWER]: [Permission.TASK_READ],
  [UserRole.ADMIN]: [
    Permission.TASK_CREATE,
    Permission.TASK_READ,
    Permission.TASK_UPDATE,
    Permission.TASK_DELETE,
    Permission.AUDIT_READ,
  ],
  [UserRole.OWNER]: [
    Permission.TASK_CREATE,
    Permission.TASK_READ,
    Permission.TASK_UPDATE,
    Permission.TASK_DELETE,
    Permission.AUDIT_READ,
  ],
};

// Role hierarchy: Owner > Admin > Viewer
const ROLE_HIERARCHY: Record<UserRole, UserRole[]> = {
  [UserRole.OWNER]: [UserRole.OWNER, UserRole.ADMIN, UserRole.VIEWER],
  [UserRole.ADMIN]: [UserRole.ADMIN, UserRole.VIEWER],
  [UserRole.VIEWER]: [UserRole.VIEWER],
};

export class RBACService {
  /**
   * Check if a role has a specific permission
   */
  static hasPermission(role: UserRole, permission: Permission): boolean {
    const permissions = ROLE_PERMISSIONS[role] || [];
    return permissions.includes(permission);
  }

  /**
   * Check if a role includes another role through hierarchy
   */
  static hasRoleOrHigher(userRole: UserRole, requiredRole: UserRole): boolean {
    const hierarchy = ROLE_HIERARCHY[userRole] || [];
    return hierarchy.includes(requiredRole);
  }

  /**
   * Get all permissions for a role
   */
  static getPermissions(role: UserRole): Permission[] {
    return ROLE_PERMISSIONS[role] || [];
  }

  /**
   * Check if user can access an organization
   * Users can access their own org and child orgs (if Admin/Owner)
   * Child org users CANNOT access parent org
   */
  static canAccessOrganization(
    userRole: UserRole,
    userOrgId: number,
    userOrgParentId: number | null,
    targetOrgId: number,
    targetOrgParentId: number | null,
  ): boolean {
    // User can access their own org
    if (userOrgId === targetOrgId) {
      return true;
    }

    // Owner and Admin can access child orgs
    if (
      (userRole === UserRole.OWNER || userRole === UserRole.ADMIN) &&
      targetOrgParentId === userOrgId
    ) {
      return true;
    }

    // Child org users CANNOT access parent org
    return false;
  }

  /**
   * Validate if user can perform action on resource in target org
   */
  static canPerformAction(
    userRole: UserRole,
    permission: Permission,
    userOrgId: number,
    userOrgParentId: number | null,
    targetOrgId: number,
    targetOrgParentId: number | null,
  ): boolean {
    // First check permission
    if (!this.hasPermission(userRole, permission)) {
      return false;
    }

    // Then check org access
    return this.canAccessOrganization(
      userRole,
      userOrgId,
      userOrgParentId,
      targetOrgId,
      targetOrgParentId,
    );
  }
}

export { UserRole, Permission };
