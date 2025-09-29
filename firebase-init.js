// Firebase initialization (compat). Requires window.firebaseConfig defined in firebase-config.js

(function() {
	try {
		if (!window.firebase || !window.firebase.initializeApp) {
			console.warn('Firebase SDK not loaded. Online mode disabled.');
			return;
		}
		if (window.firebase.apps && window.firebase.apps.length > 0) {
			// already initialized
		} else if (window.firebaseConfig) {
			window.firebase.initializeApp(window.firebaseConfig);
		} else {
			console.warn('firebase-config.js not found. Define window.firebaseConfig to enable online mode.');
			return;
		}
		try {
			if (window.firebase.firestore) {
				const db = window.firebase.firestore();
				if (db.enablePersistence) {
					db.enablePersistence().catch(function(err){ console.warn('Persistence failed', err); });
				}
			}
		} catch (e) { console.warn('Firestore init warning', e); }
	} catch (e) {
		console.error('Firebase init error', e);
	}
})();


