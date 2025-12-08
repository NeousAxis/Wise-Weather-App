import {onCall, onRequest} from "firebase-functions/v2/https";
import {onSchedule} from "firebase-functions/v2/scheduler";
import {defineSecret} from "firebase-functions/params";
import {initializeApp} from "firebase-admin/app";
import {getFirestore} from "firebase-admin/firestore";
import {getMessaging} from "firebase-admin/messaging";
import {GoogleGenerativeAI} from "@google/generative-ai";

initializeApp();

const geminiApiKey = defineSecret("VITE_API_KEY");

/**
 * Helper to get the theme for the day of the week.
 * @param {number} day 0 (Sun) - 6 (Sat)
 * @return {string}
 */
function getThemeForDay(day: number): string {
  const themes = [
    "Wisdom & Presence (introspection, silence, trust, attention, peace)",
    "Love, Humanity & Relationship (benevolence, connection, unity, " +
    "respect for life)",
    "Creation, Courage & Transformation (action, dreaming, evolving, " +
    "rising up, creating)",
    "Mysticism & Transcendence (spirit, unity, light, mystery, wonder)",
    "Simplicity, Happiness & Everyday Life (joy, gratitude, freedom, " +
    "ordinary presence)",
    "Poetry & Intuition (language of the heart, beauty, sensitivity, " +
    "imagination)",
    "Science, Spirit & Wonder (curiosity, exploration, unity of life)",
  ];
  return themes[day] || themes[0];
}

/**
 * Helper to fetch quote data using Google Gemini.
 * @param {string} apiKey
 * @param {number} dayOfWeek
 * @return {Promise<any>}
 */
async function fetchQuoteData(apiKey: string, dayOfWeek: number) {
  const theme = getThemeForDay(dayOfWeek);

  const prompt = "Generate a SINGLE, SHORT inspiring quote (MAX 25 WORDS) " +
    `based on the theme: "${theme}". ` +
    "CRITICAL: The 'author' field MUST be a real, specific famous person. " +
    "NEVER return 'Anonymous'. Return ONLY raw JSON with 'en' and 'fr' keys.";

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({model: "gemini-pro"});

  const result = await model.generateContent(prompt);
  const response = await result.response;
  const text = response.text();

  if (!text) throw new Error("No response from AI");

  // Cleanup markdown code blocks if any
  const cleanJson = text.replace(/```json/g, "")
    .replace(/```/g, "").trim();
  return JSON.parse(cleanJson);
}

// Public Callable for Frontend (Updated for daily logic)
export const generateQuote = onCall(
  {secrets: [geminiApiKey]},
  async () => {
    try {
      const apiKey = geminiApiKey.value();
      const now = new Date();
      // Use Day of Week for consistency
      const data = await fetchQuoteData(apiKey, now.getDay());
      return {success: true, data: data};
    } catch (error) {
      console.error("Error generating quote:", error);
      return {
        success: false,
        data: {
          en: {
            text: "The future belongs to those who believe in the beauty of " +
              "their dreams.",
            author: "Eleanor Roosevelt",
          },
          fr: {
            text: "L'avenir appartient à ceux qui croient à la beauté de " +
              "leurs rêves.",
            author: "Eleanor Roosevelt",
          },
        },
      };
    }
  });

// Subscribe with Token & Location
export const subscribeToNotifications = onCall(async (request) => {
  const {token, timezone, lat, lng} = request.data;
  if (!token) return {success: false, error: "No token"};

  const db = getFirestore();
  await db.collection("push_tokens").doc(token).set({
    token,
    timezone: timezone || "UTC",
    lat: lat || null,
    lng: lng || null,
    updatedAt: new Date(),
    // Reset notification trackers on resubscribe
    lastWeatherNotif: 0,
    weatherNotifCountToday: 0,
    lastWeatherState: null,
  }, {merge: true});

  return {success: true};
});

