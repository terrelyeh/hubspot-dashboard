import Link from "next/link";
import { BarChart3, TestTube2, Target, Globe2, CheckCircle2 } from "lucide-react";

export default function HomePageOptimized() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-slate-900 mb-4 tracking-tight">
            HubSpot Multi-Region Dashboard
          </h1>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto">
            Multi-region pipeline management and forecast calculation for{" "}
            <span className="font-semibold text-blue-700">5 global offices</span>
          </p>
        </div>

        {/* Main Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          {/* Dashboard Card */}
          <div className="group relative bg-white rounded-2xl p-8 shadow-lg border-2 border-slate-200 hover:border-blue-400 hover:shadow-2xl transition-all duration-300">
            <div className="absolute -top-4 -right-4 bg-blue-600 text-white px-4 py-1 rounded-full text-sm font-bold shadow-lg">
              ✨ NEW
            </div>
            <div className="flex items-center gap-4 mb-6">
              <div className="p-4 bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl shadow-lg group-hover:scale-110 transition-transform">
                <BarChart3 className="h-8 w-8 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Dashboard</h2>
                <p className="text-slate-500 text-sm font-medium">Data Visualization</p>
              </div>
            </div>
            <p className="text-slate-600 mb-6 leading-relaxed">
              Global and regional pipeline overview with interactive charts, KPI metrics, and real-time achievement tracking
            </p>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/30"
            >
              View Dashboard
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
            <div className="mt-6 pt-6 border-t border-slate-100 flex items-center gap-2 text-sm text-emerald-600 font-medium">
              <CheckCircle2 className="h-4 w-4" />
              <span>Professional UI with Skeleton Loading</span>
            </div>
          </div>

          {/* Targets Card */}
          <div className="group relative bg-white rounded-2xl p-8 shadow-lg border-2 border-slate-200 hover:border-purple-400 hover:shadow-2xl transition-all duration-300">
            <div className="absolute -top-4 -right-4 bg-purple-600 text-white px-4 py-1 rounded-full text-sm font-bold shadow-lg">
              ✨ NEW
            </div>
            <div className="flex items-center gap-4 mb-6">
              <div className="p-4 bg-gradient-to-br from-purple-500 to-purple-700 rounded-2xl shadow-lg group-hover:scale-110 transition-transform">
                <Target className="h-8 w-8 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Targets</h2>
                <p className="text-slate-500 text-sm font-medium">Goal Management</p>
              </div>
            </div>
            <p className="text-slate-600 mb-6 leading-relaxed">
              Manage quarterly targets with bulk operations, copy quarters with growth rates, and track performance
            </p>
            <Link
              href="/targets"
              className="inline-flex items-center gap-2 bg-purple-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-purple-700 transition-colors shadow-lg shadow-purple-600/30"
            >
              Manage Targets
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
            <div className="mt-6 pt-6 border-t border-slate-100 flex items-center gap-2 text-sm text-emerald-600 font-medium">
              <CheckCircle2 className="h-4 w-4" />
              <span>Bulk Operations & Auto-dismiss Notifications</span>
            </div>
          </div>

          {/* API Test Card */}
          <div className="group bg-white rounded-2xl p-8 shadow-lg border-2 border-slate-200 hover:border-emerald-400 hover:shadow-2xl transition-all duration-300">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-4 bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-2xl shadow-lg group-hover:scale-110 transition-transform">
                <TestTube2 className="h-8 w-8 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-900">API Test</h2>
                <p className="text-slate-500 text-sm font-medium">Development Tools</p>
              </div>
            </div>
            <p className="text-slate-600 mb-6 leading-relaxed">
              Test API endpoints, view raw data responses, and verify data integrity across all regions
            </p>
            <Link
              href="/test"
              className="inline-flex items-center gap-2 bg-emerald-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-600/30"
            >
              Open Test Page
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
          </div>

          {/* Regions Card */}
          <div className="group bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl p-8 shadow-lg border-2 border-slate-200 hover:border-blue-300 hover:shadow-2xl transition-all duration-300">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-4 bg-gradient-to-br from-slate-600 to-slate-800 rounded-2xl shadow-lg group-hover:scale-110 transition-transform">
                <Globe2 className="h-8 w-8 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Regions</h2>
                <p className="text-slate-500 text-sm font-medium">Global Coverage</p>
              </div>
            </div>
            <div className="grid grid-cols-5 gap-4 mb-6">
              {[
                { flag: '🇺🇸', name: 'US', color: 'blue' },
                { flag: '🌏', name: 'APAC', color: 'emerald' },
                { flag: '🇮🇳', name: 'India', color: 'amber' },
                { flag: '🇯🇵', name: 'Japan', color: 'purple' },
                { flag: '🇪🇺', name: 'Europe', color: 'red' },
              ].map((region) => (
                <div
                  key={region.name}
                  className="flex flex-col items-center p-3 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow"
                >
                  <span className="text-3xl mb-2">{region.flag}</span>
                  <span className="text-xs font-bold text-slate-700">{region.name}</span>
                </div>
              ))}
            </div>
            <p className="text-slate-600 text-sm">
              Unified dashboard for <strong>United States</strong>, <strong>Asia Pacific</strong>,{" "}
              <strong>India</strong>, <strong>Japan</strong>, and <strong>Europe</strong>
            </p>
          </div>
        </div>

        {/* Stats Section */}
        <div className="bg-white rounded-2xl p-8 shadow-lg border border-slate-200 mb-12">
          <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
            <CheckCircle2 className="h-6 w-6 text-emerald-600" />
            Completed Features
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-4">
            {[
              'Database setup with Prisma + SQLite',
              '5 regional configurations (MD files)',
              'Mock data generation (320 deals)',
              'Currency conversion (USD, JPY, INR)',
              'GET /api/regions - List all regions',
              'GET /api/deals - Comprehensive filters',
              'GET /api/forecast - Calculate forecast',
              'Global & Regional Dashboard',
              'Target Management with bulk ops',
            ].map((feature, index) => (
              <div key={index} className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-slate-700">{feature}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Technology Stack */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-8 border border-blue-200">
          <div className="text-center">
            <p className="text-sm font-bold text-blue-900 uppercase tracking-wide mb-2">
              Built with Modern Tech Stack
            </p>
            <p className="text-slate-600">
              Next.js 15 • TypeScript • Prisma • Tailwind CSS • Recharts • Lucide Icons
            </p>
            <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-sm">
              <div className="h-2 w-2 bg-emerald-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-semibold text-slate-700">
                Phase 1-2 & 4-5 Complete
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
