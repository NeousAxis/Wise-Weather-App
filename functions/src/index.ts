import {onCall, onRequest} from "firebase-functions/v2/https";
import {onDocumentCreated} from "firebase-functions/v2/firestore";
import {onSchedule} from "firebase-functions/v2/scheduler";
import {initializeApp} from "firebase-admin/app";
import {getFirestore} from "firebase-admin/firestore";
import {getMessaging} from "firebase-admin/messaging";
import {defineSecret} from "firebase-functions/params";
import OpenAI from "openai";

initializeApp();

const openRouterApiKey = defineSecret("OPENROUTER_API_KEY_SECURE");

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
 * Helper to fetch quote data using OpenRouter.
 * @param {number} dayOfWeek
 * @param {string} apiKey
 * @return {Promise<any>}
 */
async function fetchQuoteData(dayOfWeek: number, apiKey: string) {
  const theme = getThemeForDay(dayOfWeek);

  const authors = [
    "Rumi", "Lao Tzu", "Thich Nhat Hanh", "Marcus Aurelius", "Seneca",
    "Confucius", "Khalil Gibran", "Ralph Waldo Emerson", "Walt Whitman",
    "Rabindranath Tagore", "Albert Einstein", "Marie Curie", "Dalai Lama",
    "Mother Teresa", "Gandhi", "Martin Luther King Jr.", "Nelson Mandela",
    "Maya Angelou", "Antoine de Saint-Exupéry", "Victor Hugo", "Voltaire",
    "René Descartes", "Socrates", "Plato", "Aristotle",
  ];

  const prompt = "Generate a SINGLE, SHORT inspiring quote (MAX 25 WORDS) " +
    `based on the theme: "${theme}". ` +
    "CRITICAL INSTRUCTIONS:\n" +
    `1. The 'author' MUST be one of these: ${authors.join(", ")}.\n` +
    "2. Provide the quote in both English ('en') and French ('fr').\n" +
    "3. Return ONLY valid JSON. No markdown, no backticks.\n" +
    "4. Format: {\"en\": {\"text\": \"...\", \"author\": \"...\"}, " +
    "\"fr\": {\"text\": \"...\", \"author\": \"...\"}}";

  if (!apiKey) {
    throw new Error("Missing OPENROUTER_API_KEY");
  }

  const client = new OpenAI({
    apiKey: apiKey,
    baseURL: "https://openrouter.ai/api/v1",
  });

  try {
    const chatResponse = await client.chat.completions.create({
      model: "google/gemini-2.0-flash-exp:free",
      messages: [{role: "user", content: prompt}],
    });

    const content = chatResponse.choices[0]?.message?.content;
    if (!content) throw new Error("No response from OpenRouter API");

    // Clean potential markdown blocks
    const cleanJson = content.replace(/```json/g, "")
      .replace(/```/g, "").trim();
    return JSON.parse(cleanJson);
  } catch (error) {
    console.error("OpenRouter API Error:", error);
    throw error;
  }
}

/**
 * Get quote for slot (Persisted in Firestore)
 * @param {string} slotKey - Unique key for slot.
 * @param {number} dayOfWeek - Day of the week for theme generation
 * @param {string} apiKey - API Key for OpenRouter
 * @return {Promise<any>} The quote object
 */
