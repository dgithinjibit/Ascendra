import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * M-Pesa STK Push Callback Handler
 * 
 * Safaricom posts payment results here after user completes/cancels payment.
 * This endpoint is public (no auth) — Safaricom can't authenticate.
 * Validate using CheckoutRequestID matching.
 */

interface MpesaCallbackBody {
  Body: {
    stkCallback: {
      MerchantRequestID: string;
      CheckoutRequestID: string;
      ResultCode: number;
      ResultDesc: string;
      CallbackMetadata?: {
        Item: Array<{
          Name: string;
          Value: string | number;
        }>;
      };
    };
  };
}

export async function POST(request: NextRequest) {
  try {
    const body: MpesaCallbackBody = await request.json();
    const callback = body.Body?.stkCallback;

    if (!callback) {
      console.error('[mpesa-callback] Invalid payload structure');
      return NextResponse.json({ ResultCode: 1, ResultDesc: 'Invalid payload' }, { status: 400 });
    }

    const { CheckoutRequestID, ResultCode, ResultDesc, CallbackMetadata } = callback;

    // Use service role client to bypass RLS
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Find the pending transaction
    const { data: transaction, error: fetchError } = await supabase
      .from('payment_transactions')
      .select('*')
      .eq('checkout_request_id', CheckoutRequestID)
      .eq('status', 'pending')
      .single();

    if (fetchError || !transaction) {
      console.error('[mpesa-callback] Transaction not found:', CheckoutRequestID);
      return NextResponse.json({ ResultCode: 0, ResultDesc: 'Accepted' });
    }

    // Extract metadata if payment succeeded
    let mpesaReceiptNumber: string | null = null;
    let transactionDate: string | null = null;
    let phoneNumber: string | null = null;

    if (ResultCode === 0 && CallbackMetadata) {
      const items = CallbackMetadata.Item;
      mpesaReceiptNumber = items.find(i => i.Name === 'MpesaReceiptNumber')?.Value as string;
      transactionDate = items.find(i => i.Name === 'TransactionDate')?.Value as string;
      phoneNumber = items.find(i => i.Name === 'PhoneNumber')?.Value as string;
    }

    // Update transaction status
    const newStatus = ResultCode === 0 ? 'completed' : 'failed';
    const { error: updateError } = await supabase
      .from('payment_transactions')
      .update({
        status: newStatus,
        mpesa_receipt_number: mpesaReceiptNumber,
        transaction_date: transactionDate,
        result_code: ResultCode,
        result_description: ResultDesc,
        completed_at: ResultCode === 0 ? new Date().toISOString() : null,
      })
      .eq('id', transaction.id);

    if (updateError) {
      console.error('[mpesa-callback] DB update failed:', updateError);
    }

    // If payment succeeded, upgrade subscription
    if (ResultCode === 0) {
      const expiryDate = new Date();
      expiryDate.setMonth(expiryDate.getMonth() + 1); // 1 month subscription

      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          subscription_tier: transaction.plan_type,
          subscription_status: 'active',
          subscription_expires_at: expiryDate.toISOString(),
        })
        .eq('id', transaction.user_id);

      if (profileError) {
        console.error('[mpesa-callback] Profile update failed:', profileError);
      }
    }

    // Acknowledge receipt to Safaricom
    return NextResponse.json({
      ResultCode: 0,
      ResultDesc: 'Accepted',
    });

  } catch (error) {
    console.error('[mpesa-callback] Unexpected error:', error);
    return NextResponse.json(
      { ResultCode: 1, ResultDesc: 'Internal error' },
      { status: 500 }
    );
  }
}