// Hourly Cron for Smart Notifications
export const sendHourlyNotifications = onSchedule({
  schedule: "every 1 hours",
  secrets: [geminiApiKey],
  timeoutSeconds: 540,
}, async () => {
  const apiKey = geminiApiKey.value();
  const db = getFirestore();
  const messaging = getMessaging();
  const now = new Date();

  // Fetch all tokens
  const snapshot = await db.collection("push_tokens").get();

  let globalQuote: {
    en: { text: string; author: string; };
    fr: { text: string; author: string; };
  } | null = null;
  try {
    globalQuote = await fetchQuoteData(apiKey, now.getDay());
  } catch (e) {
    console.error("Quote gen failed", e);
  }

  const messages: any[] = [];
  const updates: any[] = []; // Batched DB updates

  for (const doc of snapshot.docs) {
    const data = doc.data();
    const tz = data.timezone || "UTC";

    // Local Time
    const localDate = new Date(now.toLocaleString("en-US", {timeZone: tz}));
    const localHour = localDate.getHours();

    // --- 1. MORNING QUOTE (07:00) ---
    if (localHour === 7) {
      if (globalQuote) {
        messages.push({
          token: data.token,
          notification: {
            title: "☀️ Wise Weather",
            body: `"${globalQuote.en.text}"`,
          },
          data: {
            type: "quote",
            quote: JSON.stringify(globalQuote),
            click_action: "FLUTTER_NOTIFICATION_CLICK",
          },
        });
      }
    }

    // --- 2. CONTEXTUAL WEATHER NOTIFICATIONS ---
    // Rules:
    // - Window 1: 07:15 - 14:00 (Max 1)
    // - Window 2: 14:00 - 23:00 (Max 1)
    // - Night: 23:00 - 07:15 (0)

    // Check if user has location
    if (data.lat && data.lng) {
      const isWindow1 = localHour >= 7 && localHour < 14;
      const isWindow2 = localHour >= 14 && localHour < 23;

      let canSend = false;
      const lastSent = data.lastWeatherNotif ?
        new Date(data.lastWeatherNotif) : new Date(0);
      const sentTodayCount = data.weatherNotifCountToday || 0;
      const lastSentDay = lastSent.toLocaleDateString(
        "en-US",
        {timeZone: tz},
      );
      const currentDay = localDate.toLocaleDateString(
        "en-US",
        {timeZone: tz},
      );

      // Reset counter if new day
      const newCount = (lastSentDay !== currentDay) ? 0 : sentTodayCount;

      if (isWindow1 || isWindow2) {
        const hoursSinceLast = (now.getTime() - lastSent.getTime()) /
          (1000 * 60 * 60);
        // Common logic for both windows: Max 2 daily total, >4h interval
        if (newCount < 2 && hoursSinceLast >= 4) {
          canSend = true;
        }
      }

      if (canSend) {
        // Fetch Weather
        try {
          const wUrl = "https://api.open-meteo.com/v1/forecast?latitude=" +
            `${data.lat}&longitude=${data.lng}` +
            "&current=weather_code,temperature_2m,wind_speed_10m";
          const weatherRes = await fetch(wUrl);
          const wData: {
            current?: {
              weather_code: number;
              temperature_2m: number;
              wind_speed_10m: number;
            };
          } = await weatherRes.json();
          const current = wData.current;

          if (current) {
            const lastState = data.lastWeatherState;
            let ruptureDetected = false;
            let msgBody = "";

            if (lastState) {
              // RUPTURE LOGIC
              const oldCode = lastState.code;
              const newCode = current.weather_code;

              // 1. Sun (0,1) -> Cloud/Gloomy (3, 45)
              if ((oldCode <= 1) && (newCode >= 3 && newCode <= 48)) {
                ruptureDetected = true;
                msgBody = "Clouds are rolling in. Do you confirm?";
              } else if ((oldCode < 51) && (newCode >= 51 && newCode <= 67)) {
                // 2. Cloud -> Rain (51+)
                ruptureDetected = true;
                msgBody = "Rain detected nearby. Is it raining for you?";
              } else if ((oldCode >= 51 && oldCode <= 67) && (newCode >= 80)) {
                // 3. Light Rain -> Heavy (80+)
                ruptureDetected = true;
                msgBody = "Review pours detected. Confirm heavy rain?";
              } else if (oldCode !== 45 && oldCode !== 48 &&
                (newCode === 45 || newCode === 48)) {
                // 4. Fog (45, 48)
                ruptureDetected = true;
                msgBody = "Fog detected. Is visibility low?";
              } else if ((oldCode >= 51) && (newCode <= 2)) {
                // 5. Sun Return (Rain -> Sun)
                ruptureDetected = true;
                msgBody = "The sun is back! Do you see it?";
              } else if (current.wind_speed_10m > 40 &&
                (!lastState.wind || lastState.wind < 30)) {
                // 6. Wind
                ruptureDetected = true;
                msgBody = "Strong winds detected. Confirm?";
              }
            } else {
              // First run, just save state, no notif
            }

            // Save new state
            updates.push({
              ref: doc.ref,
              data: {
                lastWeatherState: {
                  code: current.weather_code,
                  temp: current.temperature_2m,
                  wind: current.wind_speed_10m,
                },
                lastWeatherCheck: new Date(),
              },
            });

            if (ruptureDetected) {
              messages.push({
                token: data.token,
                notification: {title: "Weather Update", body: msgBody},
                data: {type: "weather_alert"},
              });
              // Update notification trackers
              updates.push({
                ref: doc.ref,
                data: {
                  lastWeatherNotif: new Date(),
                  weatherNotifCountToday: newCount + 1,
                },
              });
            }
          }
        } catch (err) {
          console.error("Weather check failed", err);
        }
      }
    }
  }

  // Execute updates
  for (const up of updates) {
    await up.ref.set(up.data, {merge: true});
  }

  // Send Messages
  if (messages.length > 0) {
    const chunks = [];
    for (let i = 0; i < messages.length; i += 500) {
      chunks.push(messages.slice(i, i + 500));
    }
    for (const chunk of chunks) {
      await messaging.sendEach(chunk);
    }
    console.log(`Sent ${messages.length} notifications.`);
  }
});

