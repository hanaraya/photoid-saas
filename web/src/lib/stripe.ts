import { loadStripe, type Stripe } from '@stripe/stripe-js';

let stripePromise: Promise<Stripe | null> | null = null;

export function getStripe(): Promise<Stripe | null> {
  if (!stripePromise) {
    const key = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
    if (!key) {
      console.warn('Stripe publishable key not set');
      return Promise.resolve(null);
    }
    stripePromise = loadStripe(key);
  }
  return stripePromise;
}

export async function createCheckoutSession(): Promise<{ url: string } | null> {
  try {
    const res = await fetch('/api/create-checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        priceAmount: 499, // $4.99 in cents
      }),
    });

    if (!res.ok) {
      throw new Error('Failed to create checkout session');
    }

    const data = await res.json();
    return data;
  } catch (error) {
    console.error('Checkout error:', error);
    return null;
  }
}
