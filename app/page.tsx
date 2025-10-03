/**
 * WHAT: Home page converted to login-first experience
 * WHY: Authenticated users are routed based on role; unauthenticated users see login
 */

import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { validateAdminToken } from '@/lib/auth';

export default async function HomePage() {
  // WHAT: Check if user is already authenticated
  const cookieStore = await cookies();
  const token = cookieStore.get('admin_session')?.value;
  
  if (token) {
    const user = await validateAdminToken(token);
    
    if (user) {
      // WHAT: Route based on role
      // WHY: Super-admins see global dashboard, others see org selector
      if (user.role === 'super-admin') {
        redirect('/admin/dashboard');
      } else {
        redirect('/organizations');
      }
    }
  }
  
  // WHAT: No valid session, redirect to login
  redirect('/admin/login');
}
