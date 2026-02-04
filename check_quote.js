
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

initializeApp({
    projectId: 'wise-weather-app'
});

const db = getFirestore();
const slot = '2026-02-04-all-day-v21';

async function check() {
    const doc = await db.collection('quotes').doc(slot).get();
    if (doc.exists) {
        console.log('SUCCESS: Quote found for today!', doc.data());
    } else {
        console.log('FAILURE: Quote not found for slot ' + slot);
    }
    process.exit(0);
}

check();
