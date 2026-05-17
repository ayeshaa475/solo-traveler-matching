const mongoose = require('mongoose');

const itinerarySchema = new mongoose.Schema({
  match: { type: mongoose.Schema.Types.ObjectId, ref: 'Match', required: true },
  generatedBy: { type: String, default: 'ai' },
  content: { type: String, required: true },
  stops: [
    {
      time: String,
      place: String,
      description: String,
      duration: String,
    },
  ],
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Itinerary', itinerarySchema);
