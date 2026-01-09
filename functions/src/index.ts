import { onCall, onRequest } from "firebase-functions/v2/https";
import { onDocumentCreated } from "firebase-functions/v2/firestore";
import { onSchedule } from "firebase-functions/v2/scheduler";
import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getMessaging } from "firebase-admin/messaging";
import { defineSecret } from "firebase-functions/params";
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

  const today = new Date().toDateString();
  const prompt = `Context: Today is ${today}. ` +
    "Generate a SINGLE, SHORT inspiring quote (MAX 25 WORDS) " +
    `based on the theme: "${theme}". ` +
    "CRITICAL INSTRUCTIONS:\n" +
    `1. The 'author' MUST be one of these: ${authors.join(", ")}.\n` +
    "2. Prioritize variety. Mix well-known quotes with deeper, " +
    "lesser-known ones to keep it fresh.\n" +
    "3. Provide the quote in both English ('en') and French ('fr').\n" +
    "4. Return ONLY valid JSON. No markdown, no backticks.\n" +
    "5. Format: {\"en\": {\"text\": \"...\", \"author\": \"...\"}, " +
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
      messages: [{ role: "user", content: prompt }],
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
        text: "The happiness of your life depends upon the quality of " +
          "your thoughts.",
        author: "Marcus Aurelius",
      },
      fr: {
        text: "Le bonheur de votre vie dépend de la qualité de vos pensées.",
        author: "Marc Aurèle",
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
export const generateQuote = onCall({ secrets: [openRouterApiKey] },
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

      return { success: true, data: data };
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
  const { token, timezone, lat, lng } = request.data;
  if (!token) return { success: false, error: "No token" };

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
    lastQuoteDate: "", // Track daily quote sent date
  }, { merge: true });

  return { success: true };
});

