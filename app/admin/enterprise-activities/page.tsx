import { PageContainer } from "@/components/page-container"
import { EnterpriseActivityForm } from "./enterprise-form"
import { ActivityStats } from "./activity-stats"
import { ActivityAnalytics } from "./activity-analytics"

export default function EnterpriseActivitiesPage() {
  return (
    <PageContainer>
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Enterprise Activity Management</h1>
          <p className="text-muted-foreground">
            High-performance activity generation with enterprise-grade features including batching, 
            deduplication, validation, and analytics.
          </p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Activity Statistics */}
          <div className="lg:col-span-1">
            <ActivityStats />
          </div>
          
          {/* Activity Analytics */}
          <div className="lg:col-span-2">
            <ActivityAnalytics />
          </div>
        </div>
        
        <div className="mt-8">
          <EnterpriseActivityForm />
        </div>
        
        <div className="mt-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">Enterprise Features</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-md border border-blue-100">
              <h4 className="font-medium text-blue-800 mb-2">🚀 Performance</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Batch processing (100+ records)</li>
                <li>• Parallel entity queries</li>
                <li>• Optimized database operations</li>
              </ul>
            </div>
            
            <div className="bg-white p-4 rounded-md border border-blue-100">
              <h4 className="font-medium text-blue-800 mb-2">🛡️ Data Integrity</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Duplicate prevention</li>
                <li>• Activity type validation</li>
                <li>• Comprehensive error handling</li>
              </ul>
            </div>
            
            <div className="bg-white p-4 rounded-md border border-blue-100">
              <h4 className="font-medium text-blue-800 mb-2">📊 Analytics</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Real-time statistics</li>
                <li>• Activity breakdowns</li>
                <li>• Performance metrics</li>
              </ul>
            </div>
            
            <div className="bg-white p-4 rounded-md border border-blue-100">
              <h4 className="font-medium text-blue-800 mb-2">🔧 Configuration</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Customizable batch sizes</li>
                <li>• Entity type filtering</li>
                <li>• Metadata inclusion options</li>
              </ul>
            </div>
            
            <div className="bg-white p-4 rounded-md border border-blue-100">
              <h4 className="font-medium text-blue-800 mb-2">📈 Scalability</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Memory-efficient processing</li>
                <li>• Progress tracking</li>
                <li>• Error recovery</li>
              </ul>
            </div>
            
            <div className="bg-white p-4 rounded-md border border-blue-100">
              <h4 className="font-medium text-blue-800 mb-2">🎯 Precision</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Exact entity targeting</li>
                <li>• Detailed result reporting</li>
                <li>• Audit trail support</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </PageContainer>
  )
} 