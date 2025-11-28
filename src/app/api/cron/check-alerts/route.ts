import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';
import { fetchWeather } from '@/lib/api';

// Mock function to send push notifications
async function sendPushNotification(userId: string, message: string) {
    console.log(`[PUSH NOTIFICATION to ${userId}] ${message}`);
}

export async function GET(request: Request) {
    // Check authorization
    const authHeader = request.headers.get('Authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        console.warn('Unauthorized cron attempt');
    }

    try {
        // 1. Get all users (simplified: iterating all users might be slow, better to have a collection of active alerts)
        // For this demo, let's assume we can query a top-level 'alerts' collection or iterate known users.
        // Since we stored in `users/{userId}/alerts`, we need to query that.
        // Firestore collection group query is better here: `db.collectionGroup('alerts')`

        // Note: collectionGroup requires index. For now, let's mock iterating a few known users or just one.
        const userId = 'temp-user-id';
        const alertsSnapshot = await getDocs(collection(db, `users/${userId}/alerts`));

        const notifications = [];

        for (const doc of alertsSnapshot.docs) {
            const alert = doc.data();
            const { latitude, longitude } = alert.location;

            // 2. Check weather forecast
            const weather = await fetchWeather(latitude, longitude);

            // Check next 24 hours for Rain (code 51-67, 80-82)
            const rainCodes = [51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82];
            const willRain = weather.hourly.weatherCode.slice(0, 24).some(code => rainCodes.includes(code));

            if (willRain) {
                const message = `Rain is expected in ${alert.city} within 24 hours.`;
                await sendPushNotification(userId, message);
                notifications.push(message);
            }

            // 3. Check for Government Alerts (Severe Weather)
            // Using weather codes as proxy for severe weather if specific alert API is not available
            // Codes: 95, 96, 99 (Thunderstorm with hail)
            const severeCodes = [95, 96, 99];
            const isSevere = weather.hourly.weatherCode.slice(0, 24).some(code => severeCodes.includes(code));

            if (isSevere) {
                const message = `SEVERE WEATHER WARNING: Thunderstorms expected in ${alert.city}.`;
                await sendPushNotification(userId, message);
                notifications.push(message);
            }
        }

        return NextResponse.json({ success: true, notifications });
    } catch (error) {
        console.error('Error checking alerts:', error);
        return NextResponse.json({ success: false, error: 'Failed to check alerts' }, { status: 500 });
    }
}