// TEST FUNCTION: Trigger via URL
// https://us-central1-wise-weather-app.cloudfunctions.net/triggerTestNotification?type=quote
export const triggerTestNotification = onRequest(async (req: any, res: any) => {
  const {type = "quote"} = req.query;
  const db = getFirestore();
  const messaging = getMessaging();

  try {
    // Get the most recent token
    const snapshot = await db.collection("push_tokens")
      .orderBy("updatedAt", "desc")
      .limit(1)
      .get();

    if (snapshot.empty) {
      res.status(404).send("No tokens found in DB.");
      return;
    }

    const tokenData = snapshot.docs[0].data();
    const token = tokenData.token;

    let message: any = {};

    if (type === "weather") {
      message = {
        token,
        notification: {
          title: "🧪 Test Weather Alert",
          body: "Clouds are rolling in. Do you confirm?",
        },
        data: {
          type: "weather_alert",
        },
      };
    } else {
      message = {
        token,
        notification: {
          title: "🧪 Test Quote",
          body: "\"The only way to do great work is to love what you do.\"",
        },
        data: {
          type: "quote",
          quote: JSON.stringify({
            en: {
              text: "The only way to do great work is to love what you do.",
              author: "Steve Jobs",
            },
            fr: {
              text: "La seule façon de faire du bon travail est d'aimer ce " +
                "que vous faites.",
              author: "Steve Jobs",
            },
          }),
          click_action: "FLUTTER_NOTIFICATION_CLICK",
        },
      };
    }

    await messaging.send(message);
    res.status(200).send(`Sent ${type} notification to latest token.`);
  } catch (error) {
    console.error("Test function error:", error);
    res.status(500).send("Error sending notification: " +
      JSON.stringify(error));
  }
});
