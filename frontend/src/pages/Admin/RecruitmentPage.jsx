import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../../utils/api';
import { formatDate } from '../../utils/helpers';
import Modal from '../../components/UI/Modal';

const PC = [
  { bg: 'bg-violet-500', light: 'bg-violet-50', text: 'text-violet-700', border: 'border-violet-200' },
  { bg: 'bg-violet-500',   light: 'bg-violet-50',   text: 'text-violet-700',   border: 'border-violet-200'   },
  { bg: 'bg-amber-500',  light: 'bg-amber-50',  text: 'text-amber-700',  border: 'border-amber-200'  },
  { bg: 'bg-violet-500',  light: 'bg-violet-50',  text: 'text-violet-700',  border: 'border-violet-200'  },
  { bg: 'bg-gray-200',   light: 'bg-gray-100',   text: 'text-gray-900',   border: 'border-gray-200'   },
];
const colorFor = (i) => PC[i % PC.length];

export default function RecruitmentPage() {
  const navigate = useNavigate();
  const [projects, setProjects]       = useState([]);
  const [loading, setLoading]         = useState(true);
  const [showForm, setShowForm]       = useState(false);
  const [form, setForm]               = useState({ name: '', description: '' });
  const [submitting, setSubmitting]   = useState(false);
  const [editProject, setEditProject] = useState(null);
  const [editForm, setEditForm]       = useState({ name: '', description: '' });

  const fetchProjects = async () => {
    setLoading(true);
    try { const r = await api.get('/recruitment/projects'); setProjects(r.data); }
    catch { toast.error('Failed to load projects'); }
    finally { setLoading(false); }
  };
  useEffect(() => { fetchProjects(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error('Project name required');
    setSubmitting(true);
    try {
      const r = await api.post('/recruitment/projects', form);
      setProjects(prev => [r.data, ...prev]);
      setForm({ name: '', description: '' });
      setShowForm(false);
      toast.success('Project created');
      navigate('/admin/recruitment/p/' + r.data._id);
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setSubmitting(false); }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!editForm.name.trim()) return toast.error('Name required');
    try {
      await api.put('/recruitment/projects/' + editProject._id, editForm);
      setProjects(prev => prev.map(p => p._id === editProject._id ? { ...p, ...editForm } : p));
      setEditProject(null); toast.success('Updated');
    } catch { toast.error('Failed'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this project? Jobs will be unassigned.')) return;
    try {
      await api.delete('/recruitment/projects/' + id);
      setProjects(prev => prev.filter(p => p._id !== id));
      toast.success('Deleted');
    } catch { toast.error('Failed'); }
  };

  return (
    <div className='max-w-6xl mx-auto px-3 sm:px-4 space-y-5 animate-fade-in'>
      <div className='flex items-center justify-between'>
        <div>
          <h2 className='page-title'>Recruitment</h2>
          <p className='page-subtitle'>Manage projects, job postings and candidate pipelines</p>
        </div>
        <button onClick={() => setShowForm(v => !v)} className='btn-primary btn-sm'>
          {showForm ? 'Cancel' : '+ Add Project'}
        </button>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className='glass-card p-4'>
            <h3 className='font-bold text-violet-900 mb-3'>New Project</h3>
            <form onSubmit={handleCreate} className='space-y-3'>
              <div className='grid sm:grid-cols-2 gap-3'>
                <div>
                  <label className='label-text'>Project Name *</label>
                  <input className='input-field' placeholder='e.g. Lancesoft' value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                </div>
                <div>
                  <label className='label-text'>Description</label>
                  <input className='input-field' placeholder='Short description (optional)' value={form.description}
                    onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
                </div>
              </div>
              <div className='flex gap-3 justify-end'>
                <button type='button' onClick={() => setShowForm(false)} className='btn-secondary btn-sm'>Cancel</button>
                <button type='submit' disabled={submitting} className='btn-primary btn-sm'>{submitting ? 'Creating...' : 'Create Project'}</button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {loading ? (
        <p className='text-center text-sm text-violet-400 py-16'>Loading...</p>
      ) : projects.length === 0 ? (
        <div className='glass-card p-16 text-center'>
          <div className='w-16 h-16 bg-violet-100 rounded-2xl flex items-center justify-center mx-auto mb-4'>
            <svg className='w-8 h-8 text-violet-400' fill='none' stroke='currentColor' strokeWidth={1.5} viewBox='0 0 24 24'>
              <path strokeLinecap='round' strokeLinejoin='round' d='M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z' />
            </svg>
          </div>
          <p className='text-gray-500 font-semibold mb-1'>No projects yet</p>
          <p className='text-sm text-gray-400 mb-4'>Create a project to organise your recruitment pipeline.</p>
          <button onClick={() => setShowForm(true)} className='btn-primary btn-sm'>Create First Project</button>
        </div>
      ) : (
        <div className='grid sm:grid-cols-2 lg:grid-cols-3 gap-4'>
          {projects.map((project, idx) => {
            const clr = colorFor(idx);
            return (
              <motion.div key={project._id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                onClick={() => navigate('/admin/recruitment/p/' + project._id)}
                className='glass-card p-5 cursor-pointer hover:shadow-lg hover:-translate-y-1 transition-all group'>
                <div className='flex items-start gap-3 mb-4'>
                  <div className={clr.bg + ' w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm'}>
                    <svg className='w-5 h-5 text-white' fill='none' stroke='currentColor' strokeWidth={1.75} viewBox='0 0 24 24'>
                      <path strokeLinecap='round' strokeLinejoin='round' d='M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z' />
                    </svg>
                  </div>
                  <div className='flex-1 min-w-0'>
                    <h3 className='font-bold text-violet-900 group-hover:text-violet-700 transition-colors truncate text-lg'>{project.name}</h3>
                    {project.description && <p className='text-xs text-gray-400 truncate mt-0.5'>{project.description}</p>}
                  </div>
                  <svg className='w-5 h-5 text-violet-300 group-hover:text-violet-500 flex-shrink-0 transition-colors mt-0.5' fill='none' stroke='currentColor' strokeWidth={2} viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' d='M9 5l7 7-7 7' />
                  </svg>
                </div>
                <div className='flex gap-3 mb-4'>
                  <div className={clr.light + ' flex-1 rounded-xl border ' + clr.border + ' px-3 py-2 text-center'}>
                    <p className={clr.text + ' text-2xl font-bold'}>{project.jobCount}</p>
                    <p className={clr.text + ' text-[10px] font-semibold'}>Jobs</p>
                  </div>
                  <div className='flex-1 rounded-xl bg-gray-50 border border-gray-200 px-3 py-2 text-center'>
                    <p className='text-2xl font-bold text-gray-700'>{project.resumeCount}</p>
                    <p className='text-[10px] font-semibold text-gray-500'>Resumes</p>
                  </div>
                  <div className='flex-1 rounded-xl bg-amber-50 border border-amber-200 px-3 py-2 text-center'>
                    <p className='text-2xl font-bold text-amber-700'>{project.shortlisted}</p>
                    <p className='text-[10px] font-semibold text-amber-600'>Shortlisted</p>
                  </div>
                </div>
                <div className='flex items-center justify-between border-t border-gray-100 pt-3' onClick={e => e.stopPropagation()}>
                  <span className='text-[10px] text-gray-400'>{formatDate(project.createdAt)}</span>
                  <div className='flex gap-3'>
                    <button onClick={() => { setEditProject(project); setEditForm({ name: project.name, description: project.description || '' }); }}
                      className='text-[10px] font-semibold text-violet-500 hover:text-violet-700 transition-colors'>Rename</button>
                    <button onClick={() => handleDelete(project._id)}
                      className='text-[10px] font-semibold text-gray-900 hover:text-gray-900 transition-colors'>Delete</button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      <Modal isOpen={!!editProject} onClose={() => setEditProject(null)} title='Rename Project' size='sm'>
        {editProject && (
          <form onSubmit={handleUpdate} className='space-y-3'>
            <div><label className='label-text'>Project Name *</label>
              <input className='input-field' value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} /></div>
            <div><label className='label-text'>Description</label>
              <input className='input-field' value={editForm.description} onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))} /></div>
            <div className='flex gap-3 justify-end pt-1'>
              <button type='button' onClick={() => setEditProject(null)} className='btn-secondary btn-sm'>Cancel</button>
              <button type='submit' className='btn-primary btn-sm'>Save</button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}