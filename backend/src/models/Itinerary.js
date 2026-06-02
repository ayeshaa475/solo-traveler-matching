const mongoose = require('mongoose');

const stopShape = { time: String, place: String, description: String, duration: String };

const pendingRevisionSchema = new mongoose.Schema({
  stop_index: Number,
  original_stop: stopShape,
  proposed_stop: { type: mongoose.Schema.Types.Mixed, default: undefined }, // null means deletion proposal
  requested_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' },
}, { _id: false });

const itinerarySchema = new mongoose.Schema({
  match: { type: mongoose.Schema.Types.ObjectId, ref: 'Match', required: true },
  generatedBy: { type: String, default: 'ai' },
  content: { type: String, required: true },
  stops: [stopShape],
  pendingRevision: { type: pendingRevisionSchema, default: null },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Itinerary', itinerarySchema);
