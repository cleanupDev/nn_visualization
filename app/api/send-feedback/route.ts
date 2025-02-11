// app/api/send-feedback/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { FeedbackRequest } from '../../../types/feedback';
import Joi from 'joi';
import { RateLimiterMemory } from 'rate-limiter-flexible';

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

  // Log the feedback to console instead of sending email
  console.log('Received feedback:', {
    name,
    email,
    feedback
  });

  return NextResponse.json(
    { message: 'Thank you for your feedback! (Email sending is currently disabled)' },
    { status: 200 }
  );
}

// Optionally, handle other HTTP methods if needed
export async function GET(req: NextRequest) {
  return NextResponse.json({ message: 'Method GET Not Allowed' }, { status: 405 });
}