// Hourly Cron for Smart Notifications
export const sendHourlyNotifications = onSchedule({
  schedule: "every 15 minutes",
  timeoutSeconds: 540,
  secrets: [openRouterApiKey],
}, async () => {
  const db = getFirestore();
  const messaging = getMessaging();
  const now = new Date();

  // Fetch all tokens
  const snapshot = await db.collection("push_tokens").get();

  // CRITICAL FIX: Universal Quote System
  // Everyone in the world gets the SAME quote on the same calendar day
  // We use UTC+14 (furthest ahead timezone) as the "global day" reference
  // This ensures Paris, NYC, Da Nang, Singapore all get the same quote
  // when it's the same calendar date for them
  const utcPlus14 = new Date(now.getTime() + (14 * 60 * 60 * 1000));
  const universalDateKey = utcPlus14.toISOString().split("T")[0];
  const slotKey = `${universalDateKey}-all-day-v6`;

  // We only send the quote notification at 7am local time.
  // We can pre-fetch the morning quote.
  let globalQuote: any = null;
  try {
    globalQuote = await getOrGenerateQuote(
      slotKey,
      utcPlus14.getDay(), // Use UTC+14 day for theme consistency
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

  // --- DEDUPLICATION LOGIC START ---
  // Filter tokens to keep only the latest one per User ID
  const allDocs = snapshot.docs.map((d) => ({ ref: d.ref, data: d.data() }));

  // Sort by updatedAt DESC (newest first)
  allDocs.sort((a, b) => {
    const timeA = a.data.updatedAt?.toMillis ? a.data.updatedAt.toMillis() : 0;
    const timeB = b.data.updatedAt?.toMillis ? b.data.updatedAt.toMillis() : 0;
    return timeB - timeA;
  });

  const uniqueDocs: { ref: any, data: any }[] = [];
  const processedUserIds = new Set<string>();

  for (const item of allDocs) {
    const uid = item.data.userId;
    // If we have a user ID, ensure we only process the FIRST (newest) one we see
    if (uid) {
      if (processedUserIds.has(uid)) continue;
      processedUserIds.add(uid);
    }
    // If no userId, we assume it's a unique anonymous device (or legacy), so keep it.
    // (Or we could dedup by token string, but that's implicit since docs are unique)
    uniqueDocs.push(item);
  }

  console.log(`[DEDUP] Processing ${uniqueDocs.length} unique devices (from ${snapshot.size} total).`);
  // --- DEDUPLICATION LOGIC END ---

  const sentQuoteUserIds = new Set<string>(); // Keep for extra safety on quotes

  for (const docObj of uniqueDocs) {
    const data = docObj.data;
    const docRef = docObj.ref; // Use this for updates
    const tz = data.timezone || "UTC";

    // Local Time
    const localDate = new Date(now.toLocaleString("en-US", { timeZone: tz }));
    const localHour = localDate.getHours();

    // Use local date string (M/D/YYYY) as unique key for "Today"
    const currentLocalDay = localDate.toLocaleDateString(
      "en-US",
      { timeZone: tz }
    );

    // --- 1. MORNING QUOTE (07:00+) ---
    // Robust Logic: Send if > 7am AND not sent yet today.
    const lastQuoteDay = data.lastQuoteDate || "";

    if (localHour === 7 && lastQuoteDay !== currentLocalDay) {
      // Deduplication by User ID
      if (data.userId && sentQuoteUserIds.has(data.userId)) {
        console.log(`[QUOTE] Skipping duplicate for user ${data.userId}`);
      } else {
        if (data.userId) sentQuoteUserIds.add(data.userId); // Mark user as sent

        if (globalQuote) {
          // Localized Quote
          const lang = data.language || "en";
          const qContent = lang === "fr" ? globalQuote.fr : globalQuote.en;
          const qTitle = lang === "fr" ?
            "Inspiration Quotidienne" :
            "Daily Inspiration";

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
                  { action: "report_sun", title: titleSun },
                  { action: "report_rain", title: titleRain },
                ],
              },
              fcm_options: {
                link: "/?action=contribution",
              },
            },
          });

          // Mark as sent for today
          updates.push({
            ref: docRef,
            data: {
              lastQuoteDate: currentLocalDay,
            },
          });
        }
      }
    }

    // --- 2. CONTEXTUAL WEATHER NOTIFICATIONS (24/7) ---
    // Removed Time Windows logic to support 24/7 alerts for dangerous weather.

    // Check if user has location
    if (data.lat && data.lng) {
      // Always allowing check, but limiting sends via logic below
      const canSend = true;

      // CRITICAL FIX: Normalize lastWeatherNotif to Date
      // Firestore stores dates as Timestamps with toDate() method
      let lastSent: Date | null = null;

      try {
        if (data.lastWeatherNotif) {
          // Firestore Timestamp has toDate() method
          if (typeof data.lastWeatherNotif.toDate === "function") {
            lastSent = data.lastWeatherNotif.toDate();
          } else {
            // Fallback for legacy formats
            const attemptedDate = new Date(data.lastWeatherNotif);
            if (!isNaN(attemptedDate.getTime())) {
              lastSent = attemptedDate;
            }
          }
        }
      } catch (e) {
        // If conversion fails, treat as null (first time)
        console.log("[WEATHER CHECK] Failed to parse lastWeatherNotif:", e);
        lastSent = null;
      }

      const sentTodayCount = data.weatherNotifCountToday || 0;

      let lastSentDay = "";
      if (lastSent) {
        lastSentDay = lastSent.toLocaleDateString(
          "en-US",
          { timeZone: tz },
        );
      }

      // Reset counter if new day
      const newCount = (lastSentDay !== currentLocalDay) ? 0 : sentTodayCount;

      if (canSend) {
        // Fetch Weather
        try {
          console.log(`[WEATHER CHECK] User token: ${data.token.substring(0, 20)}...`);
          console.log(`[WEATHER CHECK] Location: ${data.lat}, ${data.lng}`);

          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 5000);
          // 5 second timeout
          const wUrl = "https://api.open-meteo.com/v1/forecast?latitude=" +
            `${data.lat}&longitude=${data.lng}` +
            "&current=weather_code,temperature_2m," +
            "wind_speed_10m,wind_gusts_10m,precipitation" +
            "&minutely_15=weather_code" +
            "&models=meteofrance_seamless,meteofrance_arpege_world,ecmwf_ifs04," +
            "gfs_seamless,jma_seamless,gem_seamless,icon_seamless," +
            "cma_grapes_global,bom_access_global";

          console.log(`[WEATHER CHECK] Fetching: ${wUrl}`);
          const weatherRes = await fetch(wUrl, { signal: controller.signal });
          clearTimeout(timeoutId);
          const wData: {
            current?: {
              weather_code: number;
              temperature_2m: number;
              wind_speed_10m: number;
              wind_gusts_10m?: number;
              precipitation?: number;
            };
            minutely_15?: {
              weather_code: number[];
            };
          } = await weatherRes.json();
          const current = wData.current;
          const minutely15 = wData.minutely_15;

          console.log("[WEATHER CHECK] Current weather:", JSON.stringify(current));
          console.log(`[WEATHER CHECK] Minutely15 available: ${!!minutely15}`);

          if (current) {
            const lastState = data.lastWeatherState;
            console.log("[WEATHER CHECK] Last state:", JSON.stringify(lastState));

            let ruptureDetected = false;
            let msgBody = "";
            let msgTitle = ""; // Dynamic title
            let forceSend = false; // Bypass limits for danger
            let isForecastAlert = false; // Is this a future prediction?

            const isCurrentlyDangerous = (current.weather_code >= 51) ||
              [95, 96, 99].includes(current.weather_code) ||
              (current.wind_speed_10m > 70);

            // 0. FORECAST CHECK (Proactive - CRITICAL!)
            // Alert users BEFORE dangerous weather arrives
            const forecast = getDangerousForecast(
              minutely15,
              current.weather_code,
              current
            );
            const lang = data.language || "en";

            if (forecast) {
              // FORECAST FOUND! Alert the community BEFORE it hits
              isForecastAlert = true;
              ruptureDetected = true;
              forceSend = true; // Always warn about coming danger

              // Customize message based on danger type
              if (forecast.type === "storm") {
                if (lang === "fr") {
                  msgTitle = "⛈️ ALERTE ORAGE";
                  msgBody = `DANGER ! Orage prévu dans ~${forecast.start} ` +
                    `min (durée: ${forecast.duration} min). Mettez-vous ` +
                    "à l'abri !";
                } else {
                  msgTitle = "⛈️ STORM ALERT";
                  msgBody = `DANGER! Storm expected in ~${forecast.start} ` +
                    `min (duration: ${forecast.duration} min). Take ` +
                    "shelter!";
                }
              } else if (forecast.type === "snow") {
                if (lang === "fr") {
                  msgTitle = "❄️ Alerte Neige";
                  msgBody = `Neige prévue dans ~${forecast.start} min ` +
                    `(durée: ${forecast.duration} min). Préparez-vous !`;
                } else {
                  msgTitle = "❄️ Snow Alert";
                  msgBody = `Snow expected in ~${forecast.start} min ` +
                    `(duration: ${forecast.duration} min). Get ready!`;
                }
              } else {
                // Rain
                if (lang === "fr") {
                  msgTitle = "🌧️ Prévision Pluie";
                  msgBody = `Pluie prévue dans ~${forecast.start} min ` +
                    `(durée estimée: ${forecast.duration} min).`;
                } else {
                  msgTitle = "🌧️ Rain Forecast";
                  msgBody = `Rain expected in ~${forecast.start} min ` +
                    `(duration: ${forecast.duration} min).`;
                }
              }
            } else if (isCurrentlyDangerous) {
              // 1. IMMEDIATE ONSET & ONGOING DURATION
              // Logic: It is raining NOW.
              // Action: Find when it stops.
              ruptureDetected = true;
              forceSend = true;

              const code = current.weather_code;
              let type = "rain";
              if (code >= 95) type = "storm";
              else if (code >= 71 && code <= 77) type = "snow";
              else if (code === 85 || code === 86) type = "snow"; // Snow showers

              // Calculate Duration (When does it stop?)
              let remainingMin = 0;
              let foundEnd = false;
              if (minutely15 && minutely15.weather_code) {
                const codes = minutely15.weather_code;
                // Look ahead 2 hours max (8 slots)
                for (let i = 0; i < 8 && i < codes.length; i++) {
                  const c = codes[i];
                  // Check if it's still "bad"
                  // Storm, Rain, Snow, Drizzle, Showers
                  const isBad = (c >= 51 && c <= 67) || (c >= 71 && c <= 77) ||
                    (c >= 80 && c <= 82) || (c >= 85 && c <= 86) || (c >= 95);

                  if (isBad) {
                    remainingMin += 15;
                  } else {
                    // Found a clear slot!
                    foundEnd = true;
                    break;
                  }
                }
              }

              // Helper for > 2h message
              const longDurationFr = "sera encore présente pour les deux prochaines heures.";
              const longDurationFrMasc = "sera encore présent pour les deux prochaines heures.";

              const longDurationEn = "will be present for the next two hours.";

              if (lang === "fr") {
                if (type === "storm") {
                  msgTitle = "⛈️ ORAGE EN COURS";
                  const suffix = foundEnd
                    ? `devrait s'arrêter dans ${remainingMin} minutes environ.`
                    : longDurationFrMasc;
                  msgBody = `Un orage est en cours. Il ${suffix}`;
                } else if (type === "snow") {
                  msgTitle = "❄️ IL NEIGE";
                  const suffix = foundEnd
                    ? `devrait s'arrêter dans ${remainingMin} minutes environ.`
                    : longDurationFr;
                  msgBody = `La neige ${suffix}`;
                } else {
                  // Rain
                  msgTitle = "🌧️ IL PLEUT";
                  const suffix = foundEnd
                    ? `devrait s'arrêter dans ${remainingMin} minutes environ.`
                    : longDurationFr;
                  msgBody = `La pluie ${suffix}`;
                }
              } else {
                const suffix = foundEnd
                  ? `should stop in about ${remainingMin} minutes.`
                  : longDurationEn;

                if (type === "storm") {
                  msgTitle = "⛈️ STORM ACTIVE";
                  msgBody = `Storm is active. It ${suffix}`;
                } else if (type === "snow") {
                  msgTitle = "❄️ SNOWING";
                  msgBody = `Snow ${suffix}`;
                } else {
                  msgTitle = "🌧️ RAINING";
                  msgBody = `Rain ${suffix}`;
                }
              }
            }


            // CHECK LIMITS
            const minutesSinceLast = lastSent ?
              (now.getTime() - lastSent.getTime()) / (1000 * 60) :
              Infinity; // First time = always allow

            const withinLimits = (newCount < 2 && minutesSinceLast >= 240); // 4 hours for normal updates

            console.log(`[ALERT CHECK] Rupture detected: ${ruptureDetected}`);
            console.log(`[ALERT CHECK] Force send: ${forceSend}`);
            console.log(`[ALERT CHECK] New count today: ${newCount}`);
            console.log(`[ALERT CHECK] Minutes since last: ${minutesSinceLast.toFixed(0)}`);

            let finalCanSend = false;
            // logic: If danger (forceSend), we allow it up to 10 times/day
            // BUT we enforce a 30-minute Clean-Up Period to prevent duplicate execution spam
            if (forceSend) {
              if (newCount < 10 && minutesSinceLast >= 30) finalCanSend = true;
            } else {
              if (withinLimits) finalCanSend = true;
            }

            console.log(`[ALERT CHECK] Final can send: ${finalCanSend}`);
            console.log(`[ALERT CHECK] Message title: ${msgTitle}`);
            console.log(`[ALERT CHECK] Message body: ${msgBody}`);

            // Only proceed if rupture AND allowed
            if (ruptureDetected && finalCanSend) {
              console.log(`[ALERT SEND] ✅ SENDING ALERT to ${data.token.substring(0, 20)}...`);
              // If not set by loop
              if (!msgTitle) {
                const title = lang === "fr" ?
                  "Point Météo" : "Weather Update";
                msgTitle = title;
              }

              messages.push({
                token: data.token,
                notification: { title: msgTitle, body: msgBody },
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
                ref: docRef,
                data: {
                  lastWeatherNotif: new Date(),
                  weatherNotifCountToday: newCount + 1,
                },
              });
            }
            // Save new state (always save, even if no notification sent)
            updates.push({
              ref: docRef,
              data: {
                lastWeatherState: {
                  code: current.weather_code,
                  temp: current.temperature_2m,
                  wind: current.wind_speed_10m,
                  gusts: current.wind_gusts_10m || 0,
                  precip: current.precipitation || 0,
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

  // Execute updates using Batches (Max 500 per batch)
  const writeBatches: any[] = [];
  let currentBatch = db.batch();
  let operationCounter = 0;

  for (const up of updates) {
    currentBatch.set(up.ref, up.data, { merge: true });
    operationCounter++;

    if (operationCounter === 500) {
      writeBatches.push(currentBatch.commit());
      currentBatch = db.batch();
      operationCounter = 0;
    }
  }
  // Push remaining ops
  if (operationCounter > 0) {
    writeBatches.push(currentBatch.commit());
  }

  await Promise.all(writeBatches);

  // Send Messages
  if (messages.length > 0) {
    // ENHANCED DEDUPLICATION: Ensure unique (token + type) combinations
    // This prevents the same user from receiving duplicate weather alerts
    const seenCombos = new Set<string>();
    const uniqueMessages = messages.filter(msg => {
      const combo = `${msg.token}:${msg.data?.type || 'unknown'}`;
      if (seenCombos.has(combo)) {
        console.log(`[DEDUP] Blocked duplicate: ${combo.substring(0, 40)}...`);
        return false;
      }
      seenCombos.add(combo);
      return true;
    });

    console.log(`[SEND] Original: ${messages.length}, After dedup: ${uniqueMessages.length}`);

    const chunks = [];
    for (let i = 0; i < uniqueMessages.length; i += 500) {
      chunks.push(uniqueMessages.slice(i, i + 500));
    }
    for (const chunk of chunks) {
      await messaging.sendEach(chunk);
    }
    console.log(`Sent ${uniqueMessages.length} notifications (${messages.length - uniqueMessages.length} duplicates blocked).`);
  }
});

/**
 * CRITICAL: Detect ALL dangerous weather events in forecast
 * Looks at next 8 slots (2 hours) for: Rain, Snow, Storm, Violent Wind
 * @param {any} minutely15 The OpenMeteo minutely_15 object
 * @param {number} currentCode The current weather code
 * @param {any} current Current weather data (for wind check)
 * @return {{type: string, start: number, duration: number} | null}
 */
function getDangerousForecast(
  minutely15: any,
  currentCode: number,
  current: any
): { type: string, start: number, duration: number } | null {
  if (!minutely15 || !minutely15.weather_code) return null;
  const codes = minutely15.weather_code;

  // If it's already dangerous now, we rely on immediate alerts
  // MODIFICATION: We DO NOT return null here anymore. 
  // We want to know if a dangerous event is continuing or starting.
  // The caller will handle "Current vs Forecast" priority.
  // Prior logic (if isCurrentlyDangerous return null) removed.

  let startIndex = -1;
  let endIndex = -1;
  let eventType = "";

  // Look ahead up to 2 hours (8 slots of 15 min)
  for (let i = 0; i < 8 && i < codes.length; i++) {
    const code = codes[i];

    // Detect ALL dangerous conditions
    let isDangerous = false;
    let detectedType = "";

    // STORM (Priority 1 - Most dangerous)
    if (code >= 95 && code <= 99) {
      isDangerous = true;
      detectedType = "storm";
    }
    // SNOW (Priority 2)
    else if ((code >= 71 && code <= 77) ||
      code === 85 || code === 86) {
      isDangerous = true;
      detectedType = "snow";
    }
    // RAIN (Priority 3)
    else if ((code >= 51 && code <= 67) ||
      (code >= 80 && code <= 82)) {
      isDangerous = true;
      detectedType = "rain";
    }

    if (isDangerous) {
      if (startIndex === -1) {
        startIndex = i;
        eventType = detectedType;
      }
      // Extend end index as long as it is bad
      endIndex = i;
      // Upgrade event type if we find something worse
      if (detectedType === "storm") {
        eventType = "storm";
      } else if (detectedType === "snow" && eventType !== "storm") {
        eventType = "snow";
      }
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

    return { type: eventType, start: startMin, duration: durationMin };
  }

  return null;
}

// TEST FUNCTION: Trigger via URL
// https://us-central1-wise-weather-app.cloudfunctions.net/triggerTestNotification?type=quote&token=...
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const triggerTestNotification = onRequest(async (req: any, res: any) => {
  const { type = "quote", token: queryToken } = req.query;
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
              reporterId: data.userId || "",
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
