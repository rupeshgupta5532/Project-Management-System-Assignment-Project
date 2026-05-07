import { useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { projectsAPI } from '../api/services';
import useApi from '../hooks/useApi';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/common/LoadingSpinner';
import EmptyState from '../components/common/EmptyState';
import Modal from '../components/common/Modal';

export default function Projects() {
  const { isAdmin } = useAuth();
  const { data: projects, loading, refetch } = useApi(() => projectsAPI.getAll());
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', description: '' });
  const [submitting, setSubmitting] = useState(false);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSubmitting(true);
    try {
      await projectsAPI.create(form);
      toast.success('Project created!');
      setShowCreate(false);
      setForm({ name: '', description: '' });
      refetch();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create project');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Projects</h2>
          <p className="text-gray-500 text-sm mt-1">{projects?.length || 0} project{projects?.length !== 1 ? 's' : ''}</p>
        </div>
        {isAdmin && (
          <button onClick={() => setShowCreate(true)} className="btn-primary">
            + New Project
          </button>
        )}
      </div>

      {!projects?.length ? (
        <EmptyState
          icon="◫"
          title="No projects yet"
          description={isAdmin ? 'Create your first project to get started.' : 'You have not been added to any projects.'}
          action={isAdmin && <button onClick={() => setShowCreate(true)} className="btn-primary">Create Project</button>}
        />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project) => (
            <ProjectCard key={project._id} project={project} onDelete={refetch} isAdmin={isAdmin} />
          ))}
        </div>
      )}

      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Create New Project">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="label">Project Name *</label>
            <input
              className="input"
              placeholder="e.g. Website Redesign"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="label">Description</label>
            <textarea
              className="input resize-none"
              rows={3}
              placeholder="What is this project about?"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
          <div className="flex gap-3 justify-end">
            <button type="button" onClick={() => setShowCreate(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={submitting} className="btn-primary">
              {submitting ? 'Creating…' : 'Create Project'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

function ProjectCard({ project, onDelete, isAdmin }) {
  const progress = project.taskCount ? Math.round((project.completedCount / project.taskCount) * 100) : 0;

  const handleDelete = async () => {
    if (!window.confirm(`Delete "${project.name}"? This will also delete all tasks.`)) return;
    try {
      await projectsAPI.delete(project._id);
      toast.success('Project deleted');
      onDelete();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete');
    }
  };

  return (
    <div className="card p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-2">
        <Link to={`/projects/${project._id}`} className="font-semibold text-gray-900 hover:text-brand-600 transition-colors line-clamp-1">
          {project.name}
        </Link>
        <span className={`badge ml-2 flex-shrink-0 ${project.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
          {project.status}
        </span>
      </div>

      {project.description && (
        <p className="text-sm text-gray-500 mb-4 line-clamp-2">{project.description}</p>
      )}

      <div className="mb-4">
        <div className="flex justify-between text-xs text-gray-500 mb-1">
          <span>{project.completedCount}/{project.taskCount} tasks</span>
          <span>{progress}%</span>
        </div>
        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full bg-brand-500 rounded-full transition-all" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>{project.members?.length || 0} member{project.members?.length !== 1 ? 's' : ''}</span>
        <div className="flex gap-2">
          <Link to={`/projects/${project._id}`} className="text-brand-600 hover:underline font-medium">View</Link>
          {isAdmin && (
            <button onClick={handleDelete} className="text-red-500 hover:underline font-medium">Delete</button>
          )}
        </div>
      </div>
    </div>
  );
}
