import {onCall} from "firebase-functions/v2/https";
import {defineSecret} from "firebase-functions/params";
import {GoogleGenerativeAI, SchemaType} from "@google/generative-ai";

const geminiApiKey = defineSecret("VITE_API_KEY");

export const generateQuote = onCall({secrets: [geminiApiKey]}, async () => {
  const now = new Date();
  const currentHour = now.getHours();
  const todayStr = now.toDateString();

  let theme = "";
  let slotKey = "";

  // Logic: 3 times per day (7am, 11am, 16pm)
  if (currentHour >= 7 && currentHour < 11) {
    slotKey = `${todayStr}-slot-7am`;
    theme = "Wisdom & Presence (introspection, silence, trust, " +
      "attention, peace). " +
      "Authors: Lao Tzu, Buddha, Epictetus, Seneca, Marcus Aurelius, " +
      "Eckhart Tolle, Jiddu Krishnamurti, Thich Nhat Hanh, Alan Watts, Rumi, " +
      "Khalil Gibran, Sri Nisargadatta Maharaj, Ramana Maharshi.";
  } else if (currentHour >= 11 && currentHour < 16) {
    slotKey = `${todayStr}-slot-11am`;
    theme = "Creation, Courage & Transformation (action, dreaming, evolving, " +
      "rising up). Authors: Nietzsche, Emerson, Thoreau, Walt Whitman, " +
      "Carl Jung, Joseph Campbell, Anaïs Nin, Virginia Woolf, Albert Camus, " +
      "Jean-Paul Sartre, Saint-Exupéry, Maya Angelou.";
  } else if (currentHour >= 16) {
    slotKey = `${todayStr}-slot-16pm`;
    theme = "Mysticism, Love & Transcendence (spirit, unity, light, " +
      "mystery). " +
      "Authors: Meister Eckhart, Teresa of Avila, Rumi, Hildegard of Bingen, " +
      "Ibn Arabi, Simone Weil, Teilhard de Chardin, Sri Aurobindo, Osho, " +
      "Thomas Merton.";
  } else {
    // Before 7am: Use previous day's 16pm slot
    theme = "Mysticism, Love & Transcendence (spirit, unity, light, " +
      "mystery). " +
      "Authors: Meister Eckhart, Teresa of Avila, Rumi, Hildegard of Bingen, " +
      "Ibn Arabi, Simone Weil, Teilhard de Chardin, Sri Aurobindo, Osho, " +
      "Thomas Merton.";
  }

  const schema = {
    type: SchemaType.OBJECT,
    properties: {
      en: {
        type: SchemaType.OBJECT,
        properties: {
          text: {type: SchemaType.STRING},
          author: {type: SchemaType.STRING},
        },
        required: ["text", "author"],
      },
      fr: {
        type: SchemaType.OBJECT,
        properties: {
          text: {type: SchemaType.STRING},
          author: {type: SchemaType.STRING},
        },
        required: ["text", "author"],
      },
    },
    required: ["en", "fr"],
  } as any;

  const prompt = "Generate a SINGLE, SHORT inspiring quote (MAX 20 WORDS) " +
    `based on the theme: "${theme}".`;

  try {
    const apiKey = geminiApiKey.value();
    if (!apiKey) {
      throw new Error("VITE_API_KEY secret is not set.");
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-pro",
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: schema,
      },
    });

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    if (!responseText) throw new Error("No response from AI");

    const data = JSON.parse(responseText);

    // Return the data directly
    return {
      success: true,
      data: data,
      slotKey: slotKey,
    };
  } catch (error) {
    console.error("Error generating quote:", error);
    // Return fallback with error flag for client awareness if needed
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      data: {
        en: {
          text: "The future belongs to those who believe in the beauty" +
            " of their dreams.",
          author: "Eleanor Roosevelt",
        },
        fr: {
          text: "L'avenir appartient à ceux qui croient à la beauté " +
            "de leurs rêves.",
          author: "Eleanor Roosevelt",
        },
      },
    };
  }
});
