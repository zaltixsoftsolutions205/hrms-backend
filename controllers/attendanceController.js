const Attendance = require('../models/Attendance');
const User = require('../models/User');
const moment = require('moment');

// IST helpers — adds 5h30m to UTC, then reads as if UTC string = IST string
// Works on any server timezone (UTC, IST, anything)
const istNow = () => new Date(Date.now() + 5.5 * 60 * 60 * 1000);
const istDate = () => istNow().toISOString().slice(0, 10);   // YYYY-MM-DD
const istTime = () => istNow().toISOString().slice(11, 16);  // HH:mm

// Office hours (IST)
const OFFICE_START = '09:30'; // late if check-in after this
const OFFICE_END   = '18:30'; // early leave if check-out before this

// Employee: Check-in
exports.checkIn = async (req, res) => {
  const today = istDate();
  const now = istTime();
  try {
    const existing = await Attendance.findOne({ employee: req.user._id, date: today });
    if (existing) return res.status(400).json({ message: 'Already checked in today' });

    const isLate = now > OFFICE_START;
    const record = await Attendance.create({
      employee: req.user._id,
      date: today,
      checkIn: now,
      status: 'present',
      isLate,
    });
    res.status(201).json(record);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Employee: Check-out
exports.checkOut = async (req, res) => {
  const today = istDate();
  const now = istTime();
  try {
    const record = await Attendance.findOne({ employee: req.user._id, date: today });
    if (!record) return res.status(404).json({ message: 'No check-in found for today' });
    if (record.checkOut) return res.status(400).json({ message: 'Already checked out today' });

    const checkInTime = moment(`${today} ${record.checkIn}`, 'YYYY-MM-DD HH:mm');
    const checkOutTime = moment(`${today} ${now}`, 'YYYY-MM-DD HH:mm');
    const workHours = parseFloat((checkOutTime.diff(checkInTime, 'minutes') / 60).toFixed(2));

    record.checkOut = now;
    record.workHours = workHours;
    record.isEarlyLeave = now < OFFICE_END;
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
      lateCount: records.filter(r => r.isLate).length,
      earlyLeaveCount: records.filter(r => r.isEarlyLeave).length,
    };

    const today = istDate();
    const todayRecord = await Attendance.findOne({ employee: req.user._id, date: today });

    res.json({ records, summary, todayRecord: todayRecord || null });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// HR / Admin: Get all attendance
exports.getAllAttendance = async (req, res) => {
  const { month, year, employeeId, departmentId, date } = req.query;
  try {
    let empFilter = {};
    if (departmentId) empFilter.department = departmentId;
    if (employeeId) empFilter._id = employeeId;

    const employees = await User.find({ ...empFilter, role: { $nin: ['admin'] } }).select('_id name employeeId');
    const empIds = employees.map(e => e._id);

    let filter = { employee: { $in: empIds } };
    if (date) {
      filter.date = date;
    } else if (month && year) {
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

// Employee: Apply for regularization (late / early leave)
exports.applyRegularization = async (req, res) => {
  const { attendanceId, reason } = req.body;
  try {
    if (!reason?.trim()) return res.status(400).json({ message: 'Reason is required' });
    const record = await Attendance.findOne({ _id: attendanceId, employee: req.user._id });
    if (!record) return res.status(404).json({ message: 'Attendance record not found' });
    if (!record.isLate && !record.isEarlyLeave) return res.status(400).json({ message: 'No late/early issue on this record' });
    if (record.regularizationStatus) return res.status(400).json({ message: 'Regularization already submitted' });

    record.regularizationStatus = 'pending';
    record.regularizationReason = reason.trim();
    await record.save();
    res.json(record);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// HR / Admin: Get all regularization requests
exports.getRegularizations = async (req, res) => {
  try {
    const { status } = req.query; // optional: 'pending' | 'approved' | 'rejected'
    const filter = { regularizationStatus: { $in: ['pending', 'approved', 'rejected'] } };
    if (status) filter.regularizationStatus = status;
    const records = await Attendance.find(filter)
      .populate('employee', 'name employeeId department')
      .sort({ date: -1 });
    res.json(records);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// HR / Admin: Approve or reject a regularization request
exports.reviewRegularization = async (req, res) => {
  const { status, comment } = req.body; // status: 'approved' | 'rejected'
  try {
    if (!['approved', 'rejected'].includes(status)) return res.status(400).json({ message: 'Invalid status' });
    const record = await Attendance.findById(req.params.id).populate('employee', 'name employeeId');
    if (!record) return res.status(404).json({ message: 'Record not found' });
    if (record.regularizationStatus !== 'pending') return res.status(400).json({ message: 'Already reviewed' });

    record.regularizationStatus = status;
    record.regularizationComment = comment?.trim() || '';
    await record.save();
    res.json(record);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
