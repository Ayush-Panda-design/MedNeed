import { prisma } from '@/lib/prisma';
import { UserRole } from '@/types';

export interface ResolvedAdminRole {
  role: UserRole;
  name?: string;
  avatar?: string;
  pharmacistRegNo?: string;
  isActive?: boolean;
}

/**
 * Resolves the user role strictly on the server by checking active staff in the database AdminUser table.
 * If not found in AdminUser or isActive is false, the user is treated as a standard CUSTOMER.
 * This completely replaces hardcoded role allowlists with persistent DB RBAC.
 */
export async function resolveRoleFromEmail(email: string): Promise<ResolvedAdminRole> {
  const normalized = email.toLowerCase().trim();

  if (process.env.DATABASE_URL) {
    try {
      const admin = await prisma.adminUser.findUnique({
        where: { email: normalized },
      });

      if (admin && admin.isActive) {
        return {
          role: admin.role,
          name: admin.name,
          avatar: admin.avatar || (admin.role === 'PHARMACIST' ? '👨‍⚕️' : '👨‍💼'),
          pharmacistRegNo: admin.pharmacistRegNo || admin.pharmacistLicenseNumber || undefined,
          isActive: true,
        };
      }
    } catch (err) {
      console.error('Error resolving admin role from database:', err);
    }
  }

  return { role: 'CUSTOMER', avatar: '👤' };
}
