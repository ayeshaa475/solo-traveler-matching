const Anthropic = require('@anthropic-ai/sdk');

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `You are an intent parser for a solo traveler matching app.
Given a freeform string describing what a traveler wants to do, extract structured information and return ONLY a valid JSON object with no markdown, no explanation, no extra text.

The JSON must have exactly these fields:
- category: one of "hiking", "food", "music", "museums", "photography", "cycling", "yoga", "coffee", "amusement_parks", "cooking", "art", "sports", "other"
- city: the city name as a string, or null if not mentioned
- date: the date as a string (e.g. "tomorrow", "2024-12-25", "this Saturday"), or null if not mentioned
- time_preference: one of "morning", "afternoon", "evening", "flexible"
- vibe: one of "adventurous", "relaxed", "social", "cultural"
- description: a clean one-sentence summary of what the traveler wants to do

Return only the JSON object. No markdown code blocks, no preamble.`;

const parseIntent = async (rawText) => {
  const response = await client.messages.create({
    model: 'claude-opus-4-7',
    max_tokens: 1024,
    thinking: { type: 'adaptive' },
    system: SYSTEM_PROMPT,
    messages: [
      { role: 'user', content: rawText },
    ],
  });

  const textBlock = response.content.find((block) => block.type === 'text');
  if (!textBlock) throw new Error('No text response from intent parser');

  return JSON.parse(textBlock.text.trim());
};

module.exports = { parseIntent };