async function getOrGenerateQuote(
  slotKey: string,
  dayOfWeek: number,
  apiKey: string
) {
  const db = getFirestore();
  const docRef = db.collection("daily_quotes").doc(slotKey);

  // 1. First Check
  const docSnap = await docRef.get();
  if (docSnap.exists) {
    return docSnap.data();
  }

  // 2. Generate
  try {
    const quoteData = await fetchQuoteData(dayOfWeek, apiKey);
    if (quoteData) {
      // 3. Double Check
      // Protection against race condition
      const freshSnap = await docRef.get();
      if (freshSnap.exists) {
        return freshSnap.data();
      }

      await docRef.set(quoteData);
      return quoteData;
    }
  } catch (e) {
    console.error("Failed to generate quote for slot", slotKey, e);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (global as any).lastQuoteError = e; // Hack to pass error to return
  }

  // Fallback if generation fails
  // Fallback if generation fails
  const fallbackQuotes = [
    {
      en: {
        text: "The future belongs to those who believe " +
          "in the beauty of their dreams.",
        author: "Eleanor Roosevelt",
      },
      fr: {
        text: "L'avenir appartient à ceux qui croient " +
          "à la beauté de leurs rêves.",
        author: "Eleanor Roosevelt",
      },
    },
    {
      en: {
        text: "Difficulties strengthen the mind, as labor does the body.",
        author: "Seneca",
      },
      fr: {
        text: "Les difficultés renforcent l'esprit, " +
          "comme le travail renforce le corps.",
        author: "Sénèque",
      },
    },
    {
      en: {
        text: "The only way to do great work is to love what you do.",
        author: "Steve Jobs",
      },
      fr: {
        text: "La seule façon de faire du bon travail est d'aimer ce " +
          "que vous faites.",
        author: "Steve Jobs",
      },
    },
    {
      en: {
        text: "Happiness depends upon ourselves.",
        author: "Aristotle",
      },
      fr: {
        text: "Le bonheur dépend de nous-mêmes.",
        author: "Aristote",
      },
    },
    {
      en: {
        text: "Turn your wounds into wisdom.",
        author: "Oprah Winfrey",
      },
      fr: {
        text: "Transformez vos blessures en sagesse.",
        author: "Oprah Winfrey",
      },
    },
  ];

  // Pick one based on the day of the year (deterministic fallback)
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now.getTime() - start.getTime();
  const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));
  const fallback = fallbackQuotes[dayOfYear % fallbackQuotes.length];

  return {
    ...fallback,
  };
}

