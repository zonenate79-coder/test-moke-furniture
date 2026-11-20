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
  firebase.initializeApp(firebaseConfig);
}

const firestoreDb = (typeof firebase !== 'undefined' && firebase.firestore) ? firebase.firestore() : null;

const MokeCloud = {
  COLLECTIONS: {
    PRODUCTS: 'products',
    ORDERS: 'orders'
  },

  // Listen to live catalog updates across all devices
  onProductsSync(callback) {
    if (!firestoreDb) return;
    return firestoreDb.collection(this.COLLECTIONS.PRODUCTS).onSnapshot(
      (snapshot) => {
        if (snapshot.empty) {
          // If remote cloud collection is empty on first run, seed with default productsData
          this.seedInitialProducts();
          return;
        }
        const cloudProducts = [];
        snapshot.forEach(doc => {
          cloudProducts.push({ id: doc.id, ...doc.data() });
        });
        // Cache to localStorage for fast offline fallback
        localStorage.setItem('moke_custom_products', JSON.stringify(cloudProducts));
        callback(cloudProducts);
      },
      (error) => {
        console.warn('Firestore live sync error, falling back to local storage:', error);
      }
    );
  },

  // Save or update a product in the cloud
  async saveProduct(product) {
    if (!firestoreDb) return false;
    try {
      const docId = product.id;
      const cleanData = { ...product };
      delete cleanData.id;
      await firestoreDb.collection(this.COLLECTIONS.PRODUCTS).doc(docId).set(cleanData, { merge: true });
      return true;
    } catch (e) {
      console.error('Error saving product to Firebase:', e);
      return false;
    }
  },

  // Delete a product from the cloud
  async deleteProduct(productId) {
    if (!firestoreDb) return false;
    try {
      await firestoreDb.collection(this.COLLECTIONS.PRODUCTS).doc(productId).delete();
      return true;
    } catch (e) {
      console.error('Error deleting product from Firebase:', e);
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
      console.log('Firebase Cloud Database seeded with 30 Moke Furniture pieces.');
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
