import { NextResponse } from 'next/server';
import Stripe from 'stripe';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  const secretKey = process.env.STRIPE_SECRET_KEY;

  if (!secretKey) {
    return NextResponse.json(
      { error: 'Stripe is not configured' },
      { status: 500 }
    );
  }

  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get('session_id');

  if (!sessionId) {
    return NextResponse.json(
      { error: 'Missing session_id parameter' },
      { status: 400 }
    );
  }

  // Basic validation - Stripe checkout session IDs start with cs_
  if (!sessionId.startsWith('cs_')) {
    return NextResponse.json(
      { error: 'Invalid session_id format' },
      { status: 400 }
    );
  }

  try {
    const stripe = new Stripe(secretKey);

    // Retrieve the checkout session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    // Check if session is too old (max 1 hour)
    const ONE_HOUR_SECONDS = 3600;
    const now = Math.floor(Date.now() / 1000);
    if (session.created < now - ONE_HOUR_SECONDS) {
      return NextResponse.json({
        verified: false,
        error: 'Payment session expired. Please make a new payment.',
      });
    }

    // Verify the payment was successful
    if (session.payment_status === 'paid') {
      return NextResponse.json({
        verified: true,
        sessionId: session.id,
        email: session.customer_details?.email || null,
      });
    } else {
      return NextResponse.json({
        verified: false,
        error: 'Payment not completed',
        status: session.payment_status,
      });
    }
  } catch (error) {
    console.error('Session verification error:', error);
    
    // Handle specific Stripe errors
    if (error instanceof Stripe.errors.StripeError) {
      if (error.code === 'resource_missing') {
        return NextResponse.json(
          { error: 'Session not found', verified: false },
          { status: 404 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Failed to verify session', verified: false },
      { status: 500 }
    );
  }
}
