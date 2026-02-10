const express = require('express');
const router = express.Router();
const { generatePayslip, getMyPayslips, getAllPayslips, downloadPayslip } = require('../controllers/payslipController');
const { protect } = require('../middleware/auth');
const { roleCheck } = require('../middleware/roleCheck');

router.use(protect);

router.post('/', roleCheck('hr', 'admin'), generatePayslip);
router.get('/my', getMyPayslips);
router.get('/', roleCheck('hr', 'admin'), getAllPayslips);
router.get('/:id/download', downloadPayslip);

module.exports = router;
