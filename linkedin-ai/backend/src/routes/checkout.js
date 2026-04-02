const router = require('express').Router();
const Stripe = require('stripe');
const { requireAuth } = require('../middleware/auth');

const getStripe = () => Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder');

// POST /api/checkout — creates Stripe checkout session
router.post('/', requireAuth, async (req, res) => {
  const user = req.user;

  if (user.pro) {
    return res.status(400).json({ message: 'Already on Pro plan' });
  }

  try {
    const stripe = getStripe();
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: process.env.STRIPE_PRICE_ID, quantity: 1 }],
      client_reference_id: user.id,
      customer_email: user.email,
      success_url: `${process.env.APP_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.APP_URL}/pricing`,
      metadata: { userId: user.id }
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error('Checkout error:', err);
    res.status(500).json({ message: 'Could not create checkout session' });
  }
});

module.exports = router;
