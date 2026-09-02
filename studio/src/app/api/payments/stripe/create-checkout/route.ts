export const runtime = 'nodejs';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import Stripe from 'stripe';

/**
 * Stripe Checkout Session — Create
 * 
 * Creates a Stripe Checkout session for international payments.
 * User is redirected to Stripe's hosted checkout page.
 * 
 * Required env vars:
 * - STRIPE_SECRET_KEY
 * - NEXT_PUBLIC_APP_URL
 */

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia',
});

const PLAN_PRICES = {
  student_monthly: 2.99, // USD
  student_yearly: 29.99,
  teacher_monthly: 49,
  school_yearly: 499,
};

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { planType, billingPeriod = 'monthly' } = body;

    if (!planType) {
      return NextResponse.json({ error: 'Missing planType' }, { status: 400 });
    }

    const priceKey = `${planType}_${billingPeriod}` as keyof typeof PLAN_PRICES;
    const amount = PLAN_PRICES[priceKey];

    if (!amount) {
      return NextResponse.json({ error: 'Invalid plan or billing period' }, { status: 400 });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:5173';

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `SyncSenta ${planType} - ${billingPeriod}`,
              description: `AI-powered CBC learning for ${planType}`,
            },
            unit_amount: Math.round(amount * 100), // Convert to cents
            recurring: billingPeriod === 'yearly' ? { interval: 'year' } : { interval: 'month' },
          },
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${appUrl}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/payment/cancelled`,
      client_reference_id: user.id,
      metadata: {
        user_id: user.id,
        plan_type: planType,
        billing_period: billingPeriod,
      },
    });

    // Store pending Stripe session
    const { error: dbError } = await supabase.from('payment_transactions').insert({
      user_id: user.id,
      provider: 'stripe',
      amount: amount,
      currency: 'USD',
      stripe_session_id: session.id,
      plan_type: planType,
      billing_period: billingPeriod,
      status: 'pending',
    });

    if (dbError) {
      console.error('[stripe] DB insert failed:', dbError);
    }

    return NextResponse.json({
      success: true,
      sessionId: session.id,
      url: session.url,
    });

  } catch (error) {
    console.error('[stripe] Checkout session creation failed:', error);
    return NextResponse.json(
      { error: 'Failed to create payment session' },
      { status: 500 }
    );
  }
}
