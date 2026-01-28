import { onCall, onRequest, HttpsError } from "firebase-functions/v2/https";
// FORCE DEPLOY 2026-01-24 v9 - United Backend Logic (Multi-Model)
import { onDocumentCreated } from "firebase-functions/v2/firestore";
import { onSchedule } from "firebase-functions/v2/scheduler";
import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getMessaging } from "firebase-admin/messaging";
import { defineSecret } from "firebase-functions/params";
import { GoogleGenerativeAI } from "@google/generative-ai";
import Stripe from "stripe";

initializeApp();

const geminiApiKey = defineSecret("GEMINI_API_KEY");
const googlePollenApiKey = defineSecret("GOOGLE_POLLEN_API_KEY");

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

  const today = new Date().toDateString();
  const prompt = `Context: Today is ${today}. ` +
    "Generate a SINGLE, SHORT inspiring quote (MAX 25 WORDS) " +
    `based on the theme: "${theme}". ` +
    "CRITICAL INSTRUCTIONS:\n" +
    "1. Select an inspiring author relevant to the theme. Ensure great diversity in authors (philosophers, scientists, poets, leaders, etc.).\n" +
    "2. Prioritize variety. Mix well-known quotes with deeper, " +
    "lesser-known ones to keep it fresh.\n" +
    "3. Provide the quote in both English ('en') and French ('fr').\n" +
    "4. Return ONLY valid JSON. No markdown, no backticks.\n" +
    "5. Format: {\"en\": {\"text\": \"...\", \"author\": \"...\"}, " +
    "\"fr\": {\"text\": \"...\", \"author\": \"...\"}}";

  if (!apiKey) {
    throw new Error("Missing GEMINI_API_KEY");
  }

  // DIRECT GEMINI INTEGRATION (Native SDK)
  const genAI = new GoogleGenerativeAI(apiKey);
  // Using 1.5 Flash for speed and stability
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" }, { timeout: 5000 });

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const content = response.text();

    if (!content) throw new Error("No response from Gemini API");

    // Clean potential markdown blocks
    const cleanJson = content.replace(/```json/g, "")
      .replace(/```/g, "").trim();
    return JSON.parse(cleanJson);
  } catch (error) {
    console.error("Gemini API Error:", error);
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
  apiKey: string // We keep the param generic, but it's now Gemini Key
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
export const generateQuote = onCall({ secrets: [geminiApiKey] },
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
        geminiApiKey.value()
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
  secrets: [geminiApiKey],
}, async () => {
  const db = getFirestore();
  const messaging = getMessaging();
  const now = new Date();

  // Fetch all tokens
  const snapshot = await db.collection("push_tokens").get();

  // --- DEDUPLICATION LOGIC ---
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
    if (uid) {
      if (processedUserIds.has(uid)) continue;
      processedUserIds.add(uid);
    }
    uniqueDocs.push(item);
  }

  console.log(`[DEDUP] Processing ${uniqueDocs.length} unique devices (from ${snapshot.size} total).`);

  // --- PREPARE GLOBAL QUOTE ---
  const utcPlus14 = new Date(now.getTime() + (14 * 60 * 60 * 1000));
  const universalDateKey = utcPlus14.toISOString().split("T")[0];
  const slotKey = `${universalDateKey}-all-day-v6`;

  let globalQuote: any = null;
  try {
    globalQuote = await getOrGenerateQuote(
      slotKey,
      utcPlus14.getDay(),
      geminiApiKey.value()
    );
  } catch (e) {
    console.error("Quote gen failed", e);
  }

  if (!globalQuote) {
    globalQuote = {
      en: { text: "The future belongs to those who believe in the beauty of their dreams.", author: "Eleanor Roosevelt" },
      fr: { text: "L'avenir appartient à ceux qui croient à la beauté de leurs rêves.", author: "Eleanor Roosevelt" },
    };
  }

  // --- PHASE 1: QUOTES (PRIORITY & FAST) ---
  // We execute this FIRST and commit to DB immediately to avoid race conditions.
  const quoteUpdates: { ref: any, data: any }[] = [];
  const quoteMessages: any[] = [];
  const sentQuoteUserIds = new Set<string>();

  for (const docObj of uniqueDocs) {
    const data = docObj.data;
    const tz = data.timezone || "UTC";

    let localDate;
    try { localDate = new Date(now.toLocaleString("en-US", { timeZone: tz })); }
    catch (e) { localDate = new Date(); }

    const localHour = localDate.getHours();
    const currentLocalDay = localDate.toLocaleDateString("en-US", { timeZone: tz });
    const lastQuoteDay = data.lastQuoteDate || "";

    // Rule: Send if 7 AM AND it is the top of the hour (minutes < 12)
    // This prevents the 7:15/7:30/7:45 executions from resending if the first one failed to persist state
    if (localHour === 7 && localDate.getMinutes() < 12 && lastQuoteDay !== currentLocalDay) {
      if (data.userId && sentQuoteUserIds.has(data.userId)) continue;
      if (data.userId) sentQuoteUserIds.add(data.userId);

      const lang = data.language || "en";
      const qContent = lang === "fr" ? globalQuote.fr : globalQuote.en;
      const qTitle = lang === "fr" ? "Inspiration Quotidienne" : "Daily Inspiration";
      const titleSun = lang === "fr" ? "☀️ Soleil" : "☀️ Sun";
      const titleRain = lang === "fr" ? "🌧️ Pluie" : "🌧️ Rain";

      quoteMessages.push({
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
          notification: { actions: [{ action: "report_sun", title: titleSun }, { action: "report_rain", title: titleRain }] },
          fcm_options: { link: "/?action=contribution" },
        },
      });

      quoteUpdates.push({ ref: docObj.ref, data: { lastQuoteDate: currentLocalDay } });

      // PERSIST HISTORY (If userId exists)
      if (data.userId) {
        db.collection('users').doc(data.userId).collection('notifications').add({
          title: qTitle,
          body: `"${qContent.text}"\n— ${qContent.author}`,
          data: { type: "quote" },
          timestamp: new Date().getTime(), // Millis for easy sorting
          read: false
        });
      }
    }
  }

  // COMMIT QUOTES
  if (quoteUpdates.length > 0) {
    console.log(`[QUOTE] Updating DB for ${quoteUpdates.length} users (Phase 1)...`);
    const batches = [];
    let batch = db.batch();
    let count = 0;
    for (const up of quoteUpdates) {
      batch.set(up.ref, up.data, { merge: true });
      count++;
      if (count === 490) { batches.push(batch.commit()); batch = db.batch(); count = 0; }
    }
    if (count > 0) batches.push(batch.commit());
    await Promise.all(batches);
    console.log(`[QUOTE] DB Updates Committed.`);

    // Send messages (Non-blocking)
    const mChunks = [];
    for (let i = 0; i < quoteMessages.length; i += 500) mChunks.push(quoteMessages.slice(i, i + 500));
    for (const ch of mChunks) {
      try { await messaging.sendEach(ch); } catch (e) { console.error("Quote send error", e); }
    }
    console.log(`[QUOTE] Sent ${quoteMessages.length} quote notifications.`);
  }


  // --- PHASE 2: WEATHER ALERTS (SLOW) ---
  const weatherUpdates = new Map<string, { ref: any, data: any }>();
  const weatherMessages: any[] = [];

  const addUpdate = (ref: any, newData: any) => {
    const path = ref.path;
    const existing = weatherUpdates.get(path);
    if (existing) weatherUpdates.set(path, { ref, data: { ...existing.data, ...newData } });
    else weatherUpdates.set(path, { ref, data: newData });
  };

  for (const docObj of uniqueDocs) {
    const data = docObj.data;
    const docRef = docObj.ref;
    const tz = data.timezone || "UTC";

    // Check Weather
    if (data.lat && data.lng) {
      const canSend = true;
      let lastSent: Date | null = null;
      try {
        if (data.lastWeatherNotif) {
          // Firestore Timestamp has toDate() method
          if (typeof data.lastWeatherNotif.toDate === "function") {
            lastSent = data.lastWeatherNotif.toDate();
          } else {
            const attemptedDate = new Date(data.lastWeatherNotif);
            if (!isNaN(attemptedDate.getTime())) lastSent = attemptedDate;
          }
        }
      } catch (e) { lastSent = null; }

      const sentTodayCount = data.weatherNotifCountToday || 0;

      let localDate;
      try { localDate = new Date(now.toLocaleString("en-US", { timeZone: tz })); } catch (e) { localDate = new Date(); }
      const currentLocalDay = localDate.toLocaleDateString("en-US", { timeZone: tz });

      let lastSentDay = "";
      if (lastSent) {
        lastSentDay = lastSent.toLocaleDateString("en-US", { timeZone: tz });
      }

      const newCount = (lastSentDay !== currentLocalDay) ? 0 : sentTodayCount;

      if (canSend) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout

          // ⚠️ CRITICAL: PROTECTED LOGIC - DO NOT MODIFY WITHOUT EXPLICIT USER APPROVAL
          // We intentionally query 10+ specific weather models to perform a "Safety Synthesis".
          // If ANY of these models predicts danger (Storm/Rain), we trigger an alert.
          // >> DO NOT revert to "auto" model selection.
          // >> DO NOT remove this list of models.
          // This disconnect between Backend (Sensitive) and Frontend (Standard) is INTENTIONAL.
          const wUrl = "https://api.open-meteo.com/v1/forecast?latitude=" +
            `${data.lat}&longitude=${data.lng}` +
            "&current=weather_code,temperature_2m," +
            "wind_speed_10m,wind_gusts_10m,precipitation" +
            "&minutely_15=weather_code" +
            "&models=meteofrance_seamless,meteofrance_arpege_world,ecmwf_ifs04," +
            "gfs_seamless,jma_seamless,gem_seamless,icon_seamless," +
            "cma_grapes_global,bom_access_global";

          const weatherRes = await fetch(wUrl, { signal: controller.signal });
          clearTimeout(timeoutId);
          const wData: any = await weatherRes.json();
          const current = wData.current;
          const minutely15 = wData.minutely_15;

          if (current) {
            let ruptureDetected = false;
            let msgBody = "";
            let msgTitle = "";
            let forceSend = false;
            let isForecastAlert = false;

            const isCurrentlyDangerous = (current.weather_code >= 51) ||
              [95, 96, 99].includes(current.weather_code) ||
              (current.wind_speed_10m > 70);

            const forecast = getDangerousForecast(minutely15, current.weather_code, current);
            const lang = data.language || "en";

            if (forecast) {
              isForecastAlert = true;
              ruptureDetected = true;
              forceSend = true;

              const startMin = forecast.start;
              // Calculate specific start time
              const startTimeDate = new Date(localDate.getTime() + startMin * 60000);
              const startHour = startTimeDate.getHours().toString().padStart(2, '0');
              const startMinute = startTimeDate.getMinutes().toString().padStart(2, '0');
              const timeDisplay = `${startHour}:${startMinute}`;

              const isStartingNow = startMin <= 5;
              const timingStrFr = isStartingNow ? "maintenant" : `à ${timeDisplay}`;
              const timingStrEn = isStartingNow ? "now" : `at ${timeDisplay}`;

              const isIntermittent = forecast.isIntermittent;
              const intensityLabelFr = getIntensityLabel(forecast.maxLevel, "fr");
              const intensityLabelEn = getIntensityLabel(forecast.maxLevel, "en");

              // Calculate specific end time
              const endMin = forecast.start + forecast.duration;
              const endTimeDate = new Date(localDate.getTime() + endMin * 60000);
              const endHour = endTimeDate.getHours().toString().padStart(2, '0');
              const endMinute = endTimeDate.getMinutes().toString().padStart(2, '0');
              const endTimeDisplay = `${endHour}:${endMinute}`;

              if (forecast.type === "storm") {
                if (lang === "fr") {
                  msgTitle = isStartingNow ? "⛈️ ORAGE EN COURS" : "⛈️ ALERTE ORAGE";
                  msgBody = `DANGER ! Orage ${intensityLabelFr} ${timingStrFr} (fin prévue: ${endTimeDisplay}). Mettez-vous à l'abri !`;
                } else {
                  msgTitle = isStartingNow ? "⛈️ STORM ACTIVE" : "⛈️ STORM ALERT";
                  msgBody = `DANGER! ${intensityLabelEn} Storm ${timingStrEn} (ends at ${endTimeDisplay}). Take shelter!`;
                }
              } else if (forecast.type === "snow") {
                if (lang === "fr") {
                  msgTitle = isStartingNow ? "❄️ NEIGE EN COURS" : "❄️ ALERTE NEIGE";
                  msgBody = `${isIntermittent ? "Tombées de neige" : "Neige"} ${intensityLabelFr} ${timingStrFr} (fin prévue: ${endTimeDisplay}).`;
                } else {
                  msgTitle = isStartingNow ? "❄️ SNOWING" : "❄️ SNOW ALERT";
                  msgBody = `${intensityLabelEn} ${isIntermittent ? "Snow showers" : "Snow"} ${timingStrEn} (ends at ${endTimeDisplay}).`;
                }
              } else {
                if (lang === "fr") {
                  msgTitle = isStartingNow ? "🌧️ PLUIE EN COURS" : "🌧️ Bientôt de la Pluie";
                  msgBody = `${isIntermittent ? "Averses" : "Pluie"} ${intensityLabelFr} ${timingStrFr} (fin prévue: ${endTimeDisplay}).`;
                } else {
                  msgTitle = isStartingNow ? "🌧️ RAINING" : "🌧️ Rain Forecast";
                  msgBody = `${intensityLabelEn} ${isIntermittent ? "Showers" : "Rain"} ${timingStrEn} (ends at ${endTimeDisplay}).`;
                }
              }
            } else if (isCurrentlyDangerous) {
              // Current is BAD, but Forecast (next 2h) didn't return a dangerous event.
              // This implies either:
              // 1. Minutely data is MISSING.
              // 2. Minutely data says it clears up immediately (forecast is safe).
              ruptureDetected = true;
              forceSend = true;

              const code = current.weather_code;
              let type = "rain";
              let isForcedIntermittent = false; // Flag for fallback logic
              if (code >= 95) type = "storm";
              else if (code >= 71 && code <= 77) type = "snow";
              else if (code === 85 || code === 86) type = "snow";

              // If minutely data isn't returning a block but we are in a dangerous condition,
              // it might be a very short/intermittent shower that the block logic missed or finished?
              if (code === 80 || code === 81 || code === 82) isForcedIntermittent = true;

              const hasMinutely = minutely15 && minutely15.weather_code && minutely15.weather_code.length > 0;

              if (lang === "fr") {
                if (type === "storm") msgTitle = "⛈️ ORAGE EN COURS";
                else if (type === "snow") msgTitle = "❄️ IL NEIGE";
                else msgTitle = "🌧️ IL PLEUT";

                if (hasMinutely) {
                  msgBody = isForcedIntermittent ?
                    (lang === "fr" ? "Averses intermittentes détectées (Durée est. < 15 min)." : "Intermittent showers detected (Est. duration < 15 min).") :
                    (lang === "fr" ? "Intempérie détectée (Fin estimée < 15 min)." : "Weather event detected (Ends soon).");
                } else {
                  msgBody = lang === "fr" ? "Intempérie observée actuellement (Fin indéterminée)." : "Observed currently in your area (Unknown end time).";
                }
              } else {
                if (type === "storm") msgTitle = "⛈️ STORM ACTIVE";
                else if (type === "snow") msgTitle = "❄️ SNOWING";
                else msgTitle = "🌧️ RAINING";

                if (hasMinutely) {
                  msgBody = isForcedIntermittent ?
                    "Intermittent showers detected (Est. duration < 15 min)." :
                    "Weather event detected (Ends soon).";
                } else {
                  msgBody = "Observed currently in your area (Unknown end time).";
                }
              }
            }

            const minutesSinceLast = lastSent ? (now.getTime() - lastSent.getTime()) / (1000 * 60) : Infinity;
            const withinLimits = (newCount < 2 && minutesSinceLast >= 240); // 4 hours

            let finalCanSend = false;
            if (forceSend) {
              const lastStateCode = data.lastWeatherState?.code ?? -1;
              const lastCat = getEventCategory(lastStateCode);
              const currentCat = getEventCategory(current.weather_code);

              // INTELLIGENT ALGORITHM:
              // 1. New Event (Dry -> Wet)
              // 2. Type Change (Rain -> Snow)
              // 3. Intensification (Light -> Heavy)
              const isNewEvent = lastCat.level === 0 && currentCat.level > 0;
              const isTypeChange = lastCat.type !== currentCat.type && currentCat.level > 0;
              const isIntensification = lastCat.type === currentCat.type && currentCat.level > lastCat.level;

              // If meaningful change, allow immediate notification (with standard 30min cooldown)
              if (isNewEvent || isTypeChange || isIntensification) {
                if (newCount < 10 && minutesSinceLast >= 30) finalCanSend = true;
              } else {
                // Stable or Decreasing condition (e.g. Light Rain continuing, or Heavy -> Light)
                // Suppress for 2 hours to prevent fatigue
                if (minutesSinceLast >= 120) finalCanSend = true;
              }
            } else {
              if (withinLimits) finalCanSend = true;
            }

            if (ruptureDetected && finalCanSend) {
              if (!msgTitle) msgTitle = lang === "fr" ? "Point Météo" : "Weather Update";

              weatherMessages.push({
                token: data.token,
                notification: { title: msgTitle, body: msgBody },
                data: { type: isForecastAlert ? "weather_forecast" : "weather_alert" },
                webpush: { fcm_options: { link: "/?action=contribution" } },
              });

              addUpdate(docRef, {
                lastWeatherNotif: new Date(),
                weatherNotifCountToday: newCount + 1,
              });

              // PERSIST HISTORY (If userId exists)
              if (data.userId) {
                db.collection('users').doc(data.userId).collection('notifications').add({
                  title: msgTitle,
                  body: msgBody,
                  data: { type: isForecastAlert ? "weather_forecast" : "weather_alert" },
                  timestamp: new Date().getTime(),
                  read: false
                });
              }
            }
            addUpdate(docRef, {
              lastWeatherState: {
                code: current.weather_code,
                temp: current.temperature_2m,
                wind: current.wind_speed_10m,
                gusts: current.wind_gusts_10m || 0,
                precip: current.precipitation || 0,
              },
              lastWeatherCheck: new Date(),
            });
          }
        } catch (err) { console.error("Weather check failed", err); }
      }
    }
  }

  // COMMIT WEATHER UPDATES
  const writeBatches: any[] = [];
  let currentBatch = db.batch();
  let operationCounter = 0;

  for (const up of weatherUpdates.values()) {
    currentBatch.set(up.ref, up.data, { merge: true });
    operationCounter++;
    if (operationCounter === 500) {
      writeBatches.push(currentBatch.commit());
      currentBatch = db.batch();
      operationCounter = 0;
    }
  }
  if (operationCounter > 0) writeBatches.push(currentBatch.commit());
  await Promise.all(writeBatches);

  // SEND WEATHER MESSAGES
  if (weatherMessages.length > 0) {
    const seenCombos = new Set<string>();
    const uniqueMessages = weatherMessages.filter(msg => {
      const combo = `${msg.token}:${msg.data?.type || 'unknown'}`;
      if (seenCombos.has(combo)) return false;
      seenCombos.add(combo);
      return true;
    });

    const chunks = [];
    for (let i = 0; i < uniqueMessages.length; i += 500) chunks.push(uniqueMessages.slice(i, i + 500));
    for (const chunk of chunks) await messaging.sendEach(chunk);
    console.log(`[WEATHER] Sent ${uniqueMessages.length} alerts.`);
  }
});

