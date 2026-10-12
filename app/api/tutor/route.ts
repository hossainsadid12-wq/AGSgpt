import { NextResponse } from "next/server";

type Message = { role: "user" | "assistant"; content: string };

const allowedSubjects = new Set(["Mathematics", "Science", "English"]);
const allowedYears = new Set(["Year 8", "Year 9", "Year 10"]);

export async function GET() {
  return NextResponse.json({
    configured: Boolean(process.env.CLOUDFLARE_AI_WORKER_URL),
  });
}

export async function POST(request: Request) {
  let body: {
    messages?: Message[];
    subject?: string;
    level?: string;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Please send a valid question." },
      { status: 400 }
    );
  }

  const messages = body.messages;

  if (
    !Array.isArray(messages) ||
    messages.length === 0 ||
    messages.length > 20
  ) {
    return NextResponse.json(
      { error: "Add a question to continue." },
      { status: 400 }
    );
  }

  const validMessages = messages.every(
    (item) =>
      item &&
      (item.role === "user" || item.role === "assistant") &&
      typeof item.content === "string" &&
      item.content.length > 0 &&
      item.content.length <= 5000
  );

  if (!validMessages) {
    return NextResponse.json(
      { error: "Messages must be under 5,000 characters." },
      { status: 400 }
    );
  }

  if (!body.subject || !allowedSubjects.has(body.subject)) {
    return NextResponse.json(
      { error: "Choose Mathematics, Science, or English." },
      { status: 400 }
    );
  }

  if (!body.level || !allowedYears.has(body.level)) {
    return NextResponse.json(
      { error: "Choose Year 8, Year 9, or Year 10." },
      { status: 400 }
    );
  }

  const workerUrl = process.env.CLOUDFLARE_AI_WORKER_URL;

  if (!workerUrl) {
    return NextResponse.json(
      { error: "Cloudflare AI Worker URL is not configured." },
      { status: 503 }
    );
  }

  try {
    const response = await fetch(workerUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Origin:
          process.env.WEBSITE_ORIGIN || "http://localhost:3001",
      },
      body: JSON.stringify({
        messages,
        subject: body.subject,
        level: body.level,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        {
          error:
            typeof result.error === "string"
              ? result.error
              : "Cloudflare AI request failed.",
        },
        { status: response.status }
      );
    }

    if (
      typeof result.reply !== "string" ||
      !result.reply.trim()
    ) {
      return NextResponse.json(
        { error: "Cloudflare AI returned an invalid response." },
        { status: 502 }
      );
    }

    return NextResponse.json({
      reply: result.reply,
      mode: "ai",
    });
  } catch (error) {
    console.error("Cloudflare AI request failed:", error);

    return NextResponse.json(
      { error: "Cloudflare AI is temporarily unavailable." },
      { status: 502 }
    );
  }
}