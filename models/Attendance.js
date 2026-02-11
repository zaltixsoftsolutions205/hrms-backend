const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema(
  {
    employee: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: String, required: true }, // YYYY-MM-DD
    checkIn: { type: String, default: null }, // HH:mm
    checkOut: { type: String, default: null },
    status: { type: String, enum: ['present', 'absent', 'half-day'], default: 'present' },
    workHours: { type: Number, default: 0 }, // in hours
    notes: { type: String, default: '' },
  },
  { timestamps: true }
);

attendanceSchema.index({ employee: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', attendanceSchema);
