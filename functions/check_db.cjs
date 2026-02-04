const admin = require('firebase-admin');

// Service account NOT needed if running in environment where gcloud is configured or if using SDK locally
// BUT for simpler script I'll just use the project id and hope it's authorized (the user has it)

try {
    admin.initializeApp({
        projectId: 'wise-weather-app'
    });
    const db = admin.firestore();

    async function check() {
        const slot = '2026-02-04-all-day-v21';
        console.log('Checking Firestore slot:', slot);
        const doc = await db.collection('daily_quotes').doc(slot).get();

        if (!doc.exists) {
            console.log('SLOT_NOT_FOUND');
        } else {
            console.log('SLOT_DATA:', JSON.stringify(doc.data(), null, 2));
        }
    }

    check().then(() => process.exit(0)).catch(err => {
        console.error('Check Error:', err);
        process.exit(1);
    });
} catch (e) {
    console.error('Init Error:', e);
    process.exit(1);
}