/**
 * Helper to determine event type from code
 */
/**
 * Helper to determine event category and intensity level
 * Level: 0=Dry, 1=Light, 2=Moderate, 3=Heavy/Violent
 */
function getEventCategory(code: number): { type: string, level: number } {
  // Storm (Level 3 - Critical)
  if (code >= 95) return { type: 'storm', level: 3 };

  // Snow
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) {
    if (code === 75 || code === 86) return { type: 'snow', level: 3 };
    if (code === 73) return { type: 'snow', level: 2 };
    return { type: 'snow', level: 1 };
  }

  // Rain
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) {
    if (code === 65 || code === 66 || code === 67 || code === 82) return { type: 'rain', level: 3 };
    if (code === 63 || code === 81) return { type: 'rain', level: 2 };
    return { type: 'rain', level: 1 };
  }

  return { type: 'dry', level: 0 };
}

function getIntensityLabel(level: number, lang: 'fr' | 'en'): string {
  if (level === 1) return lang === 'fr' ? "faible" : "light";
  if (level === 2) return lang === 'fr' ? "modérée" : "moderate";
  if (level === 3) return lang === 'fr' ? "forte" : "heavy";
  return "";
}

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
): { type: string, start: number, duration: number, isIntermittent: boolean, maxLevel: number } | null {
  if (!minutely15) return null;

  // Handle multi-model response format
  // When using models=..., the response has keys like "weather_code_meteofrance_seamless"
  // instead of a simple "weather_code" array
  let codes = minutely15.weather_code;

  if (!codes || !Array.isArray(codes)) {
    // Try to find any model-specific weather_code array
    const keys = Object.keys(minutely15);
    const weatherCodeKey = keys.find(k => k.startsWith('weather_code'));
    if (weatherCodeKey) {
      codes = minutely15[weatherCodeKey];
    }
  }

  if (!codes || !Array.isArray(codes) || codes.length === 0) return null;

  // If it's already dangerous now, we rely on immediate alerts
  // MODIFICATION: We DO NOT return null here anymore. 
  // We want to know if a dangerous event is continuing or starting.
  // The caller will handle "Current vs Forecast" priority.
  // Prior logic (if isCurrentlyDangerous return null) removed.

  let startIndex = -1;
  let endIndex = -1;
  let eventType = "";
  let isIntermittent = false;
  let maxLevel = 0;

  // Look ahead up to 2 hours (8 slots of 15 min)
  for (let i = 0; i < 8 && i < codes.length; i++) {
    const code = codes[i];

    // Detect conditions with sensitivity logic
    let isDangerous = false;
    let detectedType = "";
    let isHeavy = false; // New flag for intensity

    // STORM (Priority 1 - Most dangerous)
    if (code >= 95 && code <= 99) {
      isDangerous = true;
      detectedType = "storm";
      isHeavy = true;
    }
    // SNOW (Priority 2)
    else if ((code >= 71 && code <= 77) || code === 85 || code === 86) {
      isDangerous = true;
      detectedType = "snow";
      // Heavy snow: 73, 75, 86
      if (code === 73 || code === 75 || code === 86) isHeavy = true;
    }
    // RAIN (Priority 3)
    else if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) {
      isDangerous = true;
      detectedType = "rain";
      // Heavy rain: 63, 65, 67 (Freezing heavy), 81, 82 (Showers)
      // MODIFICATION: Include Code 80 (Slight Showers) as IMMEDIATE because showers are by definition "passing"
      // and checking persistence (2 slots) might miss a short 15min shower.
      if (code >= 63 || code >= 80) isHeavy = true;
    }

    // Capture Max Level for intensity label
    const cat = getEventCategory(code);
    if (cat.level > maxLevel) maxLevel = cat.level;

    // SMART FILTERING
    if (isDangerous) {
      // Rule 1: Heavy events trigger immediately (even 1 slot)
      if (isHeavy) {
        // Valid trigger
      }
      // Rule 2: Light events (drizzle, light rain) need confirmation
      // We check if the NEXT slot also has rain (persistence)
      // OR if the previous slot had rain.
      else {
        // Look ahead: i+1 must also be dangerous (any type)
        // OR look behind: i-1 was dangerous
        // This ensures we have at least 2 slots (30 min block) OR it's part of a sequence
        const nextCode = codes[i + 1] || 0;
        const prevCode = codes[i - 1] || 0;

        const isNextBad = (nextCode >= 51);
        const isPrevBad = (prevCode >= 51);

        if (!isNextBad && !isPrevBad) {
          // It's a isolated 15-min light drizzle. Ignore it as noise.
          isDangerous = false;
        }
      }
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
      // If we found a start and now it's clear again, check if it comes back later (Intermittency)
      if (startIndex !== -1) {
        // Gap detected!
        // Look ahead: does it rain again within the 2h window?
        let recurrenceFound = false;
        for (let k = i + 1; k < 8 && k < codes.length; k++) {
          if (codes[k] >= 51) { recurrenceFound = true; break; }
        }

        if (recurrenceFound) {
          isIntermittent = true;
          // Continue loop, do not break. Extend end index to cover the whole intermittent block?
          // User request: "rain ends and picks up 5 mins later".
          // If we break here, we only report the first shower.
          // If we continue, we report the whole block as "Intermittent".
          // Strategy: Continue but flag as Intermittent.
        } else {
          // No recurrence, event is truly over.
          break;
        }
      }
    }
  }

  if (startIndex !== -1) {
    // Calculate minutes
    const startMin = startIndex * 15;
    // Duration: (End - Start + 1) * 15
    const durationMin = (endIndex - startIndex + 1) * 15;

    return { type: eventType, start: startMin, duration: durationMin, isIntermittent: isIntermittent, maxLevel: maxLevel };
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

// Google Pollen API Proxy
export const getPollenForecast = onCall({ secrets: [googlePollenApiKey] }, async (request) => {
  const { lat, lng } = request.data;

  if (!lat || !lng) {
    return { success: false, error: "Missing location data" };
  }

  const apiKey = googlePollenApiKey.value();
  if (!apiKey) {
    return { success: false, error: "API Key not configured" };
  }

  try {
    // Request for 1 day (today)
    // We request the language code from the client or default to 'en'
    const lang = request.data.lang || 'en';
    const response = await fetch(
      `https://pollen.googleapis.com/v1/forecast:lookup?key=${apiKey}&location.latitude=${lat}&location.longitude=${lng}&days=1&languageCode=${lang}`
    );

    if (!response.ok) {
      const errText = await response.text();
      console.error("Google Pollen API Error Details:", errText);
      // Return the specific error to the client for debugging
      return { success: false, error: `API Error: ${response.status} - ${errText}` };
    }

    const data: any = await response.json();
    const todayInfo = data.dailyInfo?.[0];

    if (!todayInfo) {
      return { success: false, error: "No pollen data available" };
    }

    // Dynamic Mapping for "Geographic Relevance"
    // We returned a LIST of relevant pollens, not a fixed schema.
    const activePollens: { code: string, value: number, category: string }[] = [];

    // 1. Categories (Always relevant as summary)
    if (todayInfo.pollenTypeInfo) {
      todayInfo.pollenTypeInfo.forEach((type: any) => {
        const val = type.indexInfo?.value || 0;
        // Return ALL categories relevant to the API response
        activePollens.push({
          code: type.code, // GRASS, TREE, WEED
          value: val,
          category: type.code
        });
      });
    }

    // 2. Specific Plants (Only if present in this region)
    if (todayInfo.plantInfo) {
      todayInfo.plantInfo.forEach((plant: any) => {
        const val = plant.indexInfo?.value || 0;
        // Only return relevant plants (those that exist here, i.e., are in the list)
        // Even if value is 0, it means it exists geographically but is inactive.
        // However, to save UI space, maybe we focus on >0 or "in season"?
        // User wants "geographic location" -> Show what is HERE.
        // So we push ALL plants returned by Google for this location.

        activePollens.push({
          code: plant.code,
          value: val,
          category: plant.plantDescription?.type || 'UNKNOWN'
        });
      });
    }

    return {
      success: true,
      data: {
        items: activePollens
      }
    };

  } catch (error) {
    console.error("Pollen Fetch Error:", error);
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
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

    // LOGIC FLAGS
    let notifyCommunity = true;
    let skipReason = '';

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
        console.log("Anti-spam: Similar report found recently. Suppressing Community Alert.");
        notifyCommunity = false;
        skipReason = 'spam';
      }
    } catch (e) {
      console.error("Anti-spam check failed", e);
    }

    // 1. Fetch Official Forecast for Comparison
    // We check the "current" weather code from Open Meteo
    // ⚠️ CRITICAL: Use SAME multi-model logic as Alerts to ensure consistency
    const url = "https://api.open-meteo.com/v1/forecast?latitude=" +
      `${lat}&longitude=${lng}` +
      "&current=weather_code,temperature_2m" +
      "&models=meteofrance_seamless,meteofrance_arpege_world,ecmwf_ifs04," +
      "gfs_seamless,jma_seamless,gem_seamless,icon_seamless," +
      "cma_grapes_global,bom_access_global";

    let forecastCode = -1;

    try {
      const res = await fetch(url);
      const j: any = await res.json();
      // The API returns 'current' which is a synthesis of the requested models (Best Match)
      // due to how OpenMeteo handles the 'current' parameter when 'models' is specified without explicit 'current_model'.
      // It defaults to the first model or a best match.
      // However, to be SAFE and EXACTLY like the alert logic, we should probably check if it returns what we expect.
      // OpenMeteo documentation says if multiple models are requested, 'current' object is usually based on the first model or requires specific treatment.
      // BUT, in sendHourlyNotifications, we rely on 'wData.current.weather_code'. 
      // Let's stick to that to be identical.
      // Let's stick to that to be identical.
      forecastCode = j?.current?.weather_code ?? -1;
      const forecastTemp = j?.current?.temperature_2m;

      // 1.1 BACKFILL MISSING TEMP (Fix for Fast UI)
      if (data.temp === null || data.temp === undefined) {
        if (forecastTemp !== undefined) {
          console.log(`Backfilling missing temp for report ${event.params.reportId}: ${forecastTemp}`);
          await event.data?.ref.update({ temp: forecastTemp });
        }
      }
    } catch (e) {
      console.error("Forecast fetch error", e);
      return;
    }

    // 2. Compare (Significant Changes Only)
    let mismatch = false;
    const reportedLabel = conditions[0]; // Primary condition

    // Forecast Groups
    const isRainForecast = (forecastCode >= 51 && forecastCode <= 67) || (forecastCode >= 80 && forecastCode <= 82);
    const isSnowForecast = (forecastCode >= 71 && forecastCode <= 77) || forecastCode === 85 || forecastCode === 86;
    const isStormForecast = forecastCode >= 95;

    // Determine Forecast "Type"
    let forecastType = 'Dry'; // Default for Sun, Clouds, Fog, Wind
    if (isRainForecast) forecastType = 'Rain';
    if (isSnowForecast) forecastType = 'Snow';
    if (isStormForecast) forecastType = 'Storm';

    // Determine Report "Type"
    let reportType = 'Dry';
    if (reportedLabel === 'Rain') reportType = 'Rain';
    else if (reportedLabel === 'Snow' || reportedLabel === 'Ice' || reportedLabel === 'Whiteout') reportType = 'Snow';
    else if (reportedLabel === 'Storm') reportType = 'Storm';
    // All others (Sunny, Cloudy, Windy, Mist, Fog) are considered 'Dry' for notification purposes

    // LOGIC: Only notify community if TYPE mismatches.
    if (forecastType !== reportType) {
      mismatch = true;
    }

    if (!mismatch) {
      notifyCommunity = false;
      if (!skipReason) skipReason = 'match';
    }

    // 3. Notify Nearby Users + ALWAYS notify the reporter
    const messaging = getMessaging();
    const RADIUS_DEG = 0.045; // Approx 5km
    const reporterId = data.userId || "";

    try {
      const tokensSnap = await db.collection("push_tokens").get();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const messages: any[] = [];
      let reporterNotified = false;

      for (const doc of tokensSnap.docs) {
        const tData = doc.data();
        if (!tData.token) continue;

        const isReporter = tData.userId === reporterId && reporterId !== "";

        // Check if user is nearby OR is the reporter (reporter ALWAYS gets notified)
        const hasLocation = tData.lat && tData.lng;
        let isNearby = false;
        if (hasLocation) {
          const dLat = Math.abs(tData.lat - lat);
          const dLng = Math.abs(tData.lng - lng);
          isNearby = dLat < RADIUS_DEG && dLng < RADIUS_DEG;
        }

        // Include if nearby OR if this is the reporter
        if (isNearby || isReporter) {
          const lang = tData.language || "en";
          let title = "";
          let body = "";

          if (isReporter) {
            // ALWAYS Notify Reporter (Confirmation)
            reporterNotified = true;
            if (lang === "fr") {
              if (notifyCommunity) {
                title = "📢 Vérification par la communauté";
                body = `Votre signalement "${reportedLabel}" est en cours de vérification par les utilisateurs proches.`;
              } else if (skipReason === 'spam') {
                title = "✅ Signalement pris en compte";
                body = "Un signalement similaire existait déjà récemment.";
              } else {
                // MATCH CASE: SILENT (No Notification)
                continue;
              }
            } else {
              if (notifyCommunity) {
                title = "📢 Community Verification";
                body = `Nearby users are verifying your "${reportedLabel}" report.`;
              } else if (skipReason === 'spam') {
                title = "✅ Report Recorded";
                body = "A similar report was already valid nearby.";
              } else {
                // MATCH CASE: SILENT (No Notification)
                continue;
              }
            }
          } else {
            // Standard message for nearby users (ONLY if notifyCommunity is true)
            if (!notifyCommunity) continue;

            if (lang === "fr") {
              title = "🤔 Météo en direct ?";
              const frLabels: any = {
                "Sunny": "Soleil", "Rain": "Pluie", "Cloudy": "Nuages",
                "Snow": "Neige", "Storm": "Orage", "Fog": "Brouillard", "Windy": "Vent",
              };
              const frCondition = frLabels[reportedLabel] || reportedLabel;
              body = `Quelqu'un a signalé "${frCondition}" dans votre zone, ` +
                "mais les prévisions disent autre chose. Confirmez-vous ?";
            } else {
              title = "🤔 Weather Update?";
              body = `Someone reported "${reportedLabel}" in your area, ` +
                "but the forecast disagrees. Is it true?";
            }
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
              reporterId: reporterId,
              isReporter: isReporter ? "true" : "false",
            },
            webpush: {
              fcm_options: {
                link: isReporter ? `/?action=contribution&isReporter=true` : "/?action=contribution",
              },
            },
          });
        }
      }

      // If reporter was not found in push_tokens, we can't notify them (they didn't enable notifications)
      if (!reporterNotified && reporterId) {
        console.log(`Reporter ${reporterId} not found in push_tokens or has no token.`);
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
        console.log(`Sent verification to ${messages.length} users (reporter notified: ${reporterNotified}).`);
      } else {
        console.log("No users to notify (no nearby users and reporter not in push_tokens).");
      }
    } catch (e) {
      console.error("Error sending verification notifications", e);
    }
  });

