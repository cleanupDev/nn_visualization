// app/api/send-feedback/route.ts

import { NextRequest, NextResponse } from 'next/server';
import mailgun from 'mailgun-js';
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

  // Initialize Mailgun
  const mg = mailgun({
    apiKey: process.env.MAILGUN_API_KEY || '',
    domain: process.env.MAILGUN_DOMAIN || '',
    host: 'api.eu.mailgun.net', // Changed from 'url' to 'host' based on mailgun-js documentation
  });

  const data = {
    from: `Feedback Form <no-reply@${process.env.MAILGUN_DOMAIN}>`,
    to: process.env.MAILGUN_RECIPIENT,
    subject: 'New Feedback Submission',
    text: `You have a new feedback submission:

  Name: ${name}
  Email: ${email}
  Feedback:
  ${feedback}`,
  };

  try {
    await mg.messages().send(data as mailgun.messages.SendData);
    return NextResponse.json({ message: 'Feedback sent successfully!' }, { status: 200 });
  } catch (error) {
    console.error('Mailgun Error:', error);
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
