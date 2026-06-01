const mongoose = require('mongoose');

const matchSchema = new mongoose.Schema({
  activity: { type: mongoose.Schema.Types.ObjectId, ref: 'Activity', required: true },
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  itinerary: { type: mongoose.Schema.Types.ObjectId, ref: 'Itinerary' },
  status: { type: String, enum: ['pending', 'confirmed', 'completed'], default: 'pending' },
  matchScore: { type: Number },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Match', matchSchema);
