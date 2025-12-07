import {onCall} from "firebase-functions/v2/https";
import {onSchedule} from "firebase-functions/v2/scheduler";
import {defineSecret} from "firebase-functions/params";
import OpenAI from "openai";
import {initializeApp} from "firebase-admin/app";
import {getFirestore} from "firebase-admin/firestore";
import {getMessaging} from "firebase-admin/messaging";

initializeApp();

const geminiApiKey = defineSecret("VITE_API_KEY");

/**
 * Helper to fetch quote data using OpenRouter (OpenAI SDK).
 * @param {string} apiKey
 * @param {number} hour
 * @return {Promise<any>}
 */
async function fetchQuoteData(apiKey: string, hour: number) {
  let theme = "";

  // Logic based on target hour
  if (hour === 7) {
    theme = "Wisdom & Presence (introspection, silence, trust, attention," +
      " peace).";
  } else if (hour === 11) {
    theme = "Creation, Courage & Transformation (action, dreaming," +
      " evolving).";
  } else if (hour === 16) {
    theme = "Mysticism, Love & Transcendence (spirit, unity, light," +
      " mystery).";
  } else {
    // Fallback
    theme = "Wisdom & Nature";
  }

  const prompt = "Generate a SINGLE, SHORT inspiring quote (MAX 20 WORDS)" +
    ` based on the theme: "${theme}".\n` +
    "Return the response as a valid JSON object with 'en' and 'fr' keys," +
    " each containing 'text' and 'author'. DO NOT include markdown formatting" +
    " like ```json ... ```. Just the raw JSON object.";

  const openai = new OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey: apiKey,
  });

  const completion = await openai.chat.completions.create({
    model: "gpt-oss-safeguard-20b",
    messages: [
      {
        role: "system",
        content: "You are a helpful assistant that generates inspiring " +
          "quotes in JSON format.",
      },
      {
        role: "user",
        content: prompt,
      },
    ],
  });

  const responseText = completion.choices[0].message.content;
  if (!responseText) throw new Error("No response from AI");

  // Clean potential markdown blocks just in case
  const cleanJson = responseText.replace(/```json/g, "")
    .replace(/```/g, "").trim();

  return JSON.parse(cleanJson);
}

// Public Callable for Frontend to get instant quote
export const generateQuote = onCall({secrets: [geminiApiKey]}, async () => {
  try {
    const apiKey = geminiApiKey.value();
    const now = new Date();
    const hour = now.getHours();
    const data = await fetchQuoteData(apiKey, hour);
    return {success: true, data: data};
  } catch (error) {
    console.error("Error generating quote:", error);
    return {
      success: false,
      data: {
        en: {
          text: "The future belongs to those who believe in the beauty" +
            " of their dreams.",
          author: "Eleanor Roosevelt",
        },
        fr: {
          text: "L'avenir appartient à ceux qui croient à la beauté" +
            " de leurs rêves.",
          author: "Eleanor Roosevelt",
        },
      },
    };
  }
});

// Subscribe with Timezone
export const subscribeToNotifications = onCall(async (request) => {
  const {token, timezone} = request.data;
  if (!token) return {success: false, error: "No token"};

  // Store token + timezone in Firestore 'users_push' collection efficiently
  const db = getFirestore();
  // We use the token as ID to avoid duplicates
  await db.collection("push_tokens").doc(token).set({
    token: token,
    timezone: timezone || "UTC",
    updatedAt: new Date(),
  });

  return {success: true};
});

// Hourly Cron to check timezones
export const sendHourlyNotifications = onSchedule({
  schedule: "every 1 hours",
  secrets: [geminiApiKey],
  timeoutSeconds: 540, // 9 mins max
}, async () => {
  const apiKey = geminiApiKey.value();
  const db = getFirestore();
  const messaging = getMessaging();

  // 1. Determine which timezones are currently at 7h, 11h, or 16h
  // We iterate through all sensible timezones offsets (-12 to +14)
  const now = new Date(); // Server time (UTC)

  // List of offsets to check against target hours [7, 11, 16]
  // (Need to handle negative results and wrapping)

  const targetHours = [7, 11, 16];

  // We will build a map: quote for 7h -> list of tokens, quote for 11h -> list
  // Simple approach: Fetch ALL tokens (if not millions) and filter in memory
  // OR Query by timezone if we indexed it. Let's do Query for better scale.
  // Actually, Timezone string (Asia/Bangkok) is better than offset
  // because of DST.
  // So we need to find which TIMEZONES are currently at 7, 11, 16.

  // Get all unique timezones from DB is expensive if not distinct.
  // Better: Iterate known IANA timezones or just process all tokens in batches
  // if < 10k users. Assuming < 5000 tokens for now.

  const snapshot = await db.collection("push_tokens").get();

  const tokensToNotify: any[] = [];

  // Generate quotes concurrently
  let quote7; let quote11; let quote16;

  try {
    [quote7, quote11, quote16] = await Promise.all([
      fetchQuoteData(apiKey, 7),
      fetchQuoteData(apiKey, 11),
      fetchQuoteData(apiKey, 16),
    ]);
  } catch (e) {
    console.error("Failed to generate quotes for push", e);
    return;
  }

  snapshot.forEach((doc) => {
    const data = doc.data();
    const tz = data.timezone;
    if (!tz) return;

    // Get hour in that timezone
    const localTimeString = now.toLocaleTimeString("en-US", {
      timeZone: tz,
      hour: "numeric",
      hour12: false,
    });
    const localHour = parseInt(localTimeString);

    if (targetHours.includes(localHour)) {
      let quoteToSend;
      if (localHour === 7) quoteToSend = quote7;
      if (localHour === 11) quoteToSend = quote11;
      if (localHour === 16) quoteToSend = quote16;

      if (quoteToSend) {
        tokensToNotify.push({
          token: data.token,
          quote: quoteToSend,
        });
      }
    }
  });

  if (tokensToNotify.length === 0) {
    console.log("No users to notify this hour.");
    return;
  }

  // Send in batches
  // Group by quote to optimize "sendMulticast" if possible, but tokens
  // are unique. Simplified: Send individually or multicast by group.

  const messages: any[] = tokensToNotify.map((item) => ({
    token: item.token,
    notification: {
      title: "☀️ Wise Weather",
      body: `"${item.quote.en.text}"`,
    },
    data: {
      quote: JSON.stringify(item.quote),
    },
  }));

  // Batch send (sendAll is deprecated but convenient, sendEachForMulticast)
  // Converting to chunks of 500
  const chunks = [];
  for (let i = 0; i < messages.length; i += 500) {
    chunks.push(messages.slice(i, i + 500));
  }

  for (const chunk of chunks) {
    await messaging.sendEach(chunk);
  }

  console.log(`Sent ${messages.length} notifications.`);
});
