import { Link } from 'react-router-dom';
import { dashboardAPI } from '../api/services';
import useApi from '../hooks/useApi';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/common/LoadingSpinner';
import StatCard from '../components/common/StatCard';
import { StatusBadge, PriorityBadge } from '../components/common/Badges';

const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—';
const isOverdue = (task) => task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'Completed';

export default function Dashboard() {
  const { user } = useAuth();
  const { data, loading, error } = useApi(() => dashboardAPI.get());

  if (loading) return <LoadingSpinner />;
  if (error) return <div className="text-red-600 text-sm">{error}</div>;

  const { tasks, myTasks, projects, recentTasks } = data || {};

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Good {getGreeting()}, {user?.name?.split(' ')[0]} 👋</h2>
        <p className="text-gray-500 text-sm mt-1">Here's what's happening with your projects today</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        <StatCard label="Total Projects" value={projects?.total} color="brand" icon="◫" />
        <StatCard label="Total Tasks" value={tasks?.total} color="blue" icon="☑" />
        <StatCard label="Completed" value={tasks?.completed} color="green" icon="✓" />
        <StatCard label="In Progress" value={tasks?.inProgress} color="amber" icon="◑" />
        <StatCard label="Overdue" value={tasks?.overdue} color="red" icon="⚠" />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* My Tasks */}
        <div className="card p-5">
          <h3 className="font-semibold text-gray-900 mb-4">My Tasks</h3>
          <div className="space-y-3">
            {[
              { label: 'To Do', value: myTasks?.Todo || 0, color: 'bg-gray-200' },
              { label: 'In Progress', value: myTasks?.['In Progress'] || 0, color: 'bg-blue-400' },
              { label: 'Completed', value: myTasks?.Completed || 0, color: 'bg-green-400' },
            ].map((item) => (
              <div key={item.label}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">{item.label}</span>
                  <span className="font-medium text-gray-900">{item.value}</span>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${item.color} rounded-full transition-all`}
                    style={{ width: myTasks?.total ? `${(item.value / myTasks.total) * 100}%` : '0%' }}
                  />
                </div>
              </div>
            ))}
            <p className="text-xs text-gray-400 pt-1">Total assigned: {myTasks?.total || 0}</p>
          </div>
        </div>

        {/* Recent Tasks */}
        <div className="card p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Recent Tasks</h3>
          </div>
          {recentTasks?.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">No tasks yet</p>
          ) : (
            <div className="space-y-3">
              {recentTasks?.map((task) => (
                <div key={task._id} className={`flex items-start gap-3 p-3 rounded-lg border ${isOverdue(task) ? 'border-red-200 bg-red-50' : 'border-gray-100 bg-gray-50'}`}>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{task.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {task.project?.name} · Due {formatDate(task.dueDate)}
                      {isOverdue(task) && <span className="text-red-600 ml-1">· Overdue</span>}
                    </p>
                  </div>
                  <div className="flex flex-col gap-1 items-end flex-shrink-0">
                    <StatusBadge status={task.status} />
                    <PriorityBadge priority={task.priority} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Projects list */}
      {projects?.list?.length > 0 && (
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Your Projects</h3>
            <Link to="/projects" className="text-sm text-brand-600 hover:underline font-medium">View all →</Link>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {projects.list.map((p) => (
              <Link key={p._id} to={`/projects/${p._id}`} className="group p-3 rounded-lg border border-gray-200 hover:border-brand-300 hover:bg-brand-50 transition-colors">
                <p className="text-sm font-medium text-gray-900 group-hover:text-brand-700 truncate">{p.name}</p>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}