// Public Callable for Frontend (Updated for shared daily logic)
export const generateQuote = onCall({secrets: [openRouterApiKey]},
  async () => {
    try {
      // Determine Slot based on UTC
      const now = new Date();
      // Simple slot logic:
      // We use ISO date string YYYY-MM-DD to be locale agnostic
      const dateKey = now.toISOString().split("T")[0];
      // Simplified: Single daily quote (no more morning/midday/evening slots)
      const slotSuffix = "all-day-v6";

      const slotKey = `${dateKey}-${slotSuffix}`;
      const data = await getOrGenerateQuote(
        slotKey,
        now.getDay(),
        openRouterApiKey.value()
      );

      return {success: true, data: data};
    } catch (error) {
      console.error("Error generating quote:", error);
      // Return fallback directly in worst case
      return {
        success: false,
        data: {
          error_debug: error instanceof Error ? error.message : String(error),
          en: {
            text: "The future belongs to those who believe " +
              "in the beauty of their dreams.",
            author: "Eleanor Roosevelt",
          },
          fr: {
            text: "L'avenir appartient à ceux qui croient " +
              "à la beauté de leurs rêves.",
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
    language: request.data.language || "en", // Default to English
    lat: lat || null,
    lng: lng || null,
    userId: request.data.userId || null, // Store User ID
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
  timeoutSeconds: 540,
  secrets: [openRouterApiKey],
}, async () => {
  const db = getFirestore();
  const messaging = getMessaging();
  const now = new Date();

  // Fetch all tokens
  const snapshot = await db.collection("push_tokens").get();

  // Get Quote for CURRENT slot to maybe send
  // Note: We always use the "all-day" quote for the 7am notification.
  const dateKey = now.toISOString().split("T")[0];
  const slotKey = `${dateKey}-all-day-v6`;

  // We only send the quote notification at 7am local time.
  // We can pre-fetch the morning quote.
  let globalQuote: any = null;
  try {
    globalQuote = await getOrGenerateQuote(
      slotKey,
      now.getDay(),
      openRouterApiKey.value()
    );
  } catch (e) {
    console.error("Quote gen failed", e);
    // Explicitly set fallback if gen failed
    if (!globalQuote) {
      // Re-use fallback logic (manual for now to be safe in this scope)
      globalQuote = {
        en: {
          text: "The future belongs to those who believe " +
            "in the beauty of their dreams.",
          author: "Eleanor Roosevelt",
        },
        fr: {
          text: "L'avenir appartient à ceux qui croient " +
            "à la beauté de leurs rêves.",
          author: "Eleanor Roosevelt",
        },
      };
    }
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
        // Localized Quote
        const lang = data.language || "en";
        const qContent = lang === "fr" ? globalQuote.fr : globalQuote.en;
        const qTitle = lang === "fr" ?
          "Inspiration Quotidienne" :
          "Daily Inspiration";

        // Also translate actions?
        // Actions titles are hardcoded in "webpush" below.
        // We should translate them too.
        const titleSun = lang === "fr" ? "☀️ Soleil" : "☀️ Sun";
        const titleRain = lang === "fr" ? "🌧️ Pluie" : "🌧️ Rain";

        messages.push({
          token: data.token,
          notification: {
            title: qTitle,
            body: `"${qContent.text}"\n— ${qContent.author}`,
          },
          data: {
            type: "quote",
            quote: JSON.stringify(globalQuote),
            click_action: "FLUTTER_NOTIFICATION_CLICK",
          },
          webpush: {
            notification: {
              actions: [
                {action: "report_sun", title: titleSun},
                {action: "report_rain", title: titleRain},
              ],
            },
            fcm_options: {
              link: "/?action=contribution",
            },
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
        // ALWAYS fetch weather to check for danger (Force Mode support)
        // We will filter sending later based on limits vs danger level.
        canSend = true;
      }

      if (canSend) {
        // Fetch Weather
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 5000);
          // 5 second timeout
          const wUrl = "https://api.open-meteo.com/v1/forecast?latitude=" +
            `${data.lat}&longitude=${data.lng}` +
            "&current=weather_code,temperature_2m," +
            "wind_speed_10m,wind_gusts_10m" +
            "&minutely_15=weather_code";

          const weatherRes = await fetch(wUrl, {signal: controller.signal});
          clearTimeout(timeoutId);
          const wData: {
            current?: {
              weather_code: number;
              temperature_2m: number;
              wind_speed_10m: number;
              wind_gusts_10m?: number;
            };
            minutely_15?: {
              weather_code: number[];
            };
          } = await weatherRes.json();
          const current = wData.current;
          const minutely15 = wData.minutely_15;

          if (current) {
            const lastState = data.lastWeatherState;
            let ruptureDetected = false;
            let msgBody = "";
            let msgTitle = ""; // Dynamic title
            let forceSend = false; // Bypass limits for danger
            let isForecastAlert = false; // Is this a future prediction?

            // 0. FORECAST CHECK (Proactive)
            const forecast = getPrecipitationEvent(
              minutely15,
              current.weather_code
            );

            if (forecast) {
              // FORECAST FOUND!
              isForecastAlert = true;
              ruptureDetected = true;
              forceSend = true; // Always warn about coming rain

              const lang = data.language || "en";

              // "Rain arriving in ~30 min"
              if (lang === "fr") {
                msgTitle = "🌧️ Prévision Pluie";
                msgBody = `Pluie prévue dans ~${forecast.start} min ` +
                  `(durée estimée: ${forecast.duration} min).`;
              } else {
                msgTitle = "🌧️ Rain Forecast";
                msgBody = `Rain expected in ~${forecast.start} min ` +
                  `(duration: ${forecast.duration} min).`;
              }
            } else if (lastState) {
              // ... Proceed to REACTIVE check (Existing Logic) ...
              // RUPTURE LOGIC
              const oldCode = lastState.code;
              const newCode = current.weather_code;
              const lang = data.language || "en";

              // 1. Sun (0,1) -> Cloud/Gloomy (3, 45)
              if ((oldCode <= 1) && (newCode >= 3 && newCode <= 48)) {
                ruptureDetected = true;
                msgTitle = lang === "fr" ? "Point Météo" : "Weather Update";
                msgBody = lang === "fr" ?
                  "Les nuages arrivent. Vous confirmez ?" :
                  "Clouds are rolling in. Do you confirm?";
              } else if ((oldCode < 51) && (newCode >= 51)) {
                // 2. Dry -> Any Rain/Snow/Storm (51+)
                ruptureDetected = true;
                msgTitle = lang === "fr" ? "🌧️ Alerte Pluie" : "🌧️ Rain Alert";
                msgBody = lang === "fr" ?
                  "Pluie détectée à proximité. Il pleut chez vous ?" :
                  "Rain detected nearby. Is it raining for you?";
                forceSend = true;
              } else if ((oldCode >= 51 && oldCode <= 67) && (newCode >= 80)) {
                // 3. Light Rain -> Heavy (80+)
                ruptureDetected = true;
                msgTitle = lang === "fr" ? "🌧️ Alerte Averse" : "🌧️ Heavy Rain";
                msgBody = lang === "fr" ?
                  "Fortes averses détectées. Vous confirmez ?" :
                  "Heavy pours detected. Confirm?";
                forceSend = true;
              } else if (oldCode !== 45 && oldCode !== 48 &&
                (newCode === 45 || newCode === 48)) {
                // 4. Fog (45, 48)
                ruptureDetected = true;
                msgTitle = lang === "fr" ? "🌫️ Météo" : "🌫️ Weather";
                msgBody = lang === "fr" ?
                  "Brouillard détecté. Visibilité réduite ?" :
                  "Fog detected. Is visibility low?";
              } else if ((oldCode >= 51) && (newCode <= 2)) {
                // 5. Sun Return (Rain -> Sun)
                ruptureDetected = true;
                msgTitle = lang === "fr" ? "☀️ Soleil" : "☀️ Sun";
                msgBody = lang === "fr" ?
                  "Le soleil est de retour ! Vous le voyez ?" :
                  "The sun is back! Do you see it?";
              } else if (current.wind_speed_10m > 40 &&
                (!lastState.wind || lastState.wind < 30)) {
                // 6. Strong Wind (Average)
                ruptureDetected = true;
                msgTitle = lang === "fr" ? "🌬️ Vent Fort" : "🌬️ Windy";
                msgBody = lang === "fr" ?
                  "Vents forts détectés. Vous confirmez ?" :
                  "Strong winds detected. Confirm?";
                forceSend = true;
              } else if (current.wind_gusts_10m &&
                current.wind_gusts_10m > 60 &&
                (!lastState.gusts || lastState.gusts < 45)) {
                // 7. Strong Gusts (>60km/h)
                ruptureDetected = true;
                msgTitle = lang === "fr" ? "🌬️ Rafales" : "🌬️ Gusts";
                msgBody = lang === "fr" ?
                  "Rafales puissantes détectées ! Soyez prudent." :
                  "Strong gusts detected! Be careful.";
                forceSend = true;
              } else if (lastState.wind &&
                current.wind_speed_10m > (lastState.wind + 15)) {
                // 8. Wind Intensification (> +15km/h increase)
                ruptureDetected = true;
                msgTitle = lang === "fr" ? "⚠️ Danger Vent" : "⚠️ Wind Warning";
                msgBody = lang === "fr" ?
                  `Le vent se renforce (${current.wind_speed_10m} km/h). ` +
                  "Mettez-vous à l'abri." :
                  `Wind is intensifying (${current.wind_speed_10m} km/h). ` +
                  "Stay safe.";
                forceSend = true;
              }
            } else {
              // First run: If it's already raining/storming, ASK!
              const newCode = current.weather_code;
              const lang = data.language || "en";

              if (newCode >= 51) {
                ruptureDetected = true;
                msgTitle = lang === "fr" ? "🌧️ Météo" : "🌧️ Weather";
                msgBody = lang === "fr" ?
                  "Mauvais temps prévu. Vous confirmez ?" :
                  "Forecast says bad weather. Confirm?";
              }
            }

            // CHECK LIMITS HERE
            const hoursSinceLast = (now.getTime() - lastSent.getTime()) /
              (1000 * 60 * 60);
            const withinLimits = (newCount < 2 && hoursSinceLast >= 4);

            let finalCanSend = false;
            // logic: If danger (forceSend), we allow it up to 10 times/day
            // and ignore hoursSinceLast interval
            // If normal (clouds/sun), we strictly respect withinLimits
            // (2/day, >4h)
            if (forceSend) {
              if (newCount < 10) finalCanSend = true;
            } else {
              if (withinLimits) finalCanSend = true;
            }

            // Only proceed if rupture AND allowed
            if (ruptureDetected && finalCanSend) {
              // If not set by loop
              if (!msgTitle) {
                const lang = data.language || "en";
                msgTitle = lang === "fr" ? "Point Météo" : "Weather Update";
              }

              messages.push({
                token: data.token,
                notification: {title: msgTitle, body: msgBody},
                // V2: Differentiate types.
                // 'weather_alert' -> Asks for confirmation (opens contribution)
                // 'weather_forecast' -> Informational (opens map or home)
                data: {
                  type: isForecastAlert ? "weather_forecast" : "weather_alert",
                },
                webpush: {
                  fcm_options: {
                    link: "/?action=contribution",
                  },
                },
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
            // Save new state (always save, even if no notification sent)
            updates.push({
              ref: doc.ref,
              data: {
                lastWeatherState: {
                  code: current.weather_code,
                  temp: current.temperature_2m,
                  wind: current.wind_speed_10m,
                  gusts: current.wind_gusts_10m || 0,
                },
                lastWeatherCheck: new Date(),
              },
            });
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

/**
 * Helper to get time estimates from minutely_15 data
 * Looks at next 8 slots (2 hours). Returns start time and duration.
 * @param {any} minutely15 The OpenMeteo minutely_15 object
 * @param {number} currentCode The current weather code
 * @return {{ start: number, duration: number } | null} Start and Duration
 */
function getPrecipitationEvent(
  minutely15: any,
  currentCode: number
): { start: number, duration: number } | null {
  if (!minutely15 || !minutely15.weather_code) return null;
  const codes = minutely15.weather_code;

  // If it's already bad now, we consider the event has "started" (start=0)
  // But usually we use this for UPCOMING events.
  // If current is bad, we rely on standard alerts.
  if (currentCode >= 51) return null;

  let startIndex = -1;
  let endIndex = -1;

  // Look ahead up to 2 hours (8 slots of 15 min)
  for (let i = 0; i < 8 && i < codes.length; i++) {
    const code = codes[i];
    const isBad = code >= 51; // Rain/Snow/Storm

    if (isBad) {
      if (startIndex === -1) startIndex = i;
      // Extend end index as long as it is bad
      endIndex = i;
    } else {
      // If we found a start and now it's clear again, the event is over
      if (startIndex !== -1) break;
    }
  }

  if (startIndex !== -1) {
    // Calculate minutes
    const startMin = startIndex * 15;
    // Duration: (End - Start + 1) * 15
    const durationMin = (endIndex - startIndex + 1) * 15;

    // Filter very short/far events if needed, but for now report all
    return {start: startMin, duration: durationMin};
  }

  return null;
}

// TEST FUNCTION: Trigger via URL
// https://us-central1-wise-weather-app.cloudfunctions.net/triggerTestNotification?type=quote&token=...
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const triggerTestNotification = onRequest(async (req: any, res: any) => {
  const {type = "quote", token: queryToken} = req.query;
  const db = getFirestore();
  const messaging = getMessaging();

  try {
    let token = queryToken;

    // If no token provided in URL, get the most recent one from DB
    if (!token) {
      const snapshot = await db.collection("push_tokens")
        .orderBy("updatedAt", "desc")
        .limit(1)
        .get();

      if (snapshot.empty) {
        res.status(404).send("No tokens found in DB.");
        return;
      }

      const tokenData = snapshot.docs[0].data();
      token = tokenData.token;
    }

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

// Listen for new reports to verify accuracy
export const checkCommunityReport = onDocumentCreated(
  "reports/{reportId}",
  async (event) => {
    const snapshot = event.data;
    if (!snapshot) return;

    const data = snapshot.data();
    const conditions: string[] = data.conditions || [];
    const lat = data.lat;
    const lng = data.lng;

    // Need exact location and condition
    if (!lat || !lng || conditions.length === 0) return;

    const db = getFirestore();

    // 0. ANTI-SPAM CHECK (New Strict Logic)
    // "One notification per event per hour"
    try {
      const now = new Date();
      // Check last 10 minutes (reduced to allow rapid weather changes)
      const spamWindow = new Date(now.getTime() - 10 * 60 * 1000);
      const RADIUS_DEG = 0.045; // Approx 5km

      const recentReports = await db.collection("reports")
        .where("timestamp", ">", spamWindow)
        .get();

      let sameConditionCount = 0;
      const reportedLabel = conditions[0] || "";

      recentReports.forEach((doc) => {
        // Skip current doc (redundant if using onCreate trigger
        // correctly but safe)
        if (doc.id === event.params.reportId) return;

        const rData = doc.data();
        if (rData.lat && rData.lng) {
          const dLat = Math.abs(rData.lat - lat);
          const dLng = Math.abs(rData.lng - lng);

          if (dLat < RADIUS_DEG && dLng < RADIUS_DEG) {
            // Check if condition matches
            const rConditions: string[] = rData.conditions || [];
            if (rConditions.includes(reportedLabel)) {
              sameConditionCount++;
            }
          }
        }
      });

      if (sameConditionCount > 0) {
        console.log("Anti-spam: Similar report found recently. " +
          "Skipping global notification.");
        return;
      }
    } catch (e) {
      console.error("Anti-spam check failed", e);
    }

    // 1. Fetch Official Forecast for Comparison
    // We check the "current" weather code from Open Meteo
    const url = "https://api.open-meteo.com/v1/forecast?latitude=" +
      `${lat}&longitude=${lng}&current=weather_code`;
    let forecastCode = -1;

    try {
      const res = await fetch(url);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const j: any = await res.json();
      forecastCode = j?.current?.weather_code ?? -1;
    } catch (e) {
      console.error("Forecast fetch error", e);
      return;
    }

    // 2. Compare (Simplified Logic)
    let mismatch = false;
    const reportedLabel = conditions[0]; // Primary condition

    // WMO Code Groups
    // Rain: 51-67, 80-82
    const isRainForecast = (forecastCode >= 51 && forecastCode <= 67) ||
      (forecastCode >= 80 && forecastCode <= 82);
    // Snow: 71-77, 85-86
    const isSnowForecast = (forecastCode >= 71 && forecastCode <= 77) ||
      forecastCode === 85 || forecastCode === 86;
    // Sunny: 0, 1 (Clear/Mainly clear)
    const isSunnyForecast = forecastCode === 0 || forecastCode === 1;

    if (reportedLabel === "Rain" && !isRainForecast) mismatch = true;
    if (reportedLabel === "Snow" && !isSnowForecast) mismatch = true;
    if (reportedLabel === "Sunny" && !isSunnyForecast) mismatch = true;

    if (!mismatch) return;

    // 3. Notify Nearby Users
    const messaging = getMessaging();
    const RADIUS_DEG = 0.045; // Approx 5km

    try {
      const tokensSnap = await db.collection("push_tokens").get();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const messages: any[] = [];

      for (const doc of tokensSnap.docs) {
        const tData = doc.data();
        if (!tData.lat || !tData.lng || !tData.token) continue;

        // Simple distance check
        const dLat = Math.abs(tData.lat - lat);
        const dLng = Math.abs(tData.lng - lng);

        if (dLat < RADIUS_DEG && dLng < RADIUS_DEG) {
          const lang = tData.language || "en";
          let title = "🤔 Weather Update?";
          let body = `Someone reported "${reportedLabel}" in your area, ` +
            "but the forecast disagrees. Is it true?";

          // Translations
          if (lang === "fr") {
            title = "🤔 Météo en direct ?";
            // Translate common labels
            const frLabels: any = {
              "Sunny": "Soleil",
              "Rain": "Pluie",
              "Cloudy": "Nuages",
              "Snow": "Neige",
              "Storm": "Orage",
              "Fog": "Brouillard",
              "Windy": "Vent",
            };
            const frCondition = frLabels[reportedLabel] || reportedLabel;
            body = `Quelqu'un a signalé "${frCondition}" dans votre zone, ` +
              "mais les prévisions disent autre chose. Confirmez-vous ?";
          }

          messages.push({
            token: tData.token,
            notification: {
              title: title,
              body: body,
            },
            data: {
              type: "verification",
              reportId: event.params.reportId,
              condition: reportedLabel,
            },
            webpush: {
              fcm_options: {
                link: "/?action=contribution",
              },
            },
          });
        }
      }

      if (messages.length > 0) {
        // Chunking if necessary (limit is 500)
        const chunks = [];
        for (let i = 0; i < messages.length; i += 500) {
          chunks.push(messages.slice(i, i + 500));
        }
        for (const chunk of chunks) {
          await messaging.sendEach(chunk);
        }
        console.log(`Sent verification to ${messages.length} users.`);
      }
    } catch (e) {
      console.error("Error sending verification notifications", e);
    }
  });
