import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-3xl w-full bg-white rounded-lg shadow-xl p-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          HubSpot Multi-Region Dashboard
        </h1>
        <p className="text-lg text-gray-600 mb-8">
          Multi-region pipeline management and forecast calculation for 5 global offices
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-blue-50 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-blue-900 mb-2">
              📊 Dashboard
            </h2>
            <p className="text-sm text-blue-700 mb-4">
              Global and regional pipeline overview
            </p>
            <Link
              href="/dashboard"
              className="inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
            >
              View Dashboard
            </Link>
          </div>

          <div className="bg-green-50 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-green-900 mb-2">
              🧪 API Test
            </h2>
            <p className="text-sm text-green-700 mb-4">
              Test API endpoints and view data
            </p>
            <Link
              href="/test"
              className="inline-block bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition"
            >
              Open Test Page
            </Link>
          </div>

          <div className="bg-purple-50 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-purple-900 mb-2">
              🎯 Targets
            </h2>
            <p className="text-sm text-purple-700 mb-4">
              Manage quarterly targets and bulk operations
            </p>
            <Link
              href="/targets"
              className="inline-block bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 transition"
            >
              Manage Targets
            </Link>
          </div>

          <div className="bg-orange-50 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-orange-900 mb-2">
              🌍 Regions
            </h2>
            <p className="text-sm text-orange-700 mb-4">
              US, APAC, India, Japan, Europe
            </p>
            <div className="text-2xl">
              🇺🇸 🌏 🇮🇳 🇯🇵 🇪🇺
            </div>
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            ✅ Completed Features
          </h3>
          <ul className="space-y-2 text-sm text-gray-700">
            <li>✓ Database setup with Prisma + SQLite</li>
            <li>✓ 5 regional configurations (MD files)</li>
            <li>✓ Mock data generation (320 deals across 5 regions)</li>
            <li>✓ Currency conversion (USD, JPY, INR)</li>
            <li>✓ GET /api/regions - List all regions</li>
            <li>✓ GET /api/deals - List deals with filters</li>
            <li>✓ GET /api/forecast - Calculate forecast with targets</li>
            <li>✓ Global & Regional Dashboard with charts</li>
            <li>✓ Target Management with bulk operations</li>
          </ul>
        </div>

        <div className="mt-6 text-center text-sm text-gray-500">
          Phase 1-2 & 4-5 Complete • Next.js 15 + TypeScript + Prisma + Recharts
        </div>
      </div>
    </div>
  );
}
