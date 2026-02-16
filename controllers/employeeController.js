const User = require('../models/User');
const Department = require('../models/Department');
const Notification = require('../models/Notification');
const Document = require('../models/Document');
const { sendMail } = require('../config/mail');
const { offerLetterTemplate, credentialsTemplate } = require('../utils/emailTemplates');
const { getRequiredDocs } = require('./documentController');
const crypto = require('crypto');

// HR / Admin: Create employee
exports.createEmployee = async (req, res) => {
  const { name, email, role, departmentId, designation, phone, joiningDate, basicSalary, allowances, deductions, address, employeeId, employeeType } = req.body;
  try {
    if (!employeeId || !employeeId.trim()) return res.status(400).json({ message: 'Employee ID is required' });

    const idExists = await User.findOne({ employeeId: employeeId.trim() });
    if (idExists) return res.status(400).json({ message: 'Employee ID already exists' });

    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message: 'Email already registered' });

    const tempPassword = crypto.randomBytes(5).toString('hex');
    const employee = await User.create({
      employeeId: employeeId.trim(),
      name, email, password: tempPassword, role: role || 'employee',
      department: departmentId || null, designation, phone,
      joiningDate: joiningDate ? new Date(joiningDate) : null,
      basicSalary: basicSalary || 0,
      allowances: allowances || [],
      deductions: deductions || [],
      address: address || '',
      isFirstLogin: true,
      employeeType: employeeType || null,
    });

    // Seed required document slots for new employees with onboarding type
    if (employeeType && ['fresher', 'experienced'].includes(employeeType)) {
      const requiredDocs = getRequiredDocs(employeeType);
      await Document.insertMany(
        requiredDocs.map(docType => ({ employee: employee._id, docType, status: 'pending_upload' }))
      );
    }

    const populated = await User.findById(employee._id).populate('department');
    res.status(201).json({ employee: populated, tempPassword });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Send offer letter
exports.sendOfferLetter = async (req, res) => {
  const { employeeId, salary } = req.body;
  try {
    const employee = await User.findById(employeeId).populate('department');
    if (!employee) return res.status(404).json({ message: 'Employee not found' });

    try {
      await sendMail({
        to: employee.email,
        subject: 'Offer Letter — Zaltix Soft Solutions',
        html: offerLetterTemplate({
          employeeName: employee.name,
          position: employee.designation || 'Team Member',
          department: employee.department?.name || 'General',
          joiningDate: employee.joiningDate ? new Date(employee.joiningDate).toDateString() : 'To be confirmed',
          salary: salary || employee.basicSalary,
        }),
      });
    } catch (mailErr) {
      return res.status(500).json({ message: 'Failed to send email. Check SMTP configuration in .env (MAIL_HOST, MAIL_USER, MAIL_PASS).' });
    }

    res.json({ message: 'Offer letter sent successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Send HRMS credentials
exports.sendCredentials = async (req, res) => {
  const { employeeId } = req.body;
  try {
    const employee = await User.findById(employeeId);
    if (!employee) return res.status(404).json({ message: 'Employee not found' });

    const tempPassword = crypto.randomBytes(5).toString('hex');

    // Try sending email first, before changing the password
    try {
      await sendMail({
        to: employee.email,
        subject: 'Your HRMS Login Credentials',
        html: credentialsTemplate({
          employeeName: employee.name,
          employeeId: employee.employeeId,
          email: employee.email,
          password: tempPassword,
          loginUrl: process.env.FRONTEND_URL,
        }),
      });
    } catch (mailErr) {
      return res.status(500).json({ message: 'Failed to send email. Check SMTP configuration in .env (MAIL_HOST, MAIL_USER, MAIL_PASS).' });
    }

    // Email sent successfully — now update the password
    employee.password = tempPassword;
    employee.isFirstLogin = true;
    await employee.save();

    await Notification.create({
      recipient: employee._id,
      title: 'Welcome to Zaltix Soft Solutions!',
      message: 'Your login credentials have been sent to your email.',
      type: 'credential',
    });

    res.json({ message: 'Credentials sent successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Any logged-in employee: get teammates in same department
exports.getTeamMembers = async (req, res) => {
  try {
    const me = await User.findById(req.user._id).select('department').populate('department', 'name').lean();
    if (!me?.department) return res.json({ team: [], deptName: null });

    const deptId = me.department._id;
    const deptName = me.department.name;

    const team = await User.find({
      department: deptId,
      _id: { $ne: req.user._id },
      isActive: { $ne: false },
    })
      .select('name employeeId designation role isActive')
      .sort({ name: 1 })
      .lean();

    res.json({ team, deptName });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// HR / Admin: Get all employees (active only)
exports.getAllEmployees = async (req, res) => {
  try {
    const filter = { role: { $ne: 'admin' }, isActive: true };
    if (req.user.role === 'hr') filter.role = { $in: ['employee', 'sales'] };
    const employees = await User.find(filter).populate('department').sort({ createdAt: -1 });
    res.json(employees);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get single employee
exports.getEmployee = async (req, res) => {
  try {
    const employee = await User.findById(req.params.id).populate('department');
    if (!employee) return res.status(404).json({ message: 'Employee not found' });
    res.json(employee);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// HR / Admin: Update employee
exports.updateEmployee = async (req, res) => {
  const allowed = ['name', 'designation', 'phone', 'department', 'joiningDate', 'basicSalary', 'allowances', 'deductions', 'address', 'isActive', 'role'];
  try {
    const employee = await User.findById(req.params.id);
    if (!employee) return res.status(404).json({ message: 'Employee not found' });

    allowed.forEach(field => {
      if (req.body[field] !== undefined) {
        employee[field] = field === 'department' ? req.body[field] || null : req.body[field];
      }
    });
    await employee.save();
    const updated = await User.findById(employee._id).populate('department');
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// HR / Admin: Delete employee (hard delete — permanently removes from database)
exports.deleteEmployee = async (req, res) => {
  try {
    const employee = await User.findById(req.params.id);
    if (!employee) return res.status(404).json({ message: 'Employee not found' });
    if (employee.role === 'admin') return res.status(403).json({ message: 'Cannot delete an admin account' });

    const name = employee.name;
    await employee.deleteOne();

    // Also delete any onboarding documents for this employee
    await Document.deleteMany({ employee: req.params.id });

    res.json({ message: `${name} has been permanently deleted.` });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Employee: Update own profile (limited fields)
exports.updateOwnProfile = async (req, res) => {
  const allowed = ['phone', 'address', 'emergencyContact'];
  try {
    const employee = await User.findById(req.user._id);
    allowed.forEach(field => { if (req.body[field] !== undefined) employee[field] = req.body[field]; });
    await employee.save();
    const updated = await User.findById(employee._id).populate('department');
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};