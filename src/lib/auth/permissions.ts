import { auth } from "@/auth";
import { prisma } from "@/lib/db";

export type Role = "ADMIN" | "MANAGER" | "VIEWER";

export interface UserSession {
  id: string;
  email: string;
  name?: string | null;
  role: Role;
  regionAccess: string[];
}

// Permission definitions
export const PERMISSIONS = {
  // Dashboard
  VIEW_DASHBOARD: ["ADMIN", "MANAGER", "VIEWER"],
  VIEW_DEAL_DETAILS: ["ADMIN", "MANAGER", "VIEWER"],

  // Targets
  VIEW_TARGETS: ["ADMIN", "MANAGER"],
  EDIT_TARGETS: ["ADMIN", "MANAGER"],

  // Sync
  TRIGGER_SYNC: ["ADMIN", "MANAGER"],
  VIEW_SYNC_LOGS: ["ADMIN", "MANAGER"],

  // Admin
  MANAGE_USERS: ["ADMIN"],
  MANAGE_REGIONS: ["ADMIN"],
} as const;

export type Permission = keyof typeof PERMISSIONS;

/**
 * Check if user has a specific permission
 */
export function hasPermission(role: Role, permission: Permission): boolean {
  return (PERMISSIONS[permission] as readonly string[]).includes(role);
}

/**
 * Check if user can access a specific region
 */
export function canAccessRegion(
  userRole: Role,
  userRegions: string[],
  regionCode: string
): boolean {
  // Admin can access all regions
  if (userRole === "ADMIN") {
    return true;
  }

  // Other roles are limited to their assigned regions
  return userRegions.includes(regionCode);
}

/**
 * Get current user session from auth
 */
export async function getCurrentUser(): Promise<UserSession | null> {
  const session = await auth();

  if (!session?.user) {
    return null;
  }

  return {
    id: session.user.id,
    email: session.user.email,
    name: session.user.name,
    role: session.user.role as Role,
    regionAccess: session.user.regionAccess || [],
  };
}

/**
 * Get user's accessible regions
 */
export async function getUserAccessibleRegions(
  userId: string
): Promise<string[]> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      regionAccess: {
        include: { region: true },
      },
    },
  });

  if (!user) {
    return [];
  }

  // Admin can access all regions
  if (user.role === "ADMIN") {
    const allRegions = await prisma.region.findMany({
      where: { isActive: true },
      select: { code: true },
    });
    return allRegions.map((r) => r.code);
  }

  return user.regionAccess.map((ra) => ra.region.code);
}

/**
 * Require authentication - throws if not authenticated
 */
export async function requireAuth(): Promise<UserSession> {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  return user;
}

/**
 * Require specific permission - throws if not authorized
 */
export async function requirePermission(
  permission: Permission
): Promise<UserSession> {
  const user = await requireAuth();

  if (!hasPermission(user.role, permission)) {
    throw new Error("Forbidden");
  }

  return user;
}

/**
 * Require region access - throws if not authorized
 */
export async function requireRegionAccess(
  regionCode: string
): Promise<UserSession> {
  const user = await requireAuth();

  if (!canAccessRegion(user.role, user.regionAccess, regionCode)) {
    throw new Error("Forbidden");
  }

  return user;
}
