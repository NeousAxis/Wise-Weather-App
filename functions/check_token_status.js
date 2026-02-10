const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

const db = admin.firestore();

async function checkHeadToken() {
    console.log("Checking latest Token...");
    try {
        const snapshot = await db.collection("push_tokens")
            .orderBy("updatedAt", "desc")
            .limit(5)
            .get();

        if (snapshot.empty) {
            console.log("No tokens found.");
            return;
        }

        snapshot.docs.forEach(doc => {
            const d = doc.data();
            let date = "Unknown";
            if (d.updatedAt && d.updatedAt.toDate) date = d.updatedAt.toDate().toISOString();
            else if (d.updatedAt) date = new Date(d.updatedAt).toISOString();

            console.log(`TokenID: ${doc.id.substring(0, 5)}... | User: ${d.userId || 'Anon'} | Updated: ${date} | Lang: ${d.language}`);
        });

    } catch (error) {
        console.error("Error:", error);
    }
}

checkHeadToken();
