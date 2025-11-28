import { NextResponse } from 'next/server';
import { quoteFlow } from '@/ai/flows/quote-flow';
import { runFlow } from '@genkit-ai/flow';

// Mock function to send push notifications
async function sendPushNotification(message: string) {
    console.log(`[PUSH NOTIFICATION] ${message}`);
    // In real app, use Firebase Cloud Messaging or similar
}

export async function GET(request: Request) {
    // Check authorization (e.g., cron secret)
    const authHeader = request.headers.get('Authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        // return new NextResponse('Unauthorized', { status: 401 });
        // For dev/demo, allow without auth or log warning
        console.warn('Unauthorized cron attempt');
    }

    const now = new Date();
    const hour = now.getUTCHours(); // UTC time

    let theme = "Nature and Wisdom";
    if (hour >= 6 && hour < 10) { // Morning (approx 7am UTC?)
        theme = "Wisdom & Presence";
    } else if (hour >= 10 && hour < 15) { // Mid-day (approx 11am UTC?)
        theme = "Creation, Courage & Transformation";
    } else { // Afternoon/Evening (approx 16pm UTC?)
        theme = "Reflection & Peace";
    }

    try {
        // Run Genkit flow
        const quote = await runFlow(quoteFlow, { theme, language: 'en' }); // Default to EN for now, or fetch user prefs

        // Send notification
        const message = `${quote} - Share the weather you see now!`;
        await sendPushNotification(message);

        return NextResponse.json({ success: true, message });
    } catch (error) {
        console.error('Error in notify route:', error);
        return NextResponse.json({ success: false, error: 'Failed to generate quote' }, { status: 500 });
    }
}
