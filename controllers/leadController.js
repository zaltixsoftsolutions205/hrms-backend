const Lead = require('../models/Lead');
const User = require('../models/User');

// Sales: Create lead
exports.createLead = async (req, res) => {
  const { name, phone, email, source, notes } = req.body;
  try {
    const lead = await Lead.create({ name, phone, email, source, notes, assignedTo: req.user._id });
    const populated = await Lead.findById(lead._id).populate('assignedTo', 'name').populate('activities.by', 'name');
    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Sales: Get own leads (Admin gets all)
exports.getLeads = async (req, res) => {
  const { status, source } = req.query;
  try {
    let filter = {};
    if (req.user.role !== 'admin') filter.assignedTo = req.user._id;
    if (status) filter.status = status;
    if (source) filter.source = source;

    const leads = await Lead.find(filter).populate('assignedTo', 'name').sort({ createdAt: -1 });

    const stats = {
      total: await Lead.countDocuments(req.user.role !== 'admin' ? { assignedTo: req.user._id } : {}),
      new: await Lead.countDocuments({ ...(req.user.role !== 'admin' ? { assignedTo: req.user._id } : {}), status: 'new' }),
      interested: await Lead.countDocuments({ ...(req.user.role !== 'admin' ? { assignedTo: req.user._id } : {}), status: 'interested' }),
      converted: await Lead.countDocuments({ ...(req.user.role !== 'admin' ? { assignedTo: req.user._id } : {}), status: 'converted' }),
      notInterested: await Lead.countDocuments({ ...(req.user.role !== 'admin' ? { assignedTo: req.user._id } : {}), status: 'not-interested' }),
    };
    stats.conversionRate = stats.total > 0 ? Math.round((stats.converted / stats.total) * 100) : 0;

    res.json({ leads, stats });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Sales: Get single lead
exports.getLead = async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.id).populate('assignedTo', 'name').populate('activities.by', 'name');
    if (!lead) return res.status(404).json({ message: 'Lead not found' });
    if (req.user.role === 'sales' && lead.assignedTo._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }
    res.json(lead);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Sales: Update lead status
exports.updateLeadStatus = async (req, res) => {
  const { status, notes } = req.body;
  try {
    const lead = await Lead.findById(req.params.id);
    if (!lead) return res.status(404).json({ message: 'Lead not found' });
    if (req.user.role === 'sales' && lead.assignedTo.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    lead.status = status;
    if (notes !== undefined) lead.notes = notes;
    if (status === 'converted') lead.convertedDate = new Date();
    await lead.save();

    const populated = await Lead.findById(lead._id).populate('assignedTo', 'name').populate('activities.by', 'name');
    res.json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Sales: Add activity to lead
exports.addActivity = async (req, res) => {
  const { type, note } = req.body;
  try {
    const lead = await Lead.findById(req.params.id);
    if (!lead) return res.status(404).json({ message: 'Lead not found' });
    if (req.user.role === 'sales' && lead.assignedTo.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    lead.activities.push({ type, note, by: req.user._id, date: new Date() });
    await lead.save();

    const populated = await Lead.findById(lead._id).populate('assignedTo', 'name').populate('activities.by', 'name');
    res.json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Sales: Update lead info
exports.updateLead = async (req, res) => {
  const { name, phone, email, source, notes } = req.body;
  try {
    const lead = await Lead.findById(req.params.id);
    if (!lead) return res.status(404).json({ message: 'Lead not found' });
    if (req.user.role === 'sales' && lead.assignedTo.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }
    if (name) lead.name = name;
    if (phone) lead.phone = phone;
    if (email !== undefined) lead.email = email;
    if (source) lead.source = source;
    if (notes !== undefined) lead.notes = notes;
    await lead.save();
    const populated = await Lead.findById(lead._id).populate('assignedTo', 'name').populate('activities.by', 'name');
    res.json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
