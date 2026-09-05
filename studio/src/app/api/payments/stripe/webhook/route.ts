import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

/**
 * Stripe Webhook Handler
 * 
 * Processes Stripe events (payment success, subscription updates, etc.)
 * Must be configured in Stripe dashboard to point to this endpoint.
 * 
 * Required env vars:
 * - STRIPE_SECRET_KEY
 * - STRIPE_WEBHOOK_SECRET
 */

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2022-11-15',
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
      console.error('[stripe-webhook] Missing signature');
      return NextResponse.json({ error: 'No signature' }, { status: 400 });
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error('[stripe-webhook] Signature verification failed:', err);
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    // Use service role to bypass RLS
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.user_id || session.client_reference_id;

        if (!userId) {
          console.error('[stripe-webhook] No user_id in session metadata');
          break;
        }

        // Update transaction
        const { error: txError } = await supabase
          .from('payment_transactions')
          .update({
            status: 'completed',
            stripe_subscription_id: session.subscription as string,
            completed_at: new Date().toISOString(),
          })
          .eq('stripe_session_id', session.id);

        if (txError) {
          console.error('[stripe-webhook] Transaction update failed:', txError);
        }

        // Update user subscription
        const planType = session.metadata?.plan_type || 'student';
        const billingPeriod = session.metadata?.billing_period || 'monthly';
        const expiryDate = new Date();
        expiryDate.setMonth(expiryDate.getMonth() + (billingPeriod === 'yearly' ? 12 : 1));

        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            subscription_tier: planType,
            subscription_status: 'active',
            subscription_expires_at: expiryDate.toISOString(),
            stripe_customer_id: session.customer as string,
            stripe_subscription_id: session.subscription as string,
          })
          .eq('id', userId);

        if (profileError) {
          console.error('[stripe-webhook] Profile update failed:', profileError);
        }

        console.log(`[stripe-webhook] Subscription activated for user ${userId}`);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const { error } = await supabase
          .from('profiles')
          .update({
            subscription_status: 'cancelled',
            subscription_expires_at: new Date().toISOString(),
          })
          .eq('stripe_subscription_id', subscription.id);

        if (error) {
          console.error('[stripe-webhook] Subscription cancellation failed:', error);
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const { error } = await supabase
          .from('profiles')
          .update({ subscription_status: 'past_due' })
          .eq('stripe_customer_id', invoice.customer as string);

        if (error) {
          console.error('[stripe-webhook] Payment failure update failed:', error);
        }
        break;
      }

      default:
        console.log(`[stripe-webhook] Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });

  } catch (error) {
    console.error('[stripe-webhook] Unexpected error:', error);
    return NextResponse.json({ error: 'Webhook error' }, { status: 500 });
  }
}
