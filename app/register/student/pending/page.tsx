"use client";

export default function StudentPendingPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto text-center">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="mb-6">
            <div className="mx-auto w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center">
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
          <h1 className="text-3xl font-bold text-primary-blue mb-4">
            Registration Pending Approval
          </h1>
          <p className="text-gray-600 mb-6">
            Your registration has been submitted successfully! Your Science Research Advisor has been notified and will review your registration.
          </p>
          <p className="text-gray-600 mb-6">
            You will receive an email once your registration has been approved. You can then log in to your dashboard to upload your research plan and abstract.
          </p>
          <div className="space-y-4">
            <a
              href="/login"
              className="inline-block bg-primary-green text-white py-2 px-6 rounded-md hover:bg-primary-darkGreen"
            >
              Go to Login
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
