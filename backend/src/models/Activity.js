const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  description: { type: String },
  category: {
    type: String,
    enum: ['hiking', 'food', 'nightlife', 'culture', 'adventure', 'relaxation', 'other'],
    default: 'other',
  },
  city: { type: String, required: true },
  date: { type: Date, required: true },
  venueName:    { type: String },
  venueAddress: { type: String },
  location: {
    lat: { type: Number },
    lng: { type: Number },
  },
  maxParticipants: { type: Number, default: 2 },
  status: { type: String, enum: ['open', 'matched', 'completed'], default: 'open' },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Activity', activitySchema);
