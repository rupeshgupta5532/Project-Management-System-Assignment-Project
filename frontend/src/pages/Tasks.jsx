import { useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { tasksAPI, projectsAPI, usersAPI } from '../api/services';
import useApi from '../hooks/useApi';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/common/LoadingSpinner';
import EmptyState from '../components/common/EmptyState';
import Modal from '../components/common/Modal';
import { StatusBadge, PriorityBadge } from '../components/common/Badges';

const STATUSES = ['Todo', 'In Progress', 'Completed'];
const PRIORITIES = ['Low', 'Medium', 'High'];

const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';
const isOverdue = (task) => task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'Completed';

export default function Tasks() {
  const { id: projectId } = useParams();
  const { user } = useAuth();

  const [filters, setFilters] = useState({ status: '', priority: '', search: '' });
  const [showModal, setShowModal] = useState(false);
  const [editTask, setEditTask] = useState(null);

  const { data: project } = useApi(() => projectsAPI.getOne(projectId), [projectId]);
  const { data: allUsers } = useApi(() => usersAPI.getAll());
  const { data: tasksData, loading, refetch } = useApi(
    () => tasksAPI.getAll(projectId, { status: filters.status, priority: filters.priority, search: filters.search }),
    [projectId, filters.status, filters.priority, filters.search]
  );

  const myMembership = project?.members?.find((m) => m.user?._id === user._id);
  const isProjectAdmin = myMembership?.role === 'admin' || user.role === 'admin';

  // Only show users who are project members
  const projectMembers = project?.members?.map((m) => m.user).filter(Boolean) || [];

  const openCreate = () => { setEditTask(null); setShowModal(true); };
  const openEdit = (task) => { setEditTask(task); setShowModal(true); };

  const handleDelete = async (taskId) => {
    if (!window.confirm('Delete this task?')) return;
    try {
      await tasksAPI.delete(projectId, taskId);
      toast.success('Task deleted');
      refetch();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    }
  };

  const handleStatusChange = async (task, newStatus) => {
    try {
      await tasksAPI.update(projectId, task._id, { status: newStatus });
      toast.success('Status updated');
      refetch();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    }
  };

  if (loading && !tasksData) return <LoadingSpinner />;

  const tasks = tasksData?.tasks || [];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
            <Link to="/projects" className="hover:text-brand-600">Projects</Link>
            <span>/</span>
            <Link to={`/projects/${projectId}`} className="hover:text-brand-600">{project?.name || '…'}</Link>
            <span>/</span>
            <span className="text-gray-900">Tasks</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Tasks</h2>
          <p className="text-gray-500 text-sm mt-1">{tasksData?.pagination?.total || 0} task{tasksData?.pagination?.total !== 1 ? 's' : ''}</p>
        </div>
        {isProjectAdmin && (
          <button onClick={openCreate} className="btn-primary flex-shrink-0">+ New Task</button>
        )}
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-wrap gap-3">
          <input
            className="input flex-1 min-w-[180px]"
            placeholder="Search tasks…"
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          />
          <select
            className="input w-auto"
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          >
            <option value="">All Statuses</option>
            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <select
            className="input w-auto"
            value={filters.priority}
            onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
          >
            <option value="">All Priorities</option>
            {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
          {(filters.search || filters.status || filters.priority) && (
            <button onClick={() => setFilters({ status: '', priority: '', search: '' })} className="btn-ghost text-sm">
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Task list */}
      {loading ? (
        <LoadingSpinner />
      ) : tasks.length === 0 ? (
        <EmptyState
          icon="☑"
          title="No tasks found"
          description={isProjectAdmin ? 'Create the first task for this project.' : 'No tasks match your filters.'}
          action={isProjectAdmin && <button onClick={openCreate} className="btn-primary">Create Task</button>}
        />
      ) : (
        <div className="space-y-2">
          {tasks.map((task) => (
            <TaskRow
              key={task._id}
              task={task}
              isProjectAdmin={isProjectAdmin}
              currentUserId={user._id}
              onEdit={() => openEdit(task)}
              onDelete={() => handleDelete(task._id)}
              onStatusChange={(s) => handleStatusChange(task, s)}
            />
          ))}
        </div>
      )}

      {/* Task Modal */}
      {showModal && (
        <TaskModal
          task={editTask}
          projectId={projectId}
          members={projectMembers}
          isProjectAdmin={isProjectAdmin}
          onClose={() => setShowModal(false)}
          onSuccess={() => { setShowModal(false); refetch(); }}
        />
      )}
    </div>
  );
}

function TaskRow({ task, isProjectAdmin, currentUserId, onEdit, onDelete, onStatusChange }) {
  const isAssignee = task.assignedTo?._id === currentUserId;
  const canChangeStatus = isProjectAdmin || isAssignee;

  return (
    <div className={`card p-4 flex flex-col sm:flex-row sm:items-center gap-3 ${isOverdue(task) ? 'border-red-200' : ''}`}>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium text-gray-900 text-sm">{task.title}</span>
          {isOverdue(task) && <span className="badge bg-red-100 text-red-700 text-xs">Overdue</span>}
        </div>
        {task.description && (
          <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{task.description}</p>
        )}
        <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-400">
          <span>Due: {formatDate(task.dueDate)}</span>
          {task.assignedTo && <span>→ {task.assignedTo.name}</span>}
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <PriorityBadge priority={task.priority} />

        {/* Status dropdown */}
        {canChangeStatus ? (
          <select
            value={task.status}
            onChange={(e) => onStatusChange(e.target.value)}
            className="text-xs border border-gray-200 rounded-lg px-2 py-1 bg-white text-gray-700 focus:outline-none focus:ring-1 focus:ring-brand-500 cursor-pointer"
          >
            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        ) : (
          <StatusBadge status={task.status} />
        )}

        {isProjectAdmin && (
          <div className="flex gap-1">
            <button onClick={onEdit} className="btn-ghost text-xs px-2 py-1">Edit</button>
            <button onClick={onDelete} className="btn-ghost text-xs px-2 py-1 text-red-500 hover:bg-red-50">Del</button>
          </div>
        )}
      </div>
    </div>
  );
}

function TaskModal({ task, projectId, members, isProjectAdmin, onClose, onSuccess }) {
  const isEdit = !!task;
  const [form, setForm] = useState({
    title: task?.title || '',
    description: task?.description || '',
    priority: task?.priority || 'Medium',
    status: task?.status || 'Todo',
    dueDate: task?.dueDate ? task.dueDate.slice(0, 10) : '',
    assignedTo: task?.assignedTo?._id || '',
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    setSubmitting(true);
    try {
      const payload = { ...form, assignedTo: form.assignedTo || undefined, dueDate: form.dueDate || undefined };
      if (isEdit) {
        await tasksAPI.update(projectId, task._id, payload);
        toast.success('Task updated');
      } else {
        await tasksAPI.create(projectId, payload);
        toast.success('Task created');
      }
      onSuccess();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save task');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen onClose={onClose} title={isEdit ? 'Edit Task' : 'Create Task'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label">Title *</label>
          <input className="input" placeholder="Task title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
        </div>
        <div>
          <label className="label">Description</label>
          <textarea className="input resize-none" rows={2} placeholder="Optional description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Priority</label>
            <select className="input" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
              {['Low', 'Medium', 'High'].map((p) => <option key={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Status</label>
            <select className="input" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              {['Todo', 'In Progress', 'Completed'].map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Due Date</label>
            <input type="date" className="input" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
          </div>
          <div>
            <label className="label">Assign To</label>
            <select className="input" value={form.assignedTo} onChange={(e) => setForm({ ...form, assignedTo: e.target.value })}>
              <option value="">Unassigned</option>
              {members.map((m) => <option key={m._id} value={m._id}>{m.name}</option>)}
            </select>
          </div>
        </div>
        <div className="flex gap-3 justify-end pt-1">
          <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
          <button type="submit" disabled={submitting} className="btn-primary">
            {submitting ? 'Saving…' : isEdit ? 'Update Task' : 'Create Task'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
