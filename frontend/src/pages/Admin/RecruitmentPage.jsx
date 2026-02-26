import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../../utils/api';
import { formatDate } from '../../utils/helpers';
import Modal from '../../components/UI/Modal';

const STAGES = [
  { key: 'applied',   label: 'Applied',   bg: 'bg-gray-100',   text: 'text-gray-700',   dot: 'bg-gray-400' },
  { key: 'screening', label: 'Screening', bg: 'bg-blue-100',   text: 'text-blue-700',   dot: 'bg-blue-500' },
  { key: 'interview', label: 'Interview', bg: 'bg-amber-100',  text: 'text-amber-700',  dot: 'bg-amber-500' },
  { key: 'offer',     label: 'Offer',     bg: 'bg-violet-100', text: 'text-violet-700', dot: 'bg-violet-500' },
  { key: 'hired',     label: 'Hired',     bg: 'bg-green-100',  text: 'text-green-700',  dot: 'bg-green-500' },
  { key: 'rejected',  label: 'Rejected',  bg: 'bg-red-100',    text: 'text-red-700',    dot: 'bg-red-400' },
];

const JOB_TYPES = { 'full-time': 'Full-time', 'part-time': 'Part-time', contract: 'Contract', internship: 'Internship' };
const JOB_STATUS = {
  open:     { label: 'Open',     bg: 'bg-green-100',  text: 'text-green-700' },
  'on-hold':{ label: 'On Hold',  bg: 'bg-amber-100',  text: 'text-amber-700' },
  closed:   { label: 'Closed',   bg: 'bg-gray-100',   text: 'text-gray-600' },
};

const stageOf = (key) => STAGES.find(s => s.key === key) || STAGES[0];

const emptyJob = { title: '', department: '', location: '', type: 'full-time', description: '', requirements: '', openings: 1 };
const emptyApplicant = { name: '', email: '', phone: '', notes: '', jobPosting: '' };

