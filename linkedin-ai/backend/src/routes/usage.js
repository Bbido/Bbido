const router = require('express').Router();
const { requireAuth } = require('../middleware/auth');
const supabase = require('../lib/supabase');

const FREE_LIMIT = parseInt(process.env.FREE_DAILY_LIMIT || '5');

// GET /api/usage
router.get('/', requireAuth, async (req, res) => {
  const user = req.user;

  if (user.pro) {
    return res.json({ used: 0, limit: null, pro: true });
  }

  const today = new Date().toISOString().split('T')[0];

  const { data: usage } = await supabase
    .from('usage')
    .select('count')
    .eq('user_id', user.id)
    .eq('date', today)
    .single();

  res.json({
    used: usage?.count || 0,
    limit: FREE_LIMIT,
    pro: false
  });
});

module.exports = router;
