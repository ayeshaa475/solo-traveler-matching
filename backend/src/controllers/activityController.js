const Activity = require('../models/Activity');

exports.createActivity = async (req, res) => {
  try {
    const activity = await Activity.create({ ...req.body, user: req.user.id });
    res.status(201).json(activity);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getActivities = async (req, res) => {
  try {
    const { city, category, date } = req.query;
    const filter = { status: 'open' };
    if (city) filter.city = new RegExp(city, 'i');
    if (category) filter.category = category;
    if (date) filter.date = { $gte: new Date(date) };

    const activities = await Activity.find(filter)
      .populate('user', 'name bio interests')
      .sort({ date: 1 });
    res.json(activities);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getActivity = async (req, res) => {
  try {
    const activity = await Activity.findById(req.params.id).populate('user', 'name bio interests');
    if (!activity) return res.status(404).json({ message: 'Activity not found' });
    res.json(activity);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.deleteActivity = async (req, res) => {
  try {
    const activity = await Activity.findById(req.params.id);
    if (!activity) return res.status(404).json({ message: 'Activity not found' });
    if (activity.user.toString() !== req.user.id)
      return res.status(403).json({ message: 'Not authorized' });

    await activity.deleteOne();
    res.json({ message: 'Activity removed' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
