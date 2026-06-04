require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const mongoose = require('mongoose');
const Activity = require('../models/Activity');

async function main() {
  await mongoose.connect(process.env.MONGO_URI);
  const result = await Activity.updateMany(
    { photoReference: { $ne: null } },
    { $set: { photoReference: null } }
  );
  console.log(`Cleared photoReference on ${result.modifiedCount} activities.`);
  await mongoose.disconnect();
}

main().catch((err) => { console.error(err); process.exit(1); });
