const Payslip = require('../models/Payslip');
const User = require('../models/User');
const Attendance = require('../models/Attendance');
const Notification = require('../models/Notification');
const { sendMail } = require('../config/mail');
const { payslipNotificationTemplate } = require('../utils/emailTemplates');
const generatePayslipPDF = require('../utils/generatePayslipPDF');
const moment = require('moment');
const path = require('path');
const fs = require('fs');

const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

// HR / Admin: Generate payslip
exports.generatePayslip = async (req, res) => {
  const { employeeId, month, year, basicSalary, allowances, deductions, workingDays } = req.body;
  try {
    const existing = await Payslip.findOne({ employee: employeeId, month, year });
    if (existing) return res.status(400).json({ message: `Payslip for ${monthNames[month - 1]} ${year} already generated` });

    const employee = await User.findById(employeeId).populate('department');
    if (!employee) return res.status(404).json({ message: 'Employee not found' });

    // Count present days from attendance
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const endDate = moment(startDate).endOf('month').format('YYYY-MM-DD');
    const attendanceRecords = await Attendance.find({ employee: employeeId, date: { $gte: startDate, $lte: endDate } });
    const presentDays = attendanceRecords.filter(r => r.status === 'present').length + attendanceRecords.filter(r => r.status === 'half-day').length * 0.5;

    // Pro-rate basic salary based on attendance: (presentDays / workingDays) * basicSalary
    const actualWorkingDays = workingDays || 26;
    const proratedBasic = actualWorkingDays > 0 ? Math.round((presentDays / actualWorkingDays) * (basicSalary || 0)) : (basicSalary || 0);

    const totalAllowances = (allowances || []).reduce((s, a) => s + (a.amount || 0), 0);
    const totalDeductions = (deductions || []).reduce((s, d) => s + (d.amount || 0), 0);
    const grossSalary = proratedBasic + totalAllowances;
    const netSalary = grossSalary - totalDeductions;

    const payslip = await Payslip.create({
      employee: employeeId,
      month, year,
      basicSalary: proratedBasic,
      allowances: allowances || employee.allowances,
      deductions: deductions || employee.deductions,
      grossSalary, netSalary,
      generatedBy: req.user._id,
      workingDays: actualWorkingDays,
      presentDays,
      status: 'published',
    });

    // Generate PDF
    try {
      const pdfPath = await generatePayslipPDF({
        employee, month, year, basicSalary: payslip.basicSalary,
        allowances: payslip.allowances, deductions: payslip.deductions,
        grossSalary, netSalary, workingDays: payslip.workingDays, presentDays,
      });
      payslip.pdfPath = pdfPath;
      await payslip.save();
    } catch (pdfErr) {
      console.error('PDF generation failed:', pdfErr.message);
    }

    // Notification
    await Notification.create({
      recipient: employeeId,
      title: 'Payslip Published',
      message: `Your payslip for ${monthNames[month - 1]} ${year} is now available.`,
      type: 'payslip',
      link: '/payslips',
    });

    // Email
    try {
      await sendMail({
        to: employee.email,
        subject: `Payslip for ${monthNames[month - 1]} ${year}`,
        html: payslipNotificationTemplate({ employeeName: employee.name, month: monthNames[month - 1], year, netSalary }),
      });
    } catch (_) {}

    const populated = await Payslip.findById(payslip._id).populate('employee', 'name employeeId department').populate('generatedBy', 'name');
    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Employee: Get own payslips
exports.getMyPayslips = async (req, res) => {
  try {
    const payslips = await Payslip.find({ employee: req.user._id, status: 'published' }).sort({ year: -1, month: -1 });
    res.json(payslips);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// HR / Admin: Get all payslips
exports.getAllPayslips = async (req, res) => {
  const { employeeId, month, year } = req.query;
  try {
    let filter = {};
    if (employeeId) filter.employee = employeeId;
    if (month) filter.month = parseInt(month);
    if (year) filter.year = parseInt(year);
    const payslips = await Payslip.find(filter).populate('employee', 'name employeeId department').populate('generatedBy', 'name').sort({ createdAt: -1 });
    res.json(payslips);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Download payslip PDF
exports.downloadPayslip = async (req, res) => {
  try {
    const payslip = await Payslip.findById(req.params.id).populate('employee');
    if (!payslip) return res.status(404).json({ message: 'Payslip not found' });

    // Access check
    if (req.user.role === 'employee' || req.user.role === 'sales') {
      if (payslip.employee._id.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Access denied' });
      }
    }

    const absolutePath = path.join(__dirname, '..', payslip.pdfPath || '');
    if (!payslip.pdfPath || !fs.existsSync(absolutePath)) {
      // Re-generate PDF on the fly
      const employee = await User.findById(payslip.employee._id).populate('department');
      const pdfPath = await generatePayslipPDF({ employee, ...payslip.toObject() });
      payslip.pdfPath = pdfPath;
      await payslip.save();
    }
    res.download(absolutePath);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
