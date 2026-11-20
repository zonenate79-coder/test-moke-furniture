// Firebase SDK v10 (Compat / Web CDN) Integration for Moke Furniture
// Provides real-time cross-device sync between PC, Phone, and all customers.

const firebaseConfig = {
  apiKey: "AIzaSyAOi8r4U0tKN3br89-MeZQO9ZInIV5QRPM",
  authDomain: "moke-furniture.firebaseapp.com",
  projectId: "moke-furniture",
  storageBucket: "moke-furniture.firebasestorage.app",
  messagingSenderId: "451741778257",
  appId: "1:451741778257:web:6edad46fb80547fe20d370",
  measurementId: "G-3QMNME3VBX"
};

// Initialize Firebase
if (typeof firebase !== 'undefined' && !firebase.apps.length) {
  try {
    firebase.initializeApp(firebaseConfig);
    console.log('🔥 Firebase initialized successfully.');
  } catch (err) {
    console.error('Firebase init error:', err);
  }
}

const firestoreDb = (typeof firebase !== 'undefined' && firebase.firestore) ? firebase.firestore() : null;

window.MokeCloud = {
  COLLECTIONS: {
    PRODUCTS: 'products',
    ORDERS: 'orders'
  },

  // Listen to live catalog updates across all devices
  onProductsSync(callback) {
    if (!firestoreDb) {
      console.warn('Firestore DB not ready for sync.');
      return;
    }
    return firestoreDb.collection(this.COLLECTIONS.PRODUCTS).onSnapshot(
      (snapshot) => {
        if (snapshot.empty) {
          console.log('Firebase collection empty, seeding initial 30 pieces...');
          this.seedInitialProducts();
          return;
        }
        const cloudProducts = [];
        snapshot.forEach(doc => {
          cloudProducts.push({ id: doc.id, ...doc.data() });
        });
        localStorage.setItem('moke_custom_products', JSON.stringify(cloudProducts));
        console.log(`⚡ Received ${cloudProducts.length} live products from Firebase Cloud.`);
        if (typeof callback === 'function') {
          callback(cloudProducts);
        }
      },
      (error) => {
        console.error('Firestore live sync error:', error);
      }
    );
  },

  // Save or update a product in the cloud
  async saveProduct(product) {
    if (!firestoreDb) {
      console.error('Firestore DB not available to save product.');
      return false;
    }
    try {
      const docId = product.id;
      const cleanData = { ...product };
      delete cleanData.id;
      await firestoreDb.collection(this.COLLECTIONS.PRODUCTS).doc(docId).set(cleanData, { merge: true });
      console.log('✅ Successfully saved piece to Cloud Firestore:', docId);
      return true;
    } catch (e) {
      console.error('❌ Error saving product to Firebase:', e);
      alert('Firebase Cloud save error: ' + (e.message || e));
      return false;
    }
  },

  // Delete a product from the cloud
  async deleteProduct(productId) {
    if (!firestoreDb) return false;
    try {
      await firestoreDb.collection(this.COLLECTIONS.PRODUCTS).doc(productId).delete();
      console.log('✅ Deleted piece from Cloud Firestore:', productId);
      return true;
    } catch (e) {
      console.error('❌ Error deleting product from Firebase:', e);
      return false;
    }
  },

  // Seed default 30 pieces into Firebase if brand new
  async seedInitialProducts() {
    if (!firestoreDb || typeof productsData === 'undefined') return;
    try {
      const batch = firestoreDb.batch();
      productsData.forEach(p => {
        const ref = firestoreDb.collection(this.COLLECTIONS.PRODUCTS).doc(p.id);
        const data = { ...p };
        delete data.id;
        batch.set(ref, data);
      });
      await batch.commit();
      console.log('✅ Firebase Cloud Database seeded with 30 Moke Furniture pieces.');
    } catch (e) {
      console.warn('Seed note:', e);
    }
  },

  // Save order directly into Cloud
  async createCloudOrder(orderData) {
    if (!firestoreDb) return null;
    try {
      const docRef = await firestoreDb.collection(this.COLLECTIONS.ORDERS).add({
        ...orderData,
        createdAt: new Date().toISOString()
      });
      return docRef.id;
    } catch (e) {
      console.error('Error saving order to cloud:', e);
      return null;
    }
  }
};

// Ensure global accessibility across all contexts
var MokeCloud = window.MokeCloud;
