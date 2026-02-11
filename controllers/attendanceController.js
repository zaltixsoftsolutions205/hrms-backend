const Attendance = require('../models/Attendance');
const User = require('../models/User');
const moment = require('moment');

// Employee: Check-in
exports.checkIn = async (req, res) => {
  const today = moment().format('YYYY-MM-DD');
  const now = moment().format('HH:mm');
  try {
    const existing = await Attendance.findOne({ employee: req.user._id, date: today });
    if (existing) return res.status(400).json({ message: 'Already checked in today' });

    const record = await Attendance.create({
      employee: req.user._id,
      date: today,
      checkIn: now,
      status: 'present',
    });
    res.status(201).json(record);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Employee: Check-out
exports.checkOut = async (req, res) => {
  const today = moment().format('YYYY-MM-DD');
  const now = moment().format('HH:mm');
  try {
    const record = await Attendance.findOne({ employee: req.user._id, date: today });
    if (!record) return res.status(404).json({ message: 'No check-in found for today' });
    if (record.checkOut) return res.status(400).json({ message: 'Already checked out today' });

    const checkInTime = moment(`${today} ${record.checkIn}`, 'YYYY-MM-DD HH:mm');
    const checkOutTime = moment(`${today} ${now}`, 'YYYY-MM-DD HH:mm');
    const workHours = parseFloat((checkOutTime.diff(checkInTime, 'minutes') / 60).toFixed(2));

    record.checkOut = now;
    record.workHours = workHours;
    if (workHours < 4) record.status = 'half-day';
    await record.save();
    res.json(record);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Employee: Get own attendance
exports.getMyAttendance = async (req, res) => {
  const { month, year } = req.query;
  try {
    let filter = { employee: req.user._id };
    if (month && year) {
      const start = `${year}-${String(month).padStart(2, '0')}-01`;
      const end = moment(start).endOf('month').format('YYYY-MM-DD');
      filter.date = { $gte: start, $lte: end };
    }
    const records = await Attendance.find(filter).sort({ date: -1 });

    const summary = {
      present: records.filter(r => r.status === 'present').length,
      absent: records.filter(r => r.status === 'absent').length,
      halfDay: records.filter(r => r.status === 'half-day').length,
      totalWorkHours: records.reduce((sum, r) => sum + (r.workHours || 0), 0).toFixed(2),
    };

    const today = moment().format('YYYY-MM-DD');
    const todayRecord = await Attendance.findOne({ employee: req.user._id, date: today });

    res.json({ records, summary, todayRecord: todayRecord || null });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// HR / Admin: Get all attendance
exports.getAllAttendance = async (req, res) => {
  const { month, year, employeeId, departmentId } = req.query;
  try {
    let empFilter = {};
    if (departmentId) empFilter.department = departmentId;
    if (employeeId) empFilter._id = employeeId;

    const employees = await User.find({ ...empFilter, role: { $nin: ['admin'] } }).select('_id name employeeId');
    const empIds = employees.map(e => e._id);

    let filter = { employee: { $in: empIds } };
    if (month && year) {
      const start = `${year}-${String(month).padStart(2, '0')}-01`;
      const end = moment(start).endOf('month').format('YYYY-MM-DD');
      filter.date = { $gte: start, $lte: end };
    }

    const records = await Attendance.find(filter).populate('employee', 'name employeeId department').sort({ date: -1 });
    res.json(records);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// HR: Mark attendance manually
exports.markAttendance = async (req, res) => {
  const { employeeId, date, status, checkIn, checkOut } = req.body;
  try {
    let record = await Attendance.findOne({ employee: employeeId, date });
    if (record) {
      record.status = status;
      if (checkIn) record.checkIn = checkIn;
      if (checkOut) record.checkOut = checkOut;
      await record.save();
    } else {
      record = await Attendance.create({ employee: employeeId, date, status, checkIn, checkOut });
    }
    res.json(record);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
