/**
 * WHAT: Universal login page for all users at root /
 * WHY: Single entry point for all user types (super-admin, org-admin, member)
 * NOTE: After login, all users go to /organizations to select their organization
 */

import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { validateAdminToken } from '@/lib/auth';
import UniversalLoginPage from './UniversalLoginPage';

export default async function HomePage() {
  // WHAT: Check if user is already authenticated
  const cookieStore = await cookies();
  const token = cookieStore.get('admin_session')?.value;
  
  if (token) {
    const user = await validateAdminToken(token);
    
    if (user) {
      // WHAT: All authenticated users go to /organizations
      // WHY: Unified experience - choose organization regardless of role
      redirect('/organizations');
    }
  }
  
  // WHAT: No valid session, show universal login form
  return <UniversalLoginPage />;
}
