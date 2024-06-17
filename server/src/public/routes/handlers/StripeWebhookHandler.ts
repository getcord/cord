import Stripe from 'stripe';
import type { Request, Response } from 'express';
import type { RequestWithRawBody } from 'server/src/middleware/encoding.ts';
import { forwardHandlerExceptionsToNext } from 'server/src/public/routes/platform/util.ts';
import { updateSubscriptionData } from 'server/src/util/stripe.ts';
import { anonymousLogger } from 'server/src/logging/Logger.ts';

async function StripeWebhookHandler(req: Request, res: Response) {
  const sig = req.headers['stripe-signature'];
  if (typeof sig !== 'string') {
    return res.status(400).send('Unexpected value for signature header');
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET_KEY!;

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      (req as RequestWithRawBody).rawBody,
      sig,
      endpointSecret,
    );
  } catch (e: any) {
    anonymousLogger().logException(
      'StripeWebhookHandler error constructing event',
      e,
    );
    return res.status(400).send(`Webhook Error: ${e?.message}`);
  }

  if (!event) {
    return res.status(400).send('Could not get event');
  }

  try {
    switch (event.type) {
      // The udpated event is sent by Stripe when some information about the subcription changes
      // and the deleted event is sent when a subscription ends
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
        await updateSubscriptionData(event.data.object, event.type);
        break;
      default:
        return res.status(400).send(`Unhandled event type: ${event.type}`);
    }
  } catch (e: any) {
    anonymousLogger().logException(
      'StripeWebhookHandler error handling event',
      e,
      { webhookID: event.id },
    );
    return res.status(400).send(`Webhook Error: ${e?.message}`);
  }

  return res.json({ received: true });
}

export default forwardHandlerExceptionsToNext(StripeWebhookHandler);
