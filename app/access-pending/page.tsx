/**
 * WHAT: Access Pending Page
 * WHY: Show users who requested CardMass access but are awaiting admin approval
 * PATTERN: Static page with logout option
 */

'use client';

export default function AccessPendingPage() {
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
            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center">
              <svg
                className="w-8 h-8 text-yellow-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold text-gray-900 text-center mb-2">
            Access Pending
          </h1>
          <p className="text-gray-600 text-center mb-6">
            Your request to access CardMass is being reviewed
          </p>

          {/* Status */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <h2 className="text-sm font-semibold text-yellow-900 mb-2">
              What happens next?
            </h2>
            <ol className="text-sm text-yellow-800 space-y-2">
              <li className="flex items-start">
                <span className="font-medium mr-2">1.</span>
                <span>An administrator will review your request</span>
              </li>
              <li className="flex items-start">
                <span className="font-medium mr-2">2.</span>
                <span>You&apos;ll receive an email once access is granted</span>
              </li>
              <li className="flex items-start">
                <span className="font-medium mr-2">3.</span>
                <span>You can then log in and start using CardMass</span>
              </li>
            </ol>
          </div>

          {/* Help */}
          <div className="text-center text-sm text-gray-600 mb-6">
            <p>
              Need help?{' '}
              <a
                href="mailto:support@doneisbetter.com"
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Contact support
              </a>
            </p>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
            >
              Check Status
            </button>
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