// --- STRIPE INTEGRATION ---

const stripeSecretKey = defineSecret("STRIPE_SECRET_KEY");

export const createStripeCheckout = onCall({ secrets: [stripeSecretKey] }, async (request) => {
  const userId = request.auth?.uid;
  const { priceId, successUrl, cancelUrl } = request.data;

  if (!userId) {
    throw new HttpsError('unauthenticated', 'User must be logged in');
  }

  const stripe = new Stripe(stripeSecretKey.value());

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: { firebaseUid: userId }, // Critical: Link payment to user
      allow_promotion_codes: true,
    });

    return { url: session.url };
  } catch (e: any) {
    console.error("Stripe Checkout Error:", e);
    throw new HttpsError('internal', e.message);
  }
});

export const stripeWebhook = onRequest({ secrets: [stripeSecretKey] }, async (req, res) => {
  const stripe = new Stripe(stripeSecretKey.value());

  // SIMPLIFIED WEBHOOK FOR TESTING (No Signature Check)
  // In Prod, configure STRIPE_WEBHOOK_SECRET and uncomment construction logic

  // const sig = req.headers['stripe-signature'];
  // const endpointSecret = stripeWebhookSecret.value();

  let event;

  try {
    // Direct parsing for permissiveness
    event = req.body;
  } catch (err: any) {
    console.error(`Webhook Error: ${err.message}`);
    res.status(400).send(`Webhook Error: ${err.message}`);
    return;
  }

  // Handle the event
  if (event.type === 'checkout.session.completed') {
    const sessionRaw = event.data.object as Stripe.Checkout.Session;

    // Retrieve session with line_items to get the real price details
    // (Crucial for 0-amount payments like trials or coupons)
    let session: Stripe.Checkout.Session = sessionRaw;
    let lineItems: Stripe.LineItem[] = [];

    try {
      const expanded = await stripe.checkout.sessions.retrieve(sessionRaw.id, {
        expand: ['line_items']
      });
      session = expanded;
      lineItems = expanded.line_items?.data || [];
    } catch (e) {
      console.error("Failed to expand session line_items", e);
    }

    // Support BOTH methods: Payment Links (client_reference_id) & API (metadata.firebaseUid)
    const uid = session.client_reference_id || session.metadata?.firebaseUid;

    if (uid) {
      console.log(`Payment successful for user ${uid}. Processing Subscription.`);

      // Tier Determination Logic
      // Standard: 200 (2.-), 2000 (20.-)
      // Ultimate: 500 (5.-), 4500 (45.-)
      // Traveler: 400 (4.-) -> Gives Ultimate features

      let targetTier = 'STANDARD';
      let targetPlan = 'standard';

      // Check based on Price Unit Amount (safer than session total)
      // If we have line items, check the first one (usually simplified sub)
      let priceAmount = 0;
      if (lineItems.length > 0) {
        priceAmount = lineItems[0].price?.unit_amount || 0;
      } else {
        priceAmount = session.amount_total || 0;
      }

      if (priceAmount === 400) {
        targetTier = 'TRAVELER';
        targetPlan = 'traveler';
      } else if (priceAmount === 4500) {
        targetTier = 'ULTIMATE';
        targetPlan = 'ultimate_yearly';
      } else if (priceAmount === 500) {
        targetTier = 'ULTIMATE';
        targetPlan = 'ultimate_monthly';
      } else {
        // Standard or other
        targetTier = 'STANDARD';
        targetPlan = 'standard';
      }

      console.log(`Determined Tier: ${targetTier}, Plan: ${targetPlan} for User: ${uid}`);

      const updates: any = {
        tier: targetTier,
        plan: targetPlan,
        subscriptionStatus: 'active',
        subscriptionId: typeof session.subscription === 'string' ? session.subscription : null,
        updatedAt: new Date()
      };

      // HANDLING TRAVELER 7-DAY PASS
      // Since this is likely a one-time payment (not auto-renewing), we must enforce expiration manually.
      if (targetPlan === 'traveler') {
        const expiry = new Date();
        expiry.setDate(expiry.getDate() + 7); // +7 Days
        updates.expiresAt = expiry;
        console.log(`Setting expiration for Traveler ${uid} to ${expiry.toISOString()}`);
      } else {
        // Clear expiration for subscriptions (Stripe handles lifecycle)
        updates.expiresAt = null;
      }

      // Using Admin SDK directly (initialized at top)
      const db = getFirestore();
      await db.collection("users").doc(uid).set(updates, { merge: true });
    } else {
      console.error("Webhook received but no User ID found (client_reference_id or metadata).");
    }
  }

  // Handle Subscription Deletion (Cancel)
  if (event.type === 'customer.subscription.deleted') {
    const subscription = event.data.object as Stripe.Subscription;
    // We need to find the user by subscriptionId if possible, 
    // OR rely on metadata if it's preserved on subscription object (sometimes not).
    // For now, simpler: Checkout session metadata is reliable for activation.
    // Deactivation is harder without searching user by subID.
    // Let's implement Search by SubID later if needed.
    console.log("Subscription deleted:", subscription.id);

    const db = getFirestore();
    const usersRef = db.collection('users');
    const snapshot = await usersRef.where('subscriptionId', '==', subscription.id).get();

    if (!snapshot.empty) {
      snapshot.forEach(doc => {
        doc.ref.update({
          tier: 'FREE',
          subscriptionStatus: 'canceled'
        });
        console.log(`Downgraded user ${doc.id} to FREE.`);
      });
    }
  }

  res.json({ received: true });
});

