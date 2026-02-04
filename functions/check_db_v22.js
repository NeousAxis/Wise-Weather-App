import admin from 'firebase-admin';

admin.initializeApp({
    projectId: 'wise-weather-app'
});
const db = admin.firestore();

async function check() {
    const slot = '2026-02-04-all-day-v22';
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
