const router = require('express').Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const supabase = require('../lib/supabase');

// POST /api/webhook — Stripe webhook handler
router.post('/', async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object;
      const userId = session.metadata?.userId || session.client_reference_id;

      if (userId) {
        await supabase.from('users').update({
          pro: true,
          stripe_customer_id: session.customer,
          stripe_subscription_id: session.subscription,
          pro_started_at: new Date().toISOString()
        }).eq('id', userId);
        console.log(`User ${userId} upgraded to Pro`);
      }
      break;
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object;
      const { data: user } = await supabase
        .from('users')
        .select('id')
        .eq('stripe_subscription_id', subscription.id)
        .single();

      if (user) {
        await supabase.from('users').update({ pro: false }).eq('id', user.id);
        console.log(`User ${user.id} downgraded from Pro`);
      }
      break;
    }

    case 'invoice.payment_failed': {
      console.log('Payment failed for subscription:', event.data.object.subscription);
      break;
    }
  }

  res.json({ received: true });
});

module.exports = router;
