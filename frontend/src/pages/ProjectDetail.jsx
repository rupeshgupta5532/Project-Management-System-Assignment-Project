import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { projectsAPI, usersAPI } from '../api/services';
import useApi from '../hooks/useApi';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Modal from '../components/common/Modal';

export default function ProjectDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: project, loading, refetch } = useApi(() => projectsAPI.getOne(id), [id]);
  const { data: allUsers } = useApi(() => usersAPI.getAll());

  const [showAddMember, setShowAddMember] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [memberEmail, setMemberEmail] = useState('');
  const [memberRole, setMemberRole] = useState('member');
  const [editForm, setEditForm] = useState({ name: '', description: '' });
  const [submitting, setSubmitting] = useState(false);

  if (loading) return <LoadingSpinner />;
  if (!project) return <div className="text-gray-500">Project not found.</div>;

  const myMembership = project.members?.find((m) => m.user?._id === user._id);
  const isProjectAdmin = myMembership?.role === 'admin' || user.role === 'admin';

  const openEdit = () => {
    setEditForm({ name: project.name, description: project.description || '' });
    setShowEdit(true);
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await projectsAPI.update(id, editForm);
      toast.success('Project updated');
      setShowEdit(false);
      refetch();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await projectsAPI.addMember(id, { email: memberEmail, role: memberRole });
      toast.success('Member added');
      setShowAddMember(false);
      setMemberEmail('');
      setMemberRole('member');
      refetch();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add member');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemoveMember = async (memberId, name) => {
    if (!window.confirm(`Remove ${name} from this project?`)) return;
    try {
      await projectsAPI.removeMember(id, memberId);
      toast.success('Member removed');
      refetch();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to remove');
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Delete "${project.name}"? This cannot be undone.`)) return;
    try {
      await projectsAPI.delete(id);
      toast.success('Project deleted');
      navigate('/projects');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
            <Link to="/projects" className="hover:text-brand-600">Projects</Link>
            <span>/</span>
            <span className="text-gray-900 font-medium truncate">{project.name}</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900">{project.name}</h2>
          {project.description && (
            <p className="text-gray-500 text-sm mt-1">{project.description}</p>
          )}
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <Link to={`/projects/${id}/tasks`} className="btn-primary">
            View Tasks
          </Link>
          {isProjectAdmin && (
            <>
              <button onClick={openEdit} className="btn-secondary">Edit</button>
              <button onClick={handleDelete} className="btn-danger">Delete</button>
            </>
          )}
        </div>
      </div>

      {/* Info cards */}
      <div className="grid sm:grid-cols-3 gap-4">
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-gray-900">{project.members?.length || 0}</p>
          <p className="text-sm text-gray-500 mt-1">Members</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-gray-900">{new Date(project.createdAt).toLocaleDateString()}</p>
          <p className="text-sm text-gray-500 mt-1">Created</p>
        </div>
        <div className="card p-4 text-center">
          <span className={`badge text-sm ${project.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
            {project.status}
          </span>
          <p className="text-sm text-gray-500 mt-1">Status</p>
        </div>
      </div>

      {/* Members */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">Team Members</h3>
          {isProjectAdmin && (
            <button onClick={() => setShowAddMember(true)} className="btn-secondary text-xs">
              + Add Member
            </button>
          )}
        </div>
        <div className="divide-y divide-gray-100">
          {project.members?.map((m) => (
            <div key={m.user?._id} className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center font-semibold text-sm">
                  {m.user?.name?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{m.user?.name}</p>
                  <p className="text-xs text-gray-500">{m.user?.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`badge ${m.role === 'admin' ? 'bg-brand-100 text-brand-700' : 'bg-gray-100 text-gray-600'}`}>
                  {m.role}
                </span>
                {isProjectAdmin && m.user?._id !== project.owner?._id && (
                  <button
                    onClick={() => handleRemoveMember(m.user._id, m.user.name)}
                    className="text-xs text-red-500 hover:underline"
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Edit Project Modal */}
      <Modal isOpen={showEdit} onClose={() => setShowEdit(false)} title="Edit Project">
        <form onSubmit={handleEdit} className="space-y-4">
          <div>
            <label className="label">Project Name *</label>
            <input className="input" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} required />
          </div>
          <div>
            <label className="label">Description</label>
            <textarea className="input resize-none" rows={3} value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} />
          </div>
          <div className="flex gap-3 justify-end">
            <button type="button" onClick={() => setShowEdit(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={submitting} className="btn-primary">{submitting ? 'Saving…' : 'Save'}</button>
          </div>
        </form>
      </Modal>

      {/* Add Member Modal */}
      <Modal isOpen={showAddMember} onClose={() => setShowAddMember(false)} title="Add Member">
        <form onSubmit={handleAddMember} className="space-y-4">
          <div>
            <label className="label">Email Address *</label>
            <input
              type="email"
              className="input"
              placeholder="member@example.com"
              value={memberEmail}
              onChange={(e) => setMemberEmail(e.target.value)}
              required
            />
            {allUsers && (
              <p className="text-xs text-gray-400 mt-1">
                {allUsers.length} user{allUsers.length !== 1 ? 's' : ''} registered
              </p>
            )}
          </div>
          <div>
            <label className="label">Role</label>
            <select className="input" value={memberRole} onChange={(e) => setMemberRole(e.target.value)}>
              <option value="member">Member</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div className="flex gap-3 justify-end">
            <button type="button" onClick={() => setShowAddMember(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={submitting} className="btn-primary">{submitting ? 'Adding…' : 'Add Member'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