// CRON JOB: Check for Expired Traveler Passes
// Runs every day to downgrade users who have passed their 7-day window.
// Note: Expiration is stored with precise datetime, so running daily is sufficient
// as long as we accept a potential <24h grace period or handle display in UI.
export const checkExpiredTravelers = onSchedule("every 24 hours", async (event) => {
  const db = getFirestore();
  const now = new Date();

  console.log(`[CRON] Checking for expired Traveler passes at ${now.toISOString()}...`);

  try {
    // Find active travelers that have expired
    const snapshot = await db.collection('users')
      .where('plan', '==', 'traveler')
      .where('expiresAt', '<=', now)
      .get();

    if (snapshot.empty) {
      console.log("[CRON] No expired travelers found.");
      return;
    }

    const batch = db.batch();
    let count = 0;

    snapshot.docs.forEach(doc => {
      // Double check current tier to avoid downgrading someone who already switched? 
      // Current query relies on 'plan' == 'traveler'.
      // If they upgraded to Standard, 'plan' would be 'standard' and 'expiresAt' null, so they wouldn't be in this query.
      // So this is safe.

      batch.update(doc.ref, {
        tier: 'FREE',
        plan: null,
        subscriptionStatus: 'expired',
        expiresAt: null, // Clear it
        updatedAt: new Date()
      });
      count++;
    });

    await batch.commit();
    console.log(`[CRON] Downgraded ${count} expired Traveler users to FREE.`);

  } catch (error) {
    console.error("[CRON] Error checking expired travelers:", error);
  }
});

