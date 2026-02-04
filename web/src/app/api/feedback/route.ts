import { NextRequest, NextResponse } from 'next/server';

interface FeedbackPayload {
  rating: number;
  comment?: string;
  photoStandard?: string;
  timestamp: string;
  userAgent?: string;
}

// Telegram bot config - uses same bot as notifications
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID =
  process.env.TELEGRAM_FEEDBACK_CHAT_ID || process.env.TELEGRAM_CHAT_ID;

async function sendToTelegram(feedback: FeedbackPayload): Promise<boolean> {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    console.warn('Telegram not configured for feedback');
    return false;
  }

  const stars = '⭐'.repeat(feedback.rating) + '☆'.repeat(5 - feedback.rating);
  const emoji =
    feedback.rating >= 4 ? '🎉' : feedback.rating >= 3 ? '👍' : '🔧';

  const message = `
${emoji} **New Feedback** - SafePassportPic

${stars} (${feedback.rating}/5)

${feedback.comment ? `💬 "${feedback.comment}"` : '_No comment_'}

📋 Standard: ${feedback.photoStandard || 'Unknown'}
🕐 ${new Date(feedback.timestamp).toLocaleString('en-US', { timeZone: 'America/Los_Angeles' })} PST
📱 ${feedback.userAgent?.includes('Mobile') ? 'Mobile' : 'Desktop'}
`.trim();

  try {
    const response = await fetch(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: TELEGRAM_CHAT_ID,
          text: message,
          parse_mode: 'Markdown',
        }),
      }
    );

    return response.ok;
  } catch (error) {
    console.error('Failed to send feedback to Telegram:', error);
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    const feedback: FeedbackPayload = await request.json();

    // Validate
    if (!feedback.rating || feedback.rating < 1 || feedback.rating > 5) {
      return NextResponse.json({ error: 'Invalid rating' }, { status: 400 });
    }

    if (feedback.comment && feedback.comment.length > 500) {
      return NextResponse.json({ error: 'Comment too long' }, { status: 400 });
    }

    // Log feedback (always)
    console.log('📝 Feedback received:', {
      rating: feedback.rating,
      hasComment: !!feedback.comment,
      standard: feedback.photoStandard,
      timestamp: feedback.timestamp,
    });

    // Send to Telegram
    const telegramSent = await sendToTelegram(feedback);

    // TODO: Store in database when we add one
    // await db.feedback.create({ data: feedback });

    return NextResponse.json({
      success: true,
      telegramSent,
    });
  } catch (error) {
    console.error('Feedback API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
