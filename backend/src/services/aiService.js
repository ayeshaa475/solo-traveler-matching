const OpenAI = require('openai');

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const generateItinerary = async (match) => {
  const { activity, participants } = match;
  const names = participants.map((p) => p.name).join(' and ');
  const interests = [...new Set(participants.flatMap((p) => p.interests || []))].join(', ');

  const prompt = `
You are a travel planner. Create a detailed day itinerary for ${names} who are solo travelers meeting to do "${activity.title}" in ${activity.city} on ${activity.date.toDateString()}.
Their shared interests include: ${interests || 'general exploration'}.
Activity category: ${activity.category}.

Return a JSON object with:
- "content": a friendly summary paragraph
- "stops": array of { time, place, description, duration }

Keep it practical and fun for people meeting for the first time.
`.trim();

  const response = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    response_format: { type: 'json_object' },
  });

  return JSON.parse(response.choices[0].message.content);
};

module.exports = { generateItinerary };
