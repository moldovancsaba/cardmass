/**
 * WHAT: Access Revoked Page
 * WHY: Show users whose CardMass access was revoked by an administrator
 * PATTERN: Static page with contact support option
 */

'use client';

export default function AccessRevokedPage() {
  async function handleLogout() {
    try {
      await fetch('/api/auth/sso/logout', {
        method: 'POST',
      });
      // SSO logout redirects automatically
    } catch (error) {
      console.error('Logout error:', error);
      window.location.href = '/admin/login';
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg shadow-md p-8">
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
              <svg
                className="w-8 h-8 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </div>
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold text-gray-900 text-center mb-2">
            Access Revoked
          </h1>
          <p className="text-gray-600 text-center mb-6">
            Your access to CardMass has been removed
          </p>

          {/* Message */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-red-800">
              An administrator has revoked your access to CardMass. If you believe this
              is an error, please contact your organization administrator or support.
            </p>
          </div>

          {/* Help */}
          <div className="text-center text-sm text-gray-600 mb-6">
            <p className="mb-3">
              <strong>Need to request access again?</strong>
            </p>
            <p>
              Contact your organization administrator or{' '}
              <a
                href="mailto:support@doneisbetter.com"
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                reach out to support
              </a>
            </p>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <a
              href="mailto:support@doneisbetter.com?subject=CardMass Access Request"
              className="block w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors text-center"
            >
              Contact Support
            </a>
            <button
              onClick={handleLogout}
              className="w-full bg-gray-200 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
