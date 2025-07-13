import fetch from "node-fetch";

export async function handler(event) {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: "Method Not Allowed",
    };
  }

  let text;
  try {
    const body = JSON.parse(event.body);
    text = body.text;
  } catch {
    return {
      statusCode: 400,
      body: "Invalid JSON",
    };
  }

  if (!text || text.trim().length < 10) {
    return {
      statusCode: 400,
      body: "Text too short for TTS",
    };
  }

  const ELEVEN_API_KEY = process.env.ELEVEN_API_KEY;
  const ELEVEN_VOICE_ID = process.env.ELEVEN_VOICE_ID;

  if (!ELEVEN_API_KEY || !ELEVEN_VOICE_ID) {
    console.warn("❌ Missing ElevenLabs config.");
    return {
      statusCode: 500,
      body: "Server misconfigured",
    };
  }

  try {
    // Call ElevenLabs API
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${ELEVEN_VOICE_ID}`,
      {
        method: "POST",
        headers: {
          "xi-api-key": ELEVEN_API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text,
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.5,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ ElevenLabs error:", errorText);
      return {
        statusCode: 500,
        body: "ElevenLabs request failed",
      };
    }

    const buffer = await response.arrayBuffer();
    const audioBase64 = Buffer.from(buffer).toString("base64");

    return {
      statusCode: 200,
      body: JSON.stringify({ audio: audioBase64 }),
    };
  } catch (error) {
    console.error("❌ Server error:", error);
    return {
      statusCode: 500,
      body: "Server error",
    };
  }
}
