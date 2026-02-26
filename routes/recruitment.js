const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { roleCheck } = require('../middleware/roleCheck');
const ctrl = require('../controllers/recruitmentController');

router.use(protect);

// Stats - hr & admin
router.get('/stats', roleCheck('hr', 'admin'), ctrl.getStats);

// Job Postings - hr & admin manage
router.get('/jobs',          roleCheck('hr', 'admin'), ctrl.getJobPostings);
router.post('/jobs',         roleCheck('hr', 'admin'), ctrl.createJobPosting);
router.put('/jobs/:id',      roleCheck('hr', 'admin'), ctrl.updateJobPosting);
router.delete('/jobs/:id',   roleCheck('hr', 'admin'), ctrl.deleteJobPosting);

// Applicants
router.get('/applicants',         roleCheck('hr', 'admin'), ctrl.getApplicants);
router.post('/applicants',        roleCheck('hr', 'admin'), ctrl.createApplicant);
router.put('/applicants/:id/stage', roleCheck('hr', 'admin'), ctrl.updateStage);
router.put('/applicants/:id/notes', roleCheck('hr', 'admin'), ctrl.updateNotes);
router.delete('/applicants/:id',  roleCheck('hr', 'admin'), ctrl.deleteApplicant);

module.exports = router;
