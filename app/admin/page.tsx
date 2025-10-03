import { redirect } from "next/navigation";

/**
 * WHAT: /admin redirects to login (which then redirects to dashboard if authenticated)
 * WHY: Provides discoverable admin entry point while maintaining security
 */
export default function AdminPage() {
  redirect('/admin/login');
}
