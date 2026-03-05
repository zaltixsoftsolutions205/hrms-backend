const JobPosting = require('../models/JobPosting');
const Applicant = require('../models/Applicant');

/* ── JOB POSTINGS ── */

exports.getJobPostings = async (req, res) => {
  try {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    const jobs = await JobPosting.find(filter)
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 });

    // attach applicant counts per status
    const jobsWithCount = await Promise.all(jobs.map(async (j) => {
      const total = await Applicant.countDocuments({ jobPosting: j._id });
      const interested = await Applicant.countDocuments({ jobPosting: j._id, status: 'interested' });
      const shortlisted = await Applicant.countDocuments({ jobPosting: j._id, status: 'shortlisted' });
      const joined = await Applicant.countDocuments({ jobPosting: j._id, status: 'joined' });
      return { ...j.toObject(), applicantCount: total, interestedCount: interested, shortlistedCount: shortlisted, joinedCount: joined };
    }));

    res.json(jobsWithCount);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.createJobPosting = async (req, res) => {
  try {
    const { title, department, location, type, description, requirements, openings } = req.body;
    if (!title) return res.status(400).json({ message: 'Title required' });
    const job = await JobPosting.create({
      title, department, location, type, description, requirements,
      openings: openings || 1,
      createdBy: req.user._id,
    });
    res.status(201).json(job);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateJobPosting = async (req, res) => {
  try {
    const job = await JobPosting.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!job) return res.status(404).json({ message: 'Not found' });
    res.json(job);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.deleteJobPosting = async (req, res) => {
  try {
    await JobPosting.findByIdAndDelete(req.params.id);
    await Applicant.deleteMany({ jobPosting: req.params.id });
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ── APPLICANTS (RESUMES) ── */

exports.getApplicants = async (req, res) => {
  try {
    const filter = {};
    if (req.query.jobId)   filter.jobPosting = req.query.jobId;
    if (req.query.status)  filter.status = req.query.status;
    const applicants = await Applicant.find(filter)
      .populate('jobPosting', 'title department')
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 });
    res.json(applicants);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.createApplicant = async (req, res) => {
  try {
    const { jobPosting, name, status } = req.body;
    if (!jobPosting || !name) return res.status(400).json({ message: 'Job posting and name required' });

    const resumeUrl = req.file ? `uploads/resumes/${req.file.filename}` : '';

    const applicant = await Applicant.create({
      jobPosting,
      name,
      resumeUrl,
      status: status || 'interested',
      createdBy: req.user._id,
    });
    await applicant.populate('jobPosting', 'title department');
    res.status(201).json(applicant);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const applicant = await Applicant.findByIdAndUpdate(req.params.id, { status }, { new: true })
      .populate('jobPosting', 'title department');
    if (!applicant) return res.status(404).json({ message: 'Not found' });
    res.json(applicant);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.deleteApplicant = async (req, res) => {
  try {
    await Applicant.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ── STATS ── */

exports.getStats = async (req, res) => {
  try {
    const totalJobs = await JobPosting.countDocuments({ status: 'open' });
    const totalApplicants = await Applicant.countDocuments();
    const interested = await Applicant.countDocuments({ status: 'interested' });
    const notInterested = await Applicant.countDocuments({ status: 'not-interested' });
    const shortlisted = await Applicant.countDocuments({ status: 'shortlisted' });
    const rejected = await Applicant.countDocuments({ status: 'rejected' });
    const onboarded = await Applicant.countDocuments({ status: 'onboarded' });
    const joined = await Applicant.countDocuments({ status: 'joined' });
    res.json({ totalJobs, totalApplicants, interested, notInterested, shortlisted, rejected, onboarded, joined });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
