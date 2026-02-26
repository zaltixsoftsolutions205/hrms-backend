const Task = require('../models/Task');
const Notification = require('../models/Notification');
const User = require('../models/User');
const moment = require('moment');

// HR / Admin: Create task
exports.createTask = async (req, res) => {
  const { title, description, assignedTo, priority, deadline } = req.body;
  try {
    const task = await Task.create({
      title, description, assignedTo, assignedBy: req.user._id, priority, deadline: new Date(deadline),
    });

    await Notification.create({
      recipient: assignedTo,
      title: 'New Task Assigned',
      message: `You have been assigned: "${title}" (Due: ${moment(deadline).format('DD MMM YYYY')})`,
      type: 'task',
      link: '/tasks',
    });

    const populated = await Task.findById(task._id).populate('assignedTo', 'name employeeId').populate('assignedBy', 'name');
    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Employee: Get own tasks
exports.getMyTasks = async (req, res) => {
  const { status } = req.query;
  try {
    let filter = { assignedTo: req.user._id };
    if (status) filter.status = status;
    const tasks = await Task.find(filter).populate('assignedBy', 'name').sort({ createdAt: -1 });

    const kpi = {
      total: await Task.countDocuments({ assignedTo: req.user._id }),
      completed: await Task.countDocuments({ assignedTo: req.user._id, status: 'completed' }),
      inProgress: await Task.countDocuments({ assignedTo: req.user._id, status: 'in-progress' }),
      notStarted: await Task.countDocuments({ assignedTo: req.user._id, status: 'not-started' }),
    };
    kpi.completionRate = kpi.total > 0 ? Math.round((kpi.completed / kpi.total) * 100) : 0;

    res.json({ tasks, kpi });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Employee: Update task status
exports.updateTaskStatus = async (req, res) => {
  const { status, remarks } = req.body;
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });
    if (task.assignedTo.toString() !== req.user._id.toString() && !['hr', 'admin'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    task.status = status;
    if (remarks) task.remarks = remarks;
    if (status === 'completed') task.completedDate = new Date();
    await task.save();

    const populated = await Task.findById(task._id).populate('assignedTo', 'name').populate('assignedBy', 'name');
    res.json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// HR / Admin: Get all tasks with employee filter
exports.getAllTasks = async (req, res) => {
  const { employeeId, status } = req.query;
  try {
    let filter = {};
    if (employeeId) filter.assignedTo = employeeId;
    if (status) filter.status = status;
    const tasks = await Task.find(filter).populate('assignedTo', 'name employeeId department').populate('assignedBy', 'name').sort({ createdAt: -1 });
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// HR / Admin: Get KPI overview per employee
exports.getKpiOverview = async (req, res) => {
  try {
    const employees = await User.find({ role: { $in: ['employee', 'sales'] }, isActive: true }).select('_id name employeeId department');
    const kpiData = await Promise.all(
      employees.map(async (emp) => {
        const total = await Task.countDocuments({ assignedTo: emp._id });
        const completed = await Task.countDocuments({ assignedTo: emp._id, status: 'completed' });
        const inProgress = await Task.countDocuments({ assignedTo: emp._id, status: 'in-progress' });
        const overdue = await Task.countDocuments({ assignedTo: emp._id, deadline: { $lt: new Date() }, status: { $ne: 'completed' } });
        return { employee: emp, total, completed, inProgress, overdue, completionRate: total > 0 ? Math.round((completed / total) * 100) : 0 };
      })
    );
    res.json(kpiData);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Admin/HR or task owner: Delete a task
exports.deleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });
    const isOwner = task.assignedTo.toString() === req.user._id.toString();
    const isManager = ['hr', 'admin'].includes(req.user.role);
    if (!isOwner && !isManager) return res.status(403).json({ message: 'Access denied' });
    await task.deleteOne();
    res.json({ message: 'Task deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// HR / Admin: Send reminder notification for a task
exports.sendTaskReminder = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id).populate('assignedTo', 'name');
    if (!task) return res.status(404).json({ message: 'Task not found' });
    if (task.status === 'completed') return res.status(400).json({ message: 'Task is already completed' });

    await Notification.create({
      recipient: task.assignedTo._id,
      title: 'Task Reminder',
      message: `Reminder: "${task.title}" is due on ${moment(task.deadline).format('DD MMM YYYY')}. Please update your progress.`,
      type: 'task',
      link: '/tasks',
    });

    res.json({ message: `Reminder sent to ${task.assignedTo.name}` });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// HR: Update task (edit details)
exports.updateTask = async (req, res) => {
  const { title, description, priority, deadline, status } = req.body;
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });
    if (title) task.title = title;
    if (description !== undefined) task.description = description;
    if (priority) task.priority = priority;
    if (deadline) task.deadline = new Date(deadline);
    if (status) task.status = status;
    await task.save();
    const populated = await Task.findById(task._id).populate('assignedTo', 'name employeeId').populate('assignedBy', 'name');
    res.json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
