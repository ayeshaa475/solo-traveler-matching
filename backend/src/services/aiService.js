const Anthropic = require('@anthropic-ai/sdk');

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

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
Return only valid JSON, no markdown or extra text.
`.trim();

  const response = await client.messages.create({
    model: 'claude-opus-4-7',
    max_tokens: 1024,
    thinking: { type: 'adaptive' },
    messages: [{ role: 'user', content: prompt }],
  });

  const text = response.content.find((block) => block.type === 'text').text;
  return JSON.parse(text);
};

module.exports = { generateItinerary };
