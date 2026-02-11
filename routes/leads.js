const express = require('express');
const router = express.Router();
const { createLead, getLeads, getLead, updateLeadStatus, addActivity, updateLead } = require('../controllers/leadController');
const { protect } = require('../middleware/auth');
const { roleCheck } = require('../middleware/roleCheck');

router.use(protect);
router.use(roleCheck('sales', 'hr', 'admin'));

router.post('/', createLead);
router.get('/', getLeads);
router.get('/:id', getLead);
router.put('/:id', updateLead);
router.put('/:id/status', updateLeadStatus);
router.post('/:id/activity', addActivity);

module.exports = router;
