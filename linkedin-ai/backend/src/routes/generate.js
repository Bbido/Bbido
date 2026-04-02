const router = require('express').Router();
const Anthropic = require('@anthropic-ai/sdk');
const { requireAuth } = require('../middleware/auth');
const supabase = require('../lib/supabase');

const getClient = () => new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY || 'placeholder' });
const FREE_LIMIT = parseInt(process.env.FREE_DAILY_LIMIT || '5');

const PROMPTS = {
  post: (topic, tone) => `Write a compelling LinkedIn post about: "${topic}".
Tone: ${tone}.
Requirements:
- 150-300 words
- Start with a strong hook (not "I")
- Include 1-2 relevant emojis naturally
- End with a question or call-to-action
- Use line breaks for readability
- NO hashtags unless explicitly requested
Just write the post, no preamble.`,

  comment: (topic, tone) => `Write a thoughtful LinkedIn comment for this context: "${topic}".
Tone: ${tone}.
Requirements:
- 2-4 sentences max
- Add genuine value or insight
- Avoid generic phrases like "Great post!"
- Be specific and authentic
Just write the comment, no preamble.`,

  message: (topic, tone) => `Write a LinkedIn connection request or message for: "${topic}".
Tone: ${tone}.
Requirements:
- Under 100 words
- Personalized, not generic
- Clear purpose
- Professional but warm
Just write the message, no preamble.`,

  improve: (text, tone) => `Rewrite and improve this LinkedIn text: "${text}".
Tone: ${tone}.
Make it more engaging, clearer, and impactful while keeping the core message.
Just write the improved version, no preamble.`,

  reply: (topic, tone) => `Write a LinkedIn reply to: "${topic}".
Tone: ${tone}.
Requirements:
- 2-5 sentences
- Engaging and adds to the conversation
- Professional
Just write the reply, no preamble.`,
};

// POST /api/generate
router.post('/', requireAuth, async (req, res) => {
  const { type, topic, tone = 'professional' } = req.body;

  if (!topic || !type) {
    return res.status(400).json({ message: 'Type and topic are required' });
  }

  if (!PROMPTS[type]) {
    return res.status(400).json({ message: 'Invalid type' });
  }

  const user = req.user;

  // Check usage limit for free users
  if (!user.pro) {
    const today = new Date().toISOString().split('T')[0];

    const { data: usage } = await supabase
      .from('usage')
      .select('count')
      .eq('user_id', user.id)
      .eq('date', today)
      .single();

    const usedToday = usage?.count || 0;

    if (usedToday >= FREE_LIMIT) {
      return res.status(429).json({
        message: `Daily limit of ${FREE_LIMIT} generations reached. Upgrade to Pro for unlimited!`,
        limitReached: true
      });
    }

    // Increment usage
    if (usage) {
      await supabase.from('usage').update({ count: usedToday + 1 }).eq('user_id', user.id).eq('date', today);
    } else {
      await supabase.from('usage').insert({ user_id: user.id, date: today, count: 1 });
    }
  }

  try {
    const prompt = PROMPTS[type](topic, tone);

    const message = await getClient().messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 600,
      messages: [{ role: 'user', content: prompt }]
    });

    const text = message.content[0].text.trim();
    res.json({ text, type });
  } catch (err) {
    console.error('Generation error:', err);
    res.status(500).json({ message: 'Generation failed. Please try again.' });
  }
});

module.exports = router;
