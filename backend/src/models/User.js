const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  currentCity: { type: String },
  bio: { type: String, maxlength: 300 },
  interests: [{ type: String }],
  trustScore:       { type: Number, default: 50 },
  totalRatings:     { type: Number, default: 0 },
  averageRating:    { type: Number, default: 0 },
  completedMeetups: { type: Number, default: 0 },
  flagCount:        { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
});

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.matchPassword = function (plain) {
  return bcrypt.compare(plain, this.password);
};

module.exports = mongoose.model('User', userSchema);