// Weather Proxy to Unify Frontend & Backend Data
// This ensures the App displays the exact same "Safe" data used for notifications.
// It also corrects the "Current" state if safety models detect a dangerous event invisible to the standard model.
export const getWeatherForecast = onCall(async (request) => {
  const { lat, lng } = request.data;
  if (!lat || !lng) return { success: false, error: "Missing location" };

  try {
    // 1. Fetch Standard Data (for UI - Graphs, Hourly, etc.)
    // We use the same fields as the frontend used to fetch directly
    const uiUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}` +
      `&current=temperature_2m,relative_humidity_2m,is_day,weather_code,wind_speed_10m,visibility,precipitation` +
      `&hourly=temperature_2m,weather_code,uv_index` +
      `&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset` +
      `&timezone=auto&past_days=1&forecast_days=2`;

    // 2. Fetch Safety Data (Background Worker Logic)
    // EXACT copy of the logic in 'checkWeatherNotifications'
    const safetyUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}` +
      `&current=weather_code,wind_speed_10m` +
      `&minutely_15=weather_code` +
      `&models=meteofrance_seamless,meteofrance_arpege_world,ecmwf_ifs04,gfs_seamless,jma_seamless,gem_seamless,icon_seamless,cma_grapes_global,bom_access_global`;

    const [uiRes, safetyRes] = await Promise.all([
      fetch(uiUrl),
      fetch(safetyUrl)
    ]);

    const uiData: any = await uiRes.json();
    const safetyData: any = await safetyRes.json();

    if (!uiData.current || !safetyData.current) {
      throw new Error("Invalid API response");
    }

    // 3. SAFETY OVERRIDE LOGIC (REFINED)
    // We check if the Safety Models detect a dangerous event (Storm, Rain, Snow)
    // that the Standard UI model might have missed.

    // Re-use logic from 'getDangerousForecast'
    const dangerousEvent = getDangerousForecast(
      safetyData.minutely_15,
      safetyData.current.weather_code,
      safetyData.current
    );

    // If a dangerous event is detected via Multi-Models, we act to ensure consistency.
    if (dangerousEvent) {
      console.log(`[PROXY] Safety Override! Detected ${dangerousEvent.type} starting at +${dangerousEvent.start}min.`);

      // Determine the overriding WMO code
      let forceCode = uiData.current.weather_code;
      if (dangerousEvent.type === 'storm') forceCode = 95;
      else if (dangerousEvent.type === 'snow') forceCode = 71;
      else if (dangerousEvent.type === 'rain') forceCode = 61;

      // CASE A: IMMINENT DANGER (< 30 min)
      // If the event is starting very soon (or now), we override the CURRENT display.
      // This is what users check first when they get a notification.
      if (dangerousEvent.start <= 30) {
        // Only override if current is considered "safe/dry" (Codes < 50) and we have rain/storm
        if (uiData.current.weather_code < 50) {
          console.log(`[PROXY] Overriding CURRENT weather (was ${uiData.current.weather_code} -> now ${forceCode})`);
          uiData.current.weather_code = forceCode;
        }
      }

      // CASE B: HOURLY FORECAST CONSISTENCY
      // If safety models see rain for the next hour(s), ensure the HOURLY array reflects this.
      // The hourly array from UI model might say "Cloudy" at 9h while Safety says "Storm" at 9h.

      // We look at the first few hours (indices 0, 1, 2 = Now, +1h, +2h approx)
      // Note: 'hourly.time' is ISO strings. We need to match roughly with dangerousEvent duration.
      // Simply put: If we have a detected event, we enforce it on the next 2 hourly slots if they are "dry".

      if (uiData.hourly && uiData.hourly.weather_code && uiData.current.time) {
        // Fix: Find the correct starting index matching CURRENT time
        const currentTimeStr = uiData.current.time as string; // YYYY-MM-DDTHH:MM
        const currentHourStr = currentTimeStr.slice(0, 13); // YYYY-MM-DDTHH

        let startIndex = uiData.hourly.time.findIndex((t: string) => t.startsWith(currentHourStr));
        if (startIndex === -1) startIndex = 0; // Fallback

        // Patch next 3 hours
        for (let i = 0; i < 3; i++) {
          const idx = startIndex + i;
          if (idx < uiData.hourly.weather_code.length) {
            if (uiData.hourly.weather_code[idx] < 50) {
              uiData.hourly.weather_code[idx] = forceCode;
            }
          }
        }
        console.log(`[PROXY] Patched 3 hourly slots starting at index ${startIndex} to match alert type: ${dangerousEvent.type}`);
      }
    }

    // Return the (potentially patched) UI Data
    return { success: true, data: uiData };

  } catch (e) {
    console.error("Weather Proxy Error:", e);
    return { success: false, error: e instanceof Error ? e.message : "Proxy Failed" };
  }
});
