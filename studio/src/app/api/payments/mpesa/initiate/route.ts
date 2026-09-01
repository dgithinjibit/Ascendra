import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * M-Pesa STK Push — Initiate Payment
 * 
 * Triggers M-Pesa STK push to user's phone for subscription payment.
 * Uses Safaricom Daraja API v2.
 * 
 * Required env vars:
 * - MPESA_CONSUMER_KEY
 * - MPESA_CONSUMER_SECRET
 * - MPESA_SHORTCODE (Paybill/Till number)
 * - MPESA_PASSKEY
 * - MPESA_CALLBACK_URL
 */

interface MpesaAuthResponse {
  access_token: string;
  expires_in: string;
}

interface MpesaStkPushResponse {
  MerchantRequestID: string;
  CheckoutRequestID: string;
  ResponseCode: string;
  ResponseDescription: string;
  CustomerMessage: string;
}

const MPESA_API_BASE = process.env.MPESA_ENV === 'production'
  ? 'https://api.safaricom.co.ke'
  : 'https://sandbox.safaricom.co.ke';

async function getMpesaAccessToken(): Promise<string> {
  const auth = Buffer.from(
    `${process.env.MPESA_CONSUMER_KEY}:${process.env.MPESA_CONSUMER_SECRET}`
  ).toString('base64');

  const response = await fetch(`${MPESA_API_BASE}/oauth/v1/generate?grant_type=client_credentials`, {
    headers: { Authorization: `Basic ${auth}` },
  });

  if (!response.ok) {
    throw new Error(`M-Pesa auth failed: ${response.statusText}`);
  }

  const data: MpesaAuthResponse = await response.json();
  return data.access_token;
}

function generateTimestamp(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hour = String(now.getHours()).padStart(2, '0');
  const minute = String(now.getMinutes()).padStart(2, '0');
  const second = String(now.getSeconds()).padStart(2, '0');
  return `${year}${month}${day}${hour}${minute}${second}`;
}

function generatePassword(shortcode: string, passkey: string, timestamp: string): string {
  return Buffer.from(`${shortcode}${passkey}${timestamp}`).toString('base64');
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { phoneNumber, amount, planType } = body;

    if (!phoneNumber || !amount || !planType) {
      return NextResponse.json(
        { error: 'Missing required fields: phoneNumber, amount, planType' },
        { status: 400 }
      );
    }

    // Validate phone number format (254XXXXXXXXX)
    const cleanPhone = phoneNumber.replace(/\D/g, '');
    if (!cleanPhone.startsWith('254') || cleanPhone.length !== 12) {
      return NextResponse.json(
        { error: 'Invalid phone number. Use format 254XXXXXXXXX' },
        { status: 400 }
      );
    }

    const shortcode = process.env.MPESA_SHORTCODE!;
    const passkey = process.env.MPESA_PASSKEY!;
    const callbackUrl = process.env.MPESA_CALLBACK_URL!;

    if (!shortcode || !passkey || !callbackUrl) {
      return NextResponse.json(
        { error: 'M-Pesa not configured. Contact support.' },
        { status: 503 }
      );
    }

    const timestamp = generateTimestamp();
    const password = generatePassword(shortcode, passkey, timestamp);
    const accessToken = await getMpesaAccessToken();

    // STK Push request
    const stkPushPayload = {
      BusinessShortCode: shortcode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: 'CustomerPayBillOnline',
      Amount: Math.round(amount),
      PartyA: cleanPhone,
      PartyB: shortcode,
      PhoneNumber: cleanPhone,
      CallBackURL: callbackUrl,
      AccountReference: `SYNCSENTA-${user.id.slice(0, 8)}`,
      TransactionDesc: `SyncSenta ${planType} subscription`,
    };

    const stkResponse = await fetch(`${MPESA_API_BASE}/mpesa/stkpush/v1/processrequest`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(stkPushPayload),
    });

    if (!stkResponse.ok) {
      const errorText = await stkResponse.text();
      console.error('[mpesa] STK push failed:', errorText);
      return NextResponse.json(
        { error: 'Payment initiation failed. Try again.' },
        { status: 500 }
      );
    }

    const stkData: MpesaStkPushResponse = await stkResponse.json();

    if (stkData.ResponseCode !== '0') {
      return NextResponse.json(
        { error: stkData.ResponseDescription || 'Payment request failed' },
        { status: 400 }
      );
    }

    // Store pending transaction in database
    const { error: dbError } = await supabase.from('payment_transactions').insert({
      user_id: user.id,
      provider: 'mpesa',
      amount: amount,
      currency: 'KES',
      phone_number: cleanPhone,
      merchant_request_id: stkData.MerchantRequestID,
      checkout_request_id: stkData.CheckoutRequestID,
      plan_type: planType,
      status: 'pending',
    });

    if (dbError) {
      console.error('[mpesa] DB insert failed:', dbError);
      // Don't fail the request — callback will handle completion
    }

    return NextResponse.json({
      success: true,
      message: stkData.CustomerMessage,
      checkoutRequestId: stkData.CheckoutRequestID,
    });

  } catch (error) {
    console.error('[mpesa] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Payment system error. Please try again.' },
      { status: 500 }
    );
  }
}
