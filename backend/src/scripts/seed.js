require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Activity = require('../models/Activity');

const daysFromNow = (n) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d;
};

const USERS = [
  {
    name: 'Maya Chen',
    email: 'maya@example.com',
    password: 'password123',
    currentCity: 'New York',
    bio: 'Photographer and gallery hopper based in Brooklyn.',
    interests: ['Photography', 'Galleries', 'Coffee', 'Museums'],
  },
  {
    name: 'Jake Rivera',
    email: 'jake@example.com',
    password: 'password123',
    currentCity: 'New York',
    bio: 'Avid runner and weekend cyclist. Always down for an early morning adventure.',
    interests: ['Running', 'Hiking', 'Cycling', 'Yoga'],
  },
  {
    name: 'Sofia Patel',
    email: 'sofia@example.com',
    password: 'password123',
    currentCity: 'New York',
    bio: 'Food enthusiast and jazz lover exploring the city one neighborhood at a time.',
    interests: ['Food Tours', 'Coffee', 'Jazz', 'Live Music'],
  },
  {
    name: 'Liam O\'Brien',
    email: 'liam@example.com',
    password: 'password123',
    currentCity: 'New York',
    bio: 'History nerd who loves wandering old neighborhoods with a camera.',
    interests: ['Local History', 'Museums', 'Photography', 'Galleries'],
  },
  {
    name: 'Amara Osei',
    email: 'amara@example.com',
    password: 'password123',
    currentCity: 'New York',
    bio: 'Music lover always hunting for the best live sets in the city.',
    interests: ['Jazz', 'Concerts', 'Live Music', 'Food Tours'],
  },
  {
    name: 'Tyler Brooks',
    email: 'tyler@example.com',
    password: 'password123',
    currentCity: 'New York',
    bio: 'Cyclist and yogi who loves early mornings in the park.',
    interests: ['Cycling', 'Running', 'Yoga', 'Hiking'],
  },
  {
    name: 'Priya Nair',
    email: 'priya@example.com',
    password: 'password123',
    currentCity: 'New York',
    bio: 'Art lover and coffee obsessive. Always looking for a new gallery or cafe.',
    interests: ['Food Tours', 'Coffee', 'Galleries', 'Museums'],
  },
  {
    name: 'Carlos Mendez',
    email: 'carlos@example.com',
    password: 'password123',
    currentCity: 'New York',
    bio: 'Jazz musician and local history buff. Love finding hidden corners of the city.',
    interests: ['Local History', 'Jazz', 'Photography', 'Concerts'],
  },
];

const buildActivities = (users) => [
  {
    user: users[0]._id,
    title: 'Photography walk through DUMBO',
    description: 'Golden hour shoot under the Manhattan Bridge. Bring your camera, manual settings preferred but not required.',
    category: 'culture',
    city: 'New York',
    date: daysFromNow(2),
  },
  {
    user: users[1]._id,
    title: 'Morning run along the Hudson River Greenway',
    description: 'Easy 5-mile out-and-back from Hudson Yards down to Tribeca. 7am start, all paces welcome.',
    category: 'hiking',
    city: 'New York',
    date: daysFromNow(1),
  },
  {
    user: users[2]._id,
    title: 'Street food tour through Jackson Heights',
    description: 'Working our way through the best Ecuadorian, Indian, and Thai spots on Roosevelt Ave. Bring an appetite.',
    category: 'food',
    city: 'New York',
    date: daysFromNow(3),
  },
  {
    user: users[3]._id,
    title: 'Greenwich Village local history walk',
    description: 'Covering the bohemian history, the Stonewall Inn, and the beat poet haunts. I\'ll bring maps and context.',
    category: 'culture',
    city: 'New York',
    date: daysFromNow(4),
  },
  {
    user: users[4]._id,
    title: 'Jazz night at Smalls Jazz Club',
    description: 'Late set starting around 10pm in the West Village. One of the best rooms in the city. $20 cover.',
    category: 'nightlife',
    city: 'New York',
    date: daysFromNow(5),
  },
  {
    user: users[5]._id,
    title: 'Cycling to Governors Island',
    description: 'Ferry from Lower Manhattan, bikes available to rent on the island. Perfect for a weekend afternoon.',
    category: 'adventure',
    city: 'New York',
    date: daysFromNow(6),
  },
  {
    user: users[6]._id,
    title: 'Chelsea gallery hop',
    description: 'Hitting 4–5 galleries between 20th and 26th Street. No plan, just wandering and reacting.',
    category: 'culture',
    city: 'New York',
    date: daysFromNow(3),
  },
  {
    user: users[7]._id,
    title: 'Concert at Brooklyn Steel',
    description: 'Indie rock show in Williamsburg. Doors at 8, opener at 9. Standing room, good sound system.',
    category: 'nightlife',
    city: 'New York',
    date: daysFromNow(7),
  },
  {
    user: users[0]._id,
    title: 'Museum of Natural History visit',
    description: 'Spending a few hours in the planetarium and the Hall of Ocean Life. Great for a slow Saturday morning.',
    category: 'culture',
    city: 'New York',
    date: daysFromNow(8),
  },
  {
    user: users[1]._id,
    title: 'Sunrise yoga in Central Park',
    description: 'Meeting at the Great Lawn at 6:30am. Bring a mat. Calm, no instruction, just good energy.',
    category: 'relaxation',
    city: 'New York',
    date: daysFromNow(2),
  },
  {
    user: users[2]._id,
    title: 'Coffee crawl in Williamsburg',
    description: 'Three stops: Devoción, Budin, and ending at Sey Coffee. Leisurely pace, good conversation.',
    category: 'food',
    city: 'New York',
    date: daysFromNow(9),
  },
  {
    user: users[3]._id,
    title: 'Brooklyn Bridge and Dumbo photo walk',
    description: 'Classic route from the bridge down into Dumbo. Best on a cloudy morning for even light.',
    category: 'adventure',
    city: 'New York',
    date: daysFromNow(5),
  },
  {
    user: users[4]._id,
    title: 'Chinatown food tour',
    description: 'Dumplings, BBQ pork buns, and bubble tea across Canal Street and Mott. Cash only at most spots.',
    category: 'food',
    city: 'New York',
    date: daysFromNow(10),
  },
  {
    user: users[5]._id,
    title: 'Prospect Park loop and picnic',
    description: 'Easy 3-mile loop around the park followed by a picnic near the boathouse. Bring something to share.',
    category: 'relaxation',
    city: 'New York',
    date: daysFromNow(11),
  },
  {
    user: users[6]._id,
    title: 'Vintage record shopping in the East Village',
    description: 'Hitting Academy Records, A-1, and Halcyon. Looking for jazz and soul. No purchases required, just good taste.',
    category: 'culture',
    city: 'New York',
    date: daysFromNow(12),
  },
];

const seed = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB');

  await User.deleteMany({ email: { $in: USERS.map((u) => u.email) } });
  await Activity.deleteMany({ city: 'New York' });
  console.log('Cleared existing seed data');

  const hashedUsers = await Promise.all(
    USERS.map(async (u) => ({
      ...u,
      password: await bcrypt.hash(u.password, 10),
    }))
  );

  const users = await User.insertMany(hashedUsers);
  console.log(`Created ${users.length} users`);

  const activities = await Activity.insertMany(buildActivities(users));
  console.log(`Created ${activities.length} activities`);

  console.log('\nSeed complete. Test credentials: any email above / password123');
  await mongoose.disconnect();
};

seed().catch((err) => {
  console.error('Seed failed:', err);
  mongoose.disconnect();
  process.exit(1);
});
