// app/api/send-feedback/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { FeedbackRequest } from '../../../types/feedback';
import Joi from 'joi';
import { RateLimiterMemory } from 'rate-limiter-flexible';

if (!process.env.FORMSPREE_FORM_ID) {
  throw new Error('FORMSPREE_FORM_ID environment variable is not set');
}

const FORMSPREE_ENDPOINT = `https://formspree.io/f/${process.env.FORMSPREE_FORM_ID}`;

const rateLimiter = new RateLimiterMemory({
  points: 5, // 5 submissions
  duration: 60, // per 60 seconds per IP
});

const schema = Joi.object({
  name: Joi.string().min(1).max(100).required(),
  email: Joi.string().email().required(),
  feedback: Joi.string().min(1).max(1000).required(),
});

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') || req.ip || '';

  try {
    await rateLimiter.consume(ip);
  } catch (rejRes) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { status: 429 }
    );
  }

  const body = await req.json();
  const { error, value } = schema.validate(body);

  if (error) {
    return NextResponse.json({ error: error.details[0].message }, { status: 400 });
  }

  const { name, email, feedback }: FeedbackRequest = value;

  try {
    const formspreeResponse = await fetch(FORMSPREE_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        name,
        email,
        feedback,
        _subject: `Feedback from ${name}`,
      }),
    });

    if (!formspreeResponse.ok) {
      throw new Error('Failed to submit to Formspree');
    }

    return NextResponse.json(
      { message: 'Thank you for your feedback!' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error submitting feedback:', error);
    return NextResponse.json(
      { error: 'Failed to send feedback. Please try again later.' },
      { status: 500 }
    );
  }
}

// Optionally, handle other HTTP methods if needed
export async function GET(req: NextRequest) {
  return NextResponse.json({ message: 'Method GET Not Allowed' }, { status: 405 });
}
