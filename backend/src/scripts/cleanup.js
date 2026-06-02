require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const mongoose = require('mongoose');
const User = require('../models/User');
const Activity = require('../models/Activity');
const Match = require('../models/Match');
const Itinerary = require('../models/Itinerary');
const Feedback = require('../models/Feedback');
const Notification = require('../models/Notification');

const SEED_EMAILS = [
  'maya@detour.com',
  'jake@detour.com',
  'sofia@detour.com',
  'liam@detour.com',
  'amara@detour.com',
  'tyler@detour.com',
  'priya@detour.com',
  'carlos@detour.com',
];

const cleanup = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB\n');

  // 1. Identify non-seed users
  const guestUsers = await User.find({ email: { $nin: SEED_EMAILS } }, '_id');
  const guestIds = guestUsers.map((u) => u._id);
  console.log(`Found ${guestIds.length} non-seed user(s) to remove`);

  if (guestIds.length > 0) {
    // 2. Delete activities owned by non-seed users
    const { deletedCount: activities } = await Activity.deleteMany({ user: { $in: guestIds } });
    console.log(`Deleted ${activities} activity document(s)`);

    // 3. Find matches involving non-seed users (as participant or initiator)
    const dirtyMatches = await Match.find({
      $or: [{ participants: { $in: guestIds } }, { initiator: { $in: guestIds } }],
    }, '_id');
    const dirtyMatchIds = dirtyMatches.map((m) => m._id);

    // 4. Delete itineraries and feedback tied to those matches
    const { deletedCount: itineraries } = await Itinerary.deleteMany({ match: { $in: dirtyMatchIds } });
    console.log(`Deleted ${itineraries} itinerary document(s)`);

    const { deletedCount: feedback } = await Feedback.deleteMany({ match: { $in: dirtyMatchIds } });
    console.log(`Deleted ${feedback} feedback document(s)`);

    // 5. Delete the matches themselves
    const { deletedCount: matches } = await Match.deleteMany({ _id: { $in: dirtyMatchIds } });
    console.log(`Deleted ${matches} match document(s)`);

    // 6. Delete notifications sent to or from non-seed users
    const { deletedCount: notifications } = await Notification.deleteMany({
      $or: [{ recipient: { $in: guestIds } }, { sender: { $in: guestIds } }],
    });
    console.log(`Deleted ${notifications} notification document(s)`);

    // 7. Delete the non-seed users
    const { deletedCount: users } = await User.deleteMany({ _id: { $in: guestIds } });
    console.log(`Deleted ${users} user document(s)`);
  }

  // 8. Reset seed user trust fields to defaults
  const { modifiedCount } = await User.updateMany(
    { email: { $in: SEED_EMAILS } },
    { $set: { trustScore: 50, averageRating: 0, completedMeetups: 0, flagCount: 0 } }
  );
  console.log(`\nReset trust fields on ${modifiedCount} seed user(s)`);

  console.log('\nCleanup complete.');
  await mongoose.disconnect();
};

cleanup().catch((err) => {
  console.error('Cleanup failed:', err);
  mongoose.disconnect();
  process.exit(1);
});
