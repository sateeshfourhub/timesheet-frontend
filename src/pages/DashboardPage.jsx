import { useAuth } from '../context/AuthContext'
import Layout from '../components/Layout'
import WeeklyTimesheetView from '../components/WeeklyTimesheetView'

export default function DashboardPage() {
  const { user } = useAuth()

  return (
    <Layout>
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900">
          Weekly Timesheet
        </h2>
        <p className="text-sm text-gray-400 mt-1">
          Tap any day to log your hours
        </p>
      </div>
      <WeeklyTimesheetView />
    </Layout>
  )
}