const RecruitmentPage = () => {
  const [tab, setTab] = useState('jobs');
  const [jobs, setJobs] = useState([]);
  const [applicants, setApplicants] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);

  // Job form
  const [showJobForm, setShowJobForm] = useState(false);
  const [jobForm, setJobForm] = useState(emptyJob);
  const [jobSubmitting, setJobSubmitting] = useState(false);

  // Applicant form
  const [showApplicantForm, setShowApplicantForm] = useState(false);
  const [applicantForm, setApplicantForm] = useState(emptyApplicant);
  const [applicantSubmitting, setApplicantSubmitting] = useState(false);
  const [prefillJobId, setPrefillJobId] = useState('');

  // Filters
  const [jobFilter, setJobFilter] = useState('open');
  const [stageFilter, setStageFilter] = useState('');
  const [jobIdFilter, setJobIdFilter] = useState('');

  // Selected applicant
  const [selectedApplicant, setSelectedApplicant] = useState(null);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [jobsRes, appRes, statsRes] = await Promise.all([
        api.get(`/recruitment/jobs${jobFilter ? `?status=${jobFilter}` : ''}`),
        api.get(`/recruitment/applicants`),
        api.get('/recruitment/stats'),
      ]);
      setJobs(jobsRes.data);
      setApplicants(appRes.data);
      setStats(statsRes.data);
    } catch { toast.error('Failed to load data'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchAll(); }, [jobFilter]);

  const handleAddJob = async (e) => {
    e.preventDefault();
    if (!jobForm.title.trim()) return toast.error('Job title required');
    setJobSubmitting(true);
    try {
      await api.post('/recruitment/jobs', jobForm);
      toast.success('Job posting created');
      setJobForm(emptyJob);
      setShowJobForm(false);
      fetchAll();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setJobSubmitting(false); }
  };

  const handleJobStatusChange = async (id, status) => {
    try {
      await api.put(`/recruitment/jobs/${id}`, { status });
      setJobs(prev => prev.map(j => j._id === id ? { ...j, status } : j));
      toast.success('Updated');
    } catch { toast.error('Failed'); }
  };

  const handleDeleteJob = async (id) => {
    if (!window.confirm('Delete this job posting and all its applicants?')) return;
    try {
      await api.delete(`/recruitment/jobs/${id}`);
      setJobs(prev => prev.filter(j => j._id !== id));
      setApplicants(prev => prev.filter(a => a.jobPosting?._id !== id));
      toast.success('Deleted');
    } catch { toast.error('Failed'); }
  };

  const handleAddApplicant = async (e) => {
    e.preventDefault();
    if (!applicantForm.name.trim() || !applicantForm.jobPosting) return toast.error('Name and job required');
    setApplicantSubmitting(true);
    try {
      const r = await api.post('/recruitment/applicants', applicantForm);
      toast.success('Applicant added');
      setApplicants(prev => [r.data, ...prev]);
      setApplicantForm(emptyApplicant);
      setShowApplicantForm(false);
      fetchAll();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setApplicantSubmitting(false); }
  };

  const handleStageChange = async (id, stage) => {
    try {
      const r = await api.put(`/recruitment/applicants/${id}/stage`, { stage });
      setApplicants(prev => prev.map(a => a._id === id ? r.data : a));
      if (selectedApplicant?._id === id) setSelectedApplicant(r.data);
      toast.success('Stage updated');
      fetchAll();
    } catch { toast.error('Failed'); }
  };

  const handleDeleteApplicant = async (id) => {
    if (!window.confirm('Remove this applicant?')) return;
    try {
      await api.delete(`/recruitment/applicants/${id}`);
      setApplicants(prev => prev.filter(a => a._id !== id));
      setSelectedApplicant(null);
      fetchAll();
    } catch { toast.error('Failed'); }
  };

  const openAddApplicant = (jobId = '') => {
    setApplicantForm({ ...emptyApplicant, jobPosting: jobId });
    setPrefillJobId(jobId);
    setShowApplicantForm(true);
    setTab('applicants');
  };

  const filteredApplicants = applicants.filter(a => {
    if (stageFilter && a.stage !== stageFilter) return false;
    if (jobIdFilter && a.jobPosting?._id !== jobIdFilter) return false;
    return true;
  });

  return (
    <div className="max-w-6xl mx-auto px-3 sm:px-4 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Recruitment</h1>
          <p className="text-sm text-gray-500 mt-1">Manage job postings and applicant pipeline</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Open Positions',    value: stats.totalJobs,       bg: 'bg-violet-50', text: 'text-violet-700' },
          { label: 'Total Applicants',  value: stats.totalApplicants, bg: 'bg-blue-50',   text: 'text-blue-700' },
          { label: 'In Interview',      value: stats.inInterview,     bg: 'bg-amber-50',  text: 'text-amber-700' },
          { label: 'Hired',             value: stats.hired,           bg: 'bg-green-50',  text: 'text-green-700' },
        ].map(s => (
          <div key={s.label} className={`rounded-xl p-3 ${s.bg} flex items-center justify-between`}>
            <span className={`text-xs font-semibold ${s.text}`}>{s.label}</span>
            <span className={`text-2xl font-bold ${s.text}`}>{s.value ?? '—'}</span>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-violet-200">
        {[{ key: 'jobs', label: 'Job Postings' }, { key: 'applicants', label: 'Applicants Pipeline' }].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-2 font-semibold text-sm border-b-2 -mb-0.5 transition-colors ${
              tab === t.key ? 'text-violet-700 border-violet-700' : 'text-violet-400 border-transparent hover:text-violet-600'
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── JOBS TAB ── */}
      {tab === 'jobs' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex gap-2">
              {['open', 'on-hold', 'closed', ''].map(s => (
                <button key={s} onClick={() => setJobFilter(s)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                    jobFilter === s ? 'bg-violet-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-violet-50'
                  }`}>
                  {s ? JOB_STATUS[s]?.label : 'All'}
                </button>
              ))}
            </div>
            <button onClick={() => setShowJobForm(v => !v)} className="btn-primary btn-sm">
              {showJobForm ? 'Cancel' : '+ Post Job'}
            </button>
          </div>

          {/* Job Form */}
          <AnimatePresence>
            {showJobForm && (
              <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="glass-card p-5">
                <h3 className="font-bold text-violet-900 mb-4">New Job Posting</h3>
                <form onSubmit={handleAddJob} className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-3">
                    <div>
                      <label className="label-text">Job Title *</label>
                      <input className="input-field" placeholder="e.g. React Developer" value={jobForm.title}
                        onChange={e => setJobForm(f => ({ ...f, title: e.target.value }))} />
                    </div>
                    <div>
                      <label className="label-text">Department</label>
                      <input className="input-field" placeholder="e.g. Engineering" value={jobForm.department}
                        onChange={e => setJobForm(f => ({ ...f, department: e.target.value }))} />
                    </div>
                    <div>
                      <label className="label-text">Location</label>
                      <input className="input-field" placeholder="e.g. Hyderabad / Remote" value={jobForm.location}
                        onChange={e => setJobForm(f => ({ ...f, location: e.target.value }))} />
                    </div>
                    <div>
                      <label className="label-text">Type</label>
                      <select className="input-field" value={jobForm.type}
                        onChange={e => setJobForm(f => ({ ...f, type: e.target.value }))}>
                        {Object.entries(JOB_TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="label-text">No. of Openings</label>
                      <input type="number" min="1" className="input-field" value={jobForm.openings}
                        onChange={e => setJobForm(f => ({ ...f, openings: Number(e.target.value) }))} />
                    </div>
                  </div>
                  <div>
                    <label className="label-text">Job Description</label>
                    <textarea className="input-field resize-none" rows={3} value={jobForm.description}
                      onChange={e => setJobForm(f => ({ ...f, description: e.target.value }))}
                      placeholder="Role overview, responsibilities..." />
                  </div>
                  <div>
                    <label className="label-text">Requirements</label>
                    <textarea className="input-field resize-none" rows={2} value={jobForm.requirements}
                      onChange={e => setJobForm(f => ({ ...f, requirements: e.target.value }))}
                      placeholder="Skills, experience, qualifications..." />
                  </div>
                  <div className="flex gap-3 justify-end">
                    <button type="button" onClick={() => setShowJobForm(false)} className="btn-secondary btn-sm">Cancel</button>
                    <button type="submit" disabled={jobSubmitting} className="btn-primary btn-sm">
                      {jobSubmitting ? 'Posting...' : 'Post Job'}
                    </button>
                  </div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Job List */}
          {loading ? <p className="text-center text-sm text-violet-400 py-8">Loading...</p> :
          jobs.length === 0 ? (
            <div className="glass-card p-10 text-center">
              <p className="text-violet-400 text-sm">No job postings yet.</p>
              <button onClick={() => setShowJobForm(true)} className="btn-primary btn-sm mt-3">Post First Job</button>
            </div>
          ) : (
            <div className="space-y-3">
              {jobs.map(job => {
                const jsCfg = JOB_STATUS[job.status] || JOB_STATUS.open;
                return (
                  <motion.div key={job._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="glass-card p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <h4 className="font-bold text-violet-900">{job.title}</h4>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${jsCfg.bg} ${jsCfg.text}`}>{jsCfg.label}</span>
                          <span className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-md font-semibold">{JOB_TYPES[job.type]}</span>
                        </div>
                        <div className="flex flex-wrap gap-3 text-xs text-gray-400 mb-2">
                          {job.department && <span>📁 {job.department}</span>}
                          {job.location   && <span>📍 {job.location}</span>}
                          <span>👤 {job.openings} opening{job.openings > 1 ? 's' : ''}</span>
                          <span>📨 {job.applicantCount} applicant{job.applicantCount !== 1 ? 's' : ''}</span>
                          {job.hiredCount > 0 && <span className="text-green-600 font-semibold">✓ {job.hiredCount} hired</span>}
                        </div>
                        {job.description && <p className="text-xs text-gray-500 line-clamp-2">{job.description}</p>}
                      </div>
                      <div className="flex flex-col gap-2 items-end flex-shrink-0">
                        <div className="flex gap-1.5 flex-wrap justify-end">
                          {['open', 'on-hold', 'closed'].map(s => (
                            <button key={s} onClick={() => handleJobStatusChange(job._id, s)}
                              className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border transition-colors ${
                                job.status === s
                                  ? `${JOB_STATUS[s].bg} ${JOB_STATUS[s].text} border-transparent`
                                  : 'border-gray-200 text-gray-400 hover:border-violet-300'
                              }`}>
                              {JOB_STATUS[s].label}
                            </button>
                          ))}
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => openAddApplicant(job._id)}
                            className="text-xs font-semibold text-violet-600 hover:text-violet-800">
                            + Add Applicant
                          </button>
                          <button onClick={() => handleDeleteJob(job._id)}
                            className="text-xs font-semibold text-red-400 hover:text-red-600">
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── APPLICANTS TAB ── */}
      {tab === 'applicants' && (
        <div className="space-y-4">
          {/* Add applicant form */}
          <AnimatePresence>
            {showApplicantForm && (
              <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="glass-card p-5">
                <h3 className="font-bold text-violet-900 mb-4">Add Applicant</h3>
                <form onSubmit={handleAddApplicant} className="space-y-3">
                  <div className="grid sm:grid-cols-2 gap-3">
                    <div>
                      <label className="label-text">Full Name *</label>
                      <input className="input-field" placeholder="Applicant name" value={applicantForm.name}
                        onChange={e => setApplicantForm(f => ({ ...f, name: e.target.value }))} />
                    </div>
                    <div>
                      <label className="label-text">Job Posting *</label>
                      <select className="input-field" value={applicantForm.jobPosting}
                        onChange={e => setApplicantForm(f => ({ ...f, jobPosting: e.target.value }))}>
                        <option value="">— Select job —</option>
                        {jobs.filter(j => j.status === 'open').map(j => (
                          <option key={j._id} value={j._id}>{j.title} {j.department ? `(${j.department})` : ''}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="label-text">Email</label>
                      <input type="email" className="input-field" placeholder="email@example.com" value={applicantForm.email}
                        onChange={e => setApplicantForm(f => ({ ...f, email: e.target.value }))} />
                    </div>
                    <div>
                      <label className="label-text">Phone</label>
                      <input className="input-field" placeholder="+91 ..." value={applicantForm.phone}
                        onChange={e => setApplicantForm(f => ({ ...f, phone: e.target.value }))} />
                    </div>
                  </div>
                  <div>
                    <label className="label-text">Notes</label>
                    <textarea className="input-field resize-none" rows={2} value={applicantForm.notes}
                      onChange={e => setApplicantForm(f => ({ ...f, notes: e.target.value }))}
                      placeholder="Skills, experience summary, referral..." />
                  </div>
                  <div className="flex gap-3 justify-end">
                    <button type="button" onClick={() => setShowApplicantForm(false)} className="btn-secondary btn-sm">Cancel</button>
                    <button type="submit" disabled={applicantSubmitting} className="btn-primary btn-sm">
                      {applicantSubmitting ? 'Adding...' : 'Add Applicant'}
                    </button>
                  </div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Pipeline stages summary */}
          <div className="flex flex-wrap gap-2">
            {STAGES.map(s => {
              const cnt = applicants.filter(a => a.stage === s.key).length;
              return (
                <button key={s.key} onClick={() => setStageFilter(stageFilter === s.key ? '' : s.key)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                    stageFilter === s.key ? `${s.bg} ${s.text} border-transparent shadow-sm` : 'border-gray-200 text-gray-500 hover:border-violet-300'
                  }`}>
                  <span className={`w-2 h-2 rounded-full ${s.dot}`} />
                  {s.label} <span className="font-bold">{cnt}</span>
                </button>
              );
            })}
            <button onClick={() => setShowApplicantForm(v => !v)} className="btn-primary btn-sm ml-auto">
              {showApplicantForm ? 'Cancel' : '+ Add Applicant'}
            </button>
          </div>

          {/* Job filter */}
          {jobs.length > 0 && (
            <select className="input-field text-sm max-w-xs" value={jobIdFilter}
              onChange={e => setJobIdFilter(e.target.value)}>
              <option value="">All Job Postings</option>
              {jobs.map(j => <option key={j._id} value={j._id}>{j.title}</option>)}
            </select>
          )}

          {/* Applicant list */}
          {loading ? <p className="text-center text-sm text-violet-400 py-8">Loading...</p> :
          filteredApplicants.length === 0 ? (
            <div className="glass-card p-10 text-center">
              <p className="text-violet-400 text-sm">No applicants found.</p>
              <button onClick={() => setShowApplicantForm(true)} className="btn-primary btn-sm mt-3">Add Applicant</button>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredApplicants.map(app => {
                const stage = stageOf(app.stage);
                return (
                  <motion.div key={app._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="glass-card p-3 sm:p-4 cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => setSelectedApplicant(app)}>
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${stage.bg}`}>
                          <span className={`text-xs font-bold ${stage.text}`}>{app.name.charAt(0).toUpperCase()}</span>
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-violet-900 truncate">{app.name}</p>
                          <p className="text-xs text-gray-400 truncate">
                            {app.jobPosting?.title} {app.jobPosting?.department ? `· ${app.jobPosting.department}` : ''}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${stage.bg} ${stage.text}`}>
                          {stage.label}
                        </span>
                        <span className="text-xs text-gray-400">{formatDate(app.createdAt)}</span>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Applicant Detail Modal */}
      <Modal isOpen={!!selectedApplicant} onClose={() => setSelectedApplicant(null)} title="Applicant Details" size="md">
        {selectedApplicant && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-lg font-bold ${stageOf(selectedApplicant.stage).bg} ${stageOf(selectedApplicant.stage).text}`}>
                {selectedApplicant.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="font-bold text-violet-900 text-lg">{selectedApplicant.name}</p>
                <p className="text-sm text-gray-500">{selectedApplicant.jobPosting?.title}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-sm">
              {selectedApplicant.email && <div><span className="text-gray-400 text-xs">Email</span><p>{selectedApplicant.email}</p></div>}
              {selectedApplicant.phone && <div><span className="text-gray-400 text-xs">Phone</span><p>{selectedApplicant.phone}</p></div>}
              <div><span className="text-gray-400 text-xs">Applied</span><p>{formatDate(selectedApplicant.createdAt)}</p></div>
            </div>

            {selectedApplicant.notes && (
              <div><span className="text-xs text-gray-400 font-semibold uppercase">Notes</span><p className="text-sm text-gray-600 mt-1">{selectedApplicant.notes}</p></div>
            )}

            {/* Stage pipeline */}
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase mb-2">Move Stage</p>
              <div className="flex flex-wrap gap-2">
                {STAGES.map(s => (
                  <button key={s.key} onClick={() => handleStageChange(selectedApplicant._id, s.key)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-colors ${
                      selectedApplicant.stage === s.key
                        ? `${s.bg} ${s.text} border-transparent`
                        : 'border-gray-200 text-gray-500 hover:border-violet-300'
                    }`}>
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Hired → Create Employee hint */}
            {selectedApplicant.stage === 'hired' && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-sm text-green-700">
                <p className="font-semibold">Applicant Hired!</p>
                <p className="text-xs mt-0.5">Go to <strong>Employees → Add Employee</strong> to onboard them with this applicant's details.</p>
              </div>
            )}

            <div className="flex gap-2 pt-1 border-t border-gray-100">
              <button onClick={() => handleDeleteApplicant(selectedApplicant._id)}
                className="btn-sm border border-red-200 text-red-500 hover:bg-red-50 rounded-lg px-3 py-1 text-xs font-semibold">
                Remove Applicant
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default RecruitmentPage;
