const reviewFeedback = async (comment, rating) => {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const apiToken = process.env.CLOUDFLARE_API_TOKEN;

  if (!accountId || !apiToken) {
    throw new Error('Missing Cloudflare credentials — check CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN in .env');
  }

  const CF_URL = `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/@cf/meta/llama-3.1-8b-instruct`;

  const prompt = `You are a content moderation system for a solo traveler matching app. Classify the following user feedback.

Rating: ${rating}/5
Comment: "${comment || '(no comment provided)'}"

Classify as exactly one of: safe, concerning, or harmful.
- safe: ordinary negative feedback or minor complaints
- concerning: language suggesting discomfort, boundary issues, misleading behavior, or vague red flags
- harmful: clear evidence of harassment, threats, dangerous behavior, or serious misconduct

Respond with exactly one word.`;

  console.log('[safetyAgent] Reviewing feedback with rating:', rating);

  const response = await fetch(CF_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      max_tokens: 16,
      messages: [
        { role: 'system', content: 'You are a content moderation classifier. Respond with exactly one word: safe, concerning, or harmful.' },
        { role: 'user', content: prompt },
      ],
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Cloudflare AI request failed (${response.status}): ${errorBody}`);
  }

  const data = await response.json();
  const text = (data.result?.response || '').toLowerCase().trim();
  console.log('[safetyAgent] classification result:', text);

  if (text.includes('harmful')) return 'harmful';
  if (text.includes('concerning')) return 'concerning';
  return 'safe';
};

module.exports = { reviewFeedback };
