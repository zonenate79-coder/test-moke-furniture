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
const firebaseAuth = (typeof firebase !== 'undefined' && firebase.auth) ? firebase.auth() : null;
const firebaseStorage = (typeof firebase !== 'undefined' && firebase.storage) ? firebase.storage() : null;

window.MokeCloud = {
  COLLECTIONS: {
    PRODUCTS: 'products',
    ORDERS: 'orders'
  },

  // -------------------------------------------------------------
  // PRODUCTS CATALOG SYNC
  // -------------------------------------------------------------
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

  // -------------------------------------------------------------
  // ORDERS MANAGEMENT & LIVE VERIFICATION
  // -------------------------------------------------------------
  async createCloudOrder(orderData) {
    if (!firestoreDb) {
      // Fallback to local storage if offline
      const localId = 'ord_' + Date.now();
      const localOrders = JSON.parse(localStorage.getItem('moke_db_orders') || '[]');
      localOrders.unshift({ id: localId, ...orderData, createdAt: new Date().toISOString() });
      localStorage.setItem('moke_db_orders', JSON.stringify(localOrders));
      return localId;
    }
    try {
      const payload = {
        ...orderData,
        status: orderData.status || 'pending',
        statusNote: orderData.statusNote || 'Pending verification by Moke Studio.',
        createdAt: new Date().toISOString()
      };
      const docRef = await firestoreDb.collection(this.COLLECTIONS.ORDERS).add(payload);
      console.log('✅ Order placed in Firestore:', docRef.id);
      return docRef.id;
    } catch (e) {
      console.error('Error saving order to cloud:', e);
      return null;
    }
  },

  // Listen to ALL orders (for Builder / Admin panel)
  onOrdersSync(callback) {
    if (!firestoreDb) return;
    return firestoreDb.collection(this.COLLECTIONS.ORDERS)
      .orderBy('createdAt', 'desc')
      .onSnapshot(
        (snapshot) => {
          const orders = [];
          snapshot.forEach(doc => {
            orders.push({ id: doc.id, ...doc.data() });
          });
          if (typeof callback === 'function') callback(orders);
        },
        (error) => {
          console.warn('Orders live sync subscription note:', error);
          // If indexing is needed or error, try unsorted
          firestoreDb.collection(this.COLLECTIONS.ORDERS).onSnapshot(s => {
            const list = [];
            s.forEach(d => list.push({ id: d.id, ...d.data() }));
            list.sort((a,b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
            if (typeof callback === 'function') callback(list);
          });
        }
      );
  },

  // Update order status (Approve / Reject / Pending)
  async updateOrderStatus(orderId, status, note = '') {
    if (!firestoreDb) return false;
    try {
      await firestoreDb.collection(this.COLLECTIONS.ORDERS).doc(orderId).update({
        status: status, // 'pending', 'approved', 'rejected'
        statusNote: note || (status === 'approved' ? 'Order approved! We will contact you soon.' : (status === 'rejected' ? 'Payment screenshot rejected or invalid.' : 'Pending review.')),
        updatedAt: new Date().toISOString()
      });
      console.log(`✅ Order ${orderId} updated to ${status}`);
      return true;
    } catch (e) {
      console.error('Error updating order status:', e);
      return false;
    }
  },

  // Delete an order
  async deleteOrder(orderId) {
    if (!firestoreDb) return false;
    try {
      await firestoreDb.collection(this.COLLECTIONS.ORDERS).doc(orderId).delete();
      return true;
    } catch (e) {
      console.error('Error deleting order:', e);
      return false;
    }
  },

  // -------------------------------------------------------------
  // CUSTOMER AUTHENTICATION (Firebase Auth)
  // -------------------------------------------------------------
  async signUp(email, password, displayName = '') {
    if (!firebaseAuth) throw new Error('Firebase Auth is not available.');
    const userCredential = await firebaseAuth.createUserWithEmailAndPassword(email, password);
    if (displayName && userCredential.user) {
      await userCredential.user.updateProfile({ displayName: displayName });
    }
    return userCredential.user;
  },

  async signIn(email, password) {
    if (!firebaseAuth) throw new Error('Firebase Auth is not available.');
    const userCredential = await firebaseAuth.signInWithEmailAndPassword(email, password);
    return userCredential.user;
  },

  async signInWithGoogle() {
    if (!firebaseAuth) throw new Error('Firebase Auth is not available.');
    const provider = new firebase.auth.GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });

    // Check if user is on mobile phone / tablet
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || (window.innerWidth <= 768);

    if (isMobile) {
      // Direct single-tab redirect for phone (prevents about:blank and extra tabs)
      await firebaseAuth.signInWithRedirect(provider);
      return null;
    }

    try {
      const result = await firebaseAuth.signInWithPopup(provider);
      return result.user;
    } catch (err) {
      if (err.code === 'auth/configuration-not-found') {
        throw new Error('Google Sign-In is not enabled yet in your Firebase project. Please enable Google in Firebase Console -> Authentication -> Sign-in method.');
      }
      if (err.code === 'auth/unauthorized-domain') {
        throw new Error('This domain is not authorized in Firebase. Please add zonenate79-coder.github.io in Firebase Console -> Authentication -> Settings -> Authorized domains.');
      }
      if (err.code === 'auth/popup-blocked') {
        // Fallback to single-tab redirect if browser blocked popup
        await firebaseAuth.signInWithRedirect(provider);
        return null;
      }
      throw err;
    }
  },

  initRedirectHandler() {
    if (firebaseAuth && typeof firebaseAuth.getRedirectResult === 'function') {
      firebaseAuth.getRedirectResult().then(result => {
        if (result && result.user) {
          console.log('✅ Logged in via Google redirect:', result.user.email);
        }
      }).catch(err => {
        if (err && err.code && err.code !== 'auth/popup-closed-by-user') {
          console.error('Redirect sign-in error:', err);
        }
      });
    }
  },

  async sendPasswordReset(email) {
    if (!firebaseAuth) throw new Error('Firebase Auth is not available.');
    await firebaseAuth.sendPasswordResetEmail(email);
    return true;
  },

  async signOut() {
    if (!firebaseAuth) return;
    await firebaseAuth.signOut();
  },

  onAuthChange(callback) {
    if (!firebaseAuth) return;
    return firebaseAuth.onAuthStateChanged(user => {
      if (typeof callback === 'function') callback(user);
    });
  },

  getCurrentUser() {
    return firebaseAuth ? firebaseAuth.currentUser : null;
  },

  // -------------------------------------------------------------
  // CLOUD STORAGE (3D .glb & Image Uploads)
  // -------------------------------------------------------------
  async upload3DModel(file, onProgress) {
    if (!file) throw new Error('No file provided');
    
    // First try Firebase Storage if available
    if (firebaseStorage) {
      try {
        const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        const storagePath = `models/${Date.now()}_${sanitizedName}`;
        const storageRef = firebaseStorage.ref().child(storagePath);
        
        const uploadTask = storageRef.put(file, { contentType: 'model/gltf-binary' });
        
        return await new Promise((resolve, reject) => {
          uploadTask.on(
            'state_changed',
            (snapshot) => {
              if (typeof onProgress === 'function' && snapshot.totalBytes > 0) {
                const percent = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
                onProgress(percent);
              }
            },
            (error) => {
              console.warn('Firebase Storage upload warning:', error);
              reject(error);
            },
            async () => {
              try {
                const downloadURL = await uploadTask.snapshot.ref.getDownloadURL();
                resolve(downloadURL);
              } catch (err) {
                reject(err);
              }
            }
          );
        });
      } catch (err) {
        console.warn('Firebase Storage upload failed, attempting fallback...', err);
      }
    }
    
    // Fallback: Read as base64 data URL for smaller files or throw descriptive error
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = (e) => reject(new Error('Failed to read file locally'));
      reader.readAsDataURL(file);
    });
  },

  // Upload payment screenshot to ImgBB cloud so it's a real web link
  async uploadScreenshot(fileOrDataUrl) {
    try {
      let base64Data = fileOrDataUrl;
      if (typeof fileOrDataUrl === 'string' && fileOrDataUrl.includes('base64,')) {
        base64Data = fileOrDataUrl.split('base64,')[1];
      }
      
      const formData = new FormData();
      formData.append('image', base64Data);

      const res = await fetch('https://api.imgbb.com/1/upload?key=2d0c2e30fa4fa03a83f1248455fa980f', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (data && data.success && data.data && data.data.url) {
        return data.data.url;
      }
      return typeof fileOrDataUrl === 'string' ? fileOrDataUrl : null;
    } catch (err) {
      console.warn('Screenshot upload note, using inline representation:', err);
      return typeof fileOrDataUrl === 'string' ? fileOrDataUrl : null;
    }
  }
};

// Ensure global accessibility across all contexts
var MokeCloud = window.MokeCloud;
if (window.MokeCloud && typeof window.MokeCloud.initRedirectHandler === 'function') {
  window.MokeCloud.initRedirectHandler();
}