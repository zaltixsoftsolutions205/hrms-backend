const express = require('express');
const router = express.Router();
const { createEmployee, sendOfferLetter, sendCredentials, getAllEmployees, getEmployee, updateEmployee, updateOwnProfile, deleteEmployee } = require('../controllers/employeeController');
const { protect } = require('../middleware/auth');
const { roleCheck } = require('../middleware/roleCheck');

router.use(protect);

// HR / Admin routes
router.post('/', roleCheck('hr', 'admin'), createEmployee);
router.post('/send-offer', roleCheck('hr', 'admin'), sendOfferLetter);
router.post('/send-credentials', roleCheck('hr', 'admin'), sendCredentials);
router.get('/', roleCheck('hr', 'admin'), getAllEmployees);
router.get('/:id', getEmployee);
router.put('/me/profile', updateOwnProfile);
router.put('/:id', roleCheck('hr', 'admin'), updateEmployee);
router.delete('/:id', roleCheck('hr', 'admin'), deleteEmployee);

module.exports = router;
