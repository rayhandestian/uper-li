'use client'

export default function ManualCronJobs() {
  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
          Manual Maintenance Tasks
        </h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <button
            onClick={async () => {
              if (!confirm('Are you sure you want to run the monthly reset? This will reset all users\' monthly link creation counts and custom URL change limits.')) return;
              const response = await fetch('/api/admin/cron', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'monthly_reset' })
              })
              const result = await response.json()
              alert(result.success ? `Reset completed: ${result.usersUpdated} users and ${result.linksUpdated} links updated` : `Error: ${result.error}`)
            }}
            className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            Run Monthly Reset
          </button>
          <button
            onClick={async () => {
              if (!confirm('Are you sure you want to run the link cleanup? This will deactivate links that haven\'t been visited in 5 months.')) return;
              const response = await fetch('/api/admin/cron', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'link_cleanup' })
              })
              const result = await response.json()
              alert(result.success ? `Cleanup completed: ${result.linksDeactivated} links deactivated` : `Error: ${result.error}`)
            }}
            className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
          >
            Run Link Cleanup
          </button>
        </div>
        <p className="mt-2 text-sm text-gray-500">
          These tasks normally run automatically via cron jobs.
        </p>
      </div>
    </div>
  )
}