// app/api/completion/route.ts
import OpenAI from 'openai';
import { NextResponse } from 'next/server';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export const runtime = 'edge';

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant that completes text naturally and coherently."
        },
        {
          role: "user",
          content: `Complete this text naturally: ${prompt}`
        }
      ],
      temperature: 0.7,
      max_tokens: 150,
    });

    const completion = response.choices[0].message.content;
    return NextResponse.json({ completion });
  } catch (error) {
    console.error('[COMPLETION_ERROR]', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}