// State Management
const getCatalogProducts = () => {
  const saved = localStorage.getItem('moke_custom_products');
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      console.error('Error loading custom products:', e);
    }
  }
  return productsData;
};

let activeProducts = getCatalogProducts();

const state = {
  cart: JSON.parse(localStorage.getItem('moke_cart')) || [],
  activeQuickView: null,
  selectedColorIndex: 0,
  quickViewQty: 1,
  viewMode3D: false
};

// Independent Section State (Option B: Starts with 6 pieces directly)
const sectionState = {
  sofas: { filter: 'all', isExpanded: false, limit: 6 },
  chairs: { filter: 'all', isExpanded: false, limit: 6 },
  tables: { filter: 'all', isExpanded: false, limit: 6 }
};

// DOM Containers
const sofasGrid = document.getElementById('sofas-grid');
const chairsGrid = document.getElementById('chairs-grid');
const tablesGrid = document.getElementById('tables-grid');

const sofasSeeMore = document.getElementById('sofas-see-more');
const chairsSeeMore = document.getElementById('chairs-see-more');
const tablesSeeMore = document.getElementById('tables-see-more');

// Cart Elements
const cartBtn = document.getElementById('cart-btn');
const cartDrawer = document.getElementById('cart-drawer');
const cartBackdrop = document.getElementById('cart-backdrop');
const closeCartBtn = document.getElementById('close-cart-btn');
const cartItemsContainer = document.getElementById('cart-items-container');
const cartBadge = document.getElementById('cart-badge');
const cartSubtotalEl = document.getElementById('cart-subtotal');
const cartTotalEl = document.getElementById('cart-total');
const freeShippingProgress = document.getElementById('free-shipping-progress');
const freeShippingText = document.getElementById('free-shipping-text');
const checkoutBtn = document.getElementById('checkout-btn');

// Quick View Modal Elements
const quickViewModal = document.getElementById('quick-view-modal');
const quickViewBackdrop = document.getElementById('quick-view-backdrop');
const closeQuickViewBtn = document.getElementById('close-quick-view-btn');
const quickViewContent = document.getElementById('quick-view-content');

// Checkout Modal Elements
const checkoutModal = document.getElementById('checkout-modal');
const checkoutBackdrop = document.getElementById('checkout-backdrop');
const closeCheckoutBtn = document.getElementById('close-checkout-btn');
const checkoutForm = document.getElementById('checkout-form');
const checkoutItemCount = document.getElementById('checkout-item-count');
const checkoutTotalVal = document.getElementById('checkout-total-val');
const checkoutDeliveryText = document.getElementById('checkout-delivery-text');

// Toast Element
const toastEl = document.getElementById('toast');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  activeProducts = getCatalogProducts();
  renderAllSections();
  updateCartUI();
  setupEventListeners();
  setupIcons();

  // Initialize Customer Auth & Order Tracker
  initCustomerAuth();
  initCustomerOrdersTracker();

  // Real-time Cloud Firebase synchronization (Cross-device PC & Phone)
  if (window.MokeCloud && typeof MokeCloud.onProductsSync === 'function') {
    MokeCloud.onProductsSync((cloudProducts) => {
      if (cloudProducts && cloudProducts.length > 0) {
        activeProducts = cloudProducts;
        renderAllSections();
        console.log('⚡ Live Cloud Sync: updated products from Firebase');
      }
    });
  }
});

// Real-time synchronization when builder modifies products
window.addEventListener('storage', (e) => {
  if (e.key === 'moke_custom_products') {
    activeProducts = getCatalogProducts();
    renderAllSections();
  }
});

// Auto-sync whenever user focuses back on the store tab
window.addEventListener('focus', () => {
  activeProducts = getCatalogProducts();
  renderAllSections();
});

function setupIcons() {
  if (window.lucide) {
    lucide.createIcons();
  }
}

// Event Listeners
function setupEventListeners() {
  // Cart Drawer open/close
  if (cartBtn) cartBtn.addEventListener('click', openCart);
  if (closeCartBtn) closeCartBtn.addEventListener('click', closeCart);
  if (cartBackdrop) cartBackdrop.addEventListener('click', closeCart);

  // Quick View Modal close
  if (closeQuickViewBtn) closeQuickViewBtn.addEventListener('click', closeQuickView);
  if (quickViewBackdrop) quickViewBackdrop.addEventListener('click', closeQuickView);

  // Checkout modal open/close & submit
  if (checkoutBtn) checkoutBtn.addEventListener('click', openCheckoutModal);
  if (closeCheckoutBtn) closeCheckoutBtn.addEventListener('click', closeCheckoutModal);
  if (checkoutBackdrop) checkoutBackdrop.addEventListener('click', closeCheckoutModal);
  if (checkoutForm) checkoutForm.addEventListener('submit', handleCheckoutSubmit);
}

// Payment & Receipt State
let currentPaymentMethod = 'cbe';
let uploadedReceiptData = null;

function selectPaymentMethod(method) {
  currentPaymentMethod = method;
  const cbeBtn = document.getElementById('pay-cbe-btn');
  const telebirrBtn = document.getElementById('pay-telebirr-btn');
  const cbeBox = document.getElementById('cbe-details-box');
  const telebirrBox = document.getElementById('telebirr-details-box');

  if (method === 'cbe') {
    if (cbeBtn) {
      cbeBtn.className = 'p-3 rounded-xl border-2 text-left transition flex flex-col justify-between border-stone-900 bg-stone-900 text-white shadow-sm';
      cbeBtn.innerHTML = `
        <div class="flex items-center justify-between w-full mb-1">
          <span class="text-xs font-bold uppercase tracking-wider">🏛️ CBE Bank</span>
          <i data-lucide="check" class="w-3.5 h-3.5 text-amber-400"></i>
        </div>
        <span class="text-[10px] text-stone-300">Commercial Bank of Ethiopia</span>
      `;
    }
    if (telebirrBtn) {
      telebirrBtn.className = 'p-3 rounded-xl border-2 text-left transition flex flex-col justify-between border-stone-200 hover:border-stone-400 text-stone-800 bg-white';
      telebirrBtn.innerHTML = `
        <div class="flex items-center justify-between w-full mb-1">
          <span class="text-xs font-bold uppercase tracking-wider">📱 Telebirr</span>
          <i data-lucide="circle" class="w-3.5 h-3.5 text-stone-300"></i>
        </div>
        <span class="text-[10px] text-stone-500">Ethio Telecom Mobile Money</span>
      `;
    }
    if (cbeBox) cbeBox.classList.remove('hidden');
    if (telebirrBox) telebirrBox.classList.add('hidden');
  } else {
    if (cbeBtn) {
      cbeBtn.className = 'p-3 rounded-xl border-2 text-left transition flex flex-col justify-between border-stone-200 hover:border-stone-400 text-stone-800 bg-white';
      cbeBtn.innerHTML = `
        <div class="flex items-center justify-between w-full mb-1">
          <span class="text-xs font-bold uppercase tracking-wider">🏛️ CBE Bank</span>
          <i data-lucide="circle" class="w-3.5 h-3.5 text-stone-300"></i>
        </div>
        <span class="text-[10px] text-stone-500">Commercial Bank of Ethiopia</span>
      `;
    }
    if (telebirrBtn) {
      telebirrBtn.className = 'p-3 rounded-xl border-2 text-left transition flex flex-col justify-between border-stone-900 bg-stone-900 text-white shadow-sm';
      telebirrBtn.innerHTML = `
        <div class="flex items-center justify-between w-full mb-1">
          <span class="text-xs font-bold uppercase tracking-wider">📱 Telebirr</span>
          <i data-lucide="check" class="w-3.5 h-3.5 text-amber-400"></i>
        </div>
        <span class="text-[10px] text-stone-300">Ethio Telecom Mobile Money</span>
      `;
    }
    if (cbeBox) cbeBox.classList.add('hidden');
    if (telebirrBox) telebirrBox.classList.remove('hidden');
  }
  setupIcons();
}

function copyToClipboard(text, btnElement) {
  navigator.clipboard.writeText(text).then(() => {
    if (btnElement) {
      const originalHTML = btnElement.innerHTML;
      btnElement.innerHTML = `<i data-lucide="check" class="w-3 h-3 text-emerald-600"></i> <span class="text-emerald-700">Copied!</span>`;
      setupIcons();
      setTimeout(() => {
        btnElement.innerHTML = originalHTML;
        setupIcons();
      }, 2000);
    }
    showToast(`Copied ${text} to clipboard.`);
  }).catch(() => {
    prompt('Copy account number:', text);
  });
}

function handleReceiptUpload(e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(event) {
    uploadedReceiptData = {
      name: file.name,
      dataUrl: event.target.result
    };
    const previewImg = document.getElementById('receipt-preview-img');
    const previewContainer = document.getElementById('receipt-preview-container');
    const promptEl = document.getElementById('receipt-prompt');
    const nameEl = document.getElementById('receipt-file-name');

    if (previewImg) previewImg.src = event.target.result;
    if (nameEl) nameEl.textContent = file.name;
    if (promptEl) promptEl.classList.add('hidden');
    if (previewContainer) previewContainer.classList.remove('hidden');
    showToast('Payment screenshot attached!');
    setupIcons();
  };
  reader.readAsDataURL(file);
}

function removeReceipt(e) {
  if (e) e.stopPropagation();
  uploadedReceiptData = null;
  const fileInput = document.getElementById('receipt-file-input');
  const previewContainer = document.getElementById('receipt-preview-container');
  const promptEl = document.getElementById('receipt-prompt');

  if (fileInput) fileInput.value = '';
  if (previewContainer) previewContainer.classList.add('hidden');
  if (promptEl) promptEl.classList.remove('hidden');
  setupIcons();
}

// Modal Controls
function openCheckoutModal() {
  if (state.cart.length === 0) {
    showToast('Your shopping bag is currently empty.');
    return;
  }
  
  closeCart();
  
  const totalCount = state.cart.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = state.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  
  if (checkoutItemCount) checkoutItemCount.textContent = `${totalCount} piece${totalCount > 1 ? 's' : ''}`;
  if (checkoutTotalVal) checkoutTotalVal.textContent = `${subtotal.toLocaleString()} Birr`;
  if (checkoutDeliveryText) {
    checkoutDeliveryText.textContent = '🚚 Free Delivery on All Orders — White-Glove Assembly Included';
  }
  
  if (checkoutModal) checkoutModal.classList.remove('hidden');
  document.body.classList.add('overflow-hidden');
  setupIcons();
}

function closeCheckoutModal() {
  if (checkoutModal) checkoutModal.classList.add('hidden');
  document.body.classList.remove('overflow-hidden');
}

// Direct In-Site Order & Cloud Receipt Verification (No Telegram needed)
async function handleCheckoutSubmit(e) {
  e.preventDefault();
  
  const nameInput = document.getElementById('cust-name');
  const phoneInput = document.getElementById('cust-phone');
  const addressInput = document.getElementById('cust-address');
  const notesInput = document.getElementById('cust-notes');
  const submitBtn = document.getElementById('checkout-submit-btn');

  const name = nameInput ? nameInput.value.trim() : '';
  const phone = phoneInput ? phoneInput.value.trim() : '';
  const address = addressInput ? addressInput.value.trim() : '';
  const notes = notesInput ? notesInput.value.trim() : '';
  
  if (!name || !phone || !address) {
    alert('Please fill in your name, phone number, and delivery address.');
    return;
  }

  // Phone must be numbers only and start with 09
  if (!/^09\d{8,9}$/.test(phone)) {
    alert('⚠️ Phone number must start with 09 and contain only numbers (e.g. 0911234567).');
    if (phoneInput) { phoneInput.focus(); phoneInput.style.borderColor = '#ef4444'; }
    return;
  }
  if (phoneInput) phoneInput.style.borderColor = '';

  if (!uploadedReceiptData) {
    alert('⚠️ You must upload your payment screenshot before submitting. Please take a screenshot of your transfer and upload it.');
    const dropzone = document.getElementById('screenshot-dropzone');
    if (dropzone) {
      dropzone.style.borderColor = '#ef4444';
      dropzone.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setTimeout(() => { dropzone.style.borderColor = ''; }, 3000);
    }
    return;
  }

  const subtotal = state.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.innerHTML = `<i data-lucide="loader" class="w-4 h-4 animate-spin"></i> Submitting & Uploading Payment Proof...`;
    setupIcons();
  }

  try {
    // 1. Upload receipt to cloud (ImgBB / Firebase)
    let receiptUrl = '';
    if (window.MokeCloud && typeof MokeCloud.uploadScreenshot === 'function') {
      receiptUrl = await MokeCloud.uploadScreenshot(uploadedReceiptData.dataUrl);
    } else {
      receiptUrl = uploadedReceiptData.dataUrl;
    }

    // 2. Prepare Order Object
    const orderPayload = {
      customerName: name,
      customerPhone: phone,
      customerAddress: address,
      notes: notes,
      customerEmail: currentCustomer ? currentCustomer.email : '',
      userId: currentCustomer ? currentCustomer.uid : null,
      paymentMethod: currentPaymentMethod === 'cbe' ? 'CBE Bank' : 'Telebirr',
      paymentAccount: currentPaymentMethod === 'cbe' ? '100000838' : '28398387',
      receiptUrl: receiptUrl || '',
      receiptName: uploadedReceiptData.name || 'Transfer_Screenshot.jpg',
      items: state.cart.map(i => ({ name: i.name, color: i.color, price: i.price, quantity: i.quantity, image: i.image })),
      subtotal: subtotal,
      status: 'pending',
      statusNote: 'Payment screenshot received. Studio team is verifying.'
    };

    // 3. Save to Firebase Cloud
    let orderId = null;
    if (window.MokeCloud && typeof MokeCloud.createCloudOrder === 'function') {
      orderId = await MokeCloud.createCloudOrder(orderPayload);
    }
    if (!orderId) {
      orderId = 'ord_' + Date.now();
    }

    // 4. Save order ID to localStorage for this device
    saveCustomerOrderId(orderId);

    // Also sync to local DB if available
    if (window.MokeDB) {
      MokeDB.createOrder({ ...orderPayload, id: orderId });
    }

    // Clear cart and reset receipt
    state.cart = [];
    saveCart();
    updateCartUI();
    closeCheckoutModal();
    removeReceipt();

    showToast('🎉 Order placed successfully! Studio verifying payment...');
    
    // Automatically open Customer Orders Modal so they see their pending status!
    setTimeout(() => {
      openOrdersModal();
    }, 400);

  } catch (err) {
    console.error('Checkout error:', err);
    alert('Error submitting order: ' + (err.message || err));
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = `<i data-lucide="shield-check" class="w-4 h-4 text-emerald-400"></i> Place Order & Submit Payment Proof`;
      setupIcons();
    }
  }
}

// =========================================================================
// CUSTOMER AUTHENTICATION (Firebase Auth)
// =========================================================================
let currentCustomer = null;

function initCustomerAuth() {
  if (window.MokeCloud && typeof MokeCloud.onAuthChange === 'function') {
    MokeCloud.onAuthChange((user) => {
      currentCustomer = user;
      updateAuthUI();
      if (user) loadCustomerOrders();
    });

    // Handle return from mobile Google redirect sign-in
    if (typeof MokeCloud.handleRedirectLogin === 'function') {
      MokeCloud.handleRedirectLogin((user) => {
        if (user) {
          currentCustomer = user;
          updateAuthUI();
          loadCustomerOrders();
          showToast('Signed in with Google!');
        }
      });
    }
  } else {
    updateAuthUI();
  }
}

function updateAuthUI() {
  const container = document.getElementById('auth-header-container');
  const mobileAuthBtn = document.getElementById('mobile-auth-btn');

  if (!container) return;

  if (currentCustomer) {
    // Option 2: Clean & Minimalist — No name displayed on screen, discreet Log Out in corner
    container.innerHTML = `
      <button onclick="handleCustomerSignOut()" class="text-xs font-semibold uppercase tracking-wider text-stone-600 hover:text-stone-950 px-3 py-2 rounded-full border border-stone-200 hover:bg-stone-100 transition flex items-center gap-1.5" title="Log Out">
        <i data-lucide="log-out" class="w-3.5 h-3.5 text-stone-400"></i>
        <span>Log Out</span>
      </button>
    `;
    if (mobileAuthBtn) {
      mobileAuthBtn.innerHTML = `<i data-lucide="log-out" class="w-4 h-4 text-stone-400"></i> Log Out`;
      mobileAuthBtn.className = "text-left flex items-center gap-2 text-stone-400 hover:text-white font-medium";
      mobileAuthBtn.onclick = () => { toggleMobileMenu(); handleCustomerSignOut(); };
    }
  } else {
    container.innerHTML = `
      <button id="auth-btn" onclick="openAuthModal('login')" class="text-xs font-semibold uppercase tracking-wider text-stone-800 hover:text-stone-950 px-3 py-2 rounded-full border border-stone-200 hover:bg-stone-100 transition flex items-center gap-1.5">
        <i data-lucide="user" class="w-3.5 h-3.5"></i>
        <span>Log In</span>
      </button>
    `;
    if (mobileAuthBtn) {
      mobileAuthBtn.innerHTML = `<i data-lucide="user" class="w-4 h-4"></i> Log In / Sign Up`;
      mobileAuthBtn.className = "text-left flex items-center gap-2 text-amber-400 hover:text-amber-300 font-semibold";
      mobileAuthBtn.onclick = () => { toggleMobileMenu(); openAuthModal('login'); };
    }
  }
  setupIcons();
}

function openAuthModal(view = 'login') {
  const modal = document.getElementById('auth-modal');
  if (modal) modal.classList.remove('hidden');
  switchAuthView(view);
  document.body.classList.add('overflow-hidden');
  setupIcons();
}

function closeAuthModal() {
  const modal = document.getElementById('auth-modal');
  if (modal) modal.classList.add('hidden');
  document.body.classList.remove('overflow-hidden');
}

function switchAuthView(view) {
  const loginView = document.getElementById('auth-login-view');
  const signupView = document.getElementById('auth-signup-view');
  const forgotView = document.getElementById('auth-forgot-view');
  
  if (loginView) loginView.classList.add('hidden');
  if (signupView) signupView.classList.add('hidden');
  if (forgotView) forgotView.classList.add('hidden');

  if (view === 'login' && loginView) loginView.classList.remove('hidden');
  if (view === 'signup' && signupView) signupView.classList.remove('hidden');
  if (view === 'forgot' && forgotView) forgotView.classList.remove('hidden');
  setupIcons();
}

async function handleCustomerLogin(e) {
  e.preventDefault();
  const email = document.getElementById('login-email')?.value.trim();
  const password = document.getElementById('login-password')?.value;
  const errEl = document.getElementById('login-error-msg');
  const btn = document.getElementById('login-submit-btn');

  if (errEl) errEl.classList.add('hidden');
  if (btn) btn.disabled = true;

  try {
    if (!window.MokeCloud) throw new Error('Cloud services initializing, please retry.');
    await MokeCloud.signIn(email, password);
    closeAuthModal();
    showToast('Welcome back to Moke Furniture!');
  } catch (err) {
    if (errEl) {
      errEl.textContent = err.message || 'Login failed. Please check your credentials.';
      errEl.classList.remove('hidden');
    }
  } finally {
    if (btn) btn.disabled = false;
  }
}

async function handleCustomerSignup(e) {
  e.preventDefault();
  const name = document.getElementById('signup-name')?.value.trim();
  const email = document.getElementById('signup-email')?.value.trim();
  const password = document.getElementById('signup-password')?.value;
  const errEl = document.getElementById('signup-error-msg');
  const btn = document.getElementById('signup-submit-btn');

  if (errEl) errEl.classList.add('hidden');
  if (btn) btn.disabled = true;

  try {
    if (!window.MokeCloud) throw new Error('Cloud services initializing, please retry.');
    await MokeCloud.signUp(email, password, name);
    closeAuthModal();
    showToast(`Welcome, ${name || 'friend'}! Your account is ready.`);
  } catch (err) {
    if (errEl) {
      errEl.textContent = err.message || 'Signup failed. Please try again.';
      errEl.classList.remove('hidden');
    }
  } finally {
    if (btn) btn.disabled = false;
  }
}

async function handleCustomerGoogleLogin() {
  try {
    if (!window.MokeCloud) throw new Error('Cloud services initializing, please retry.');
    await MokeCloud.signInWithGoogle();
    closeAuthModal();
    showToast('Signed in with Google!');
  } catch (err) {
    if (err.code === 'auth/popup-closed-by-user') return; // User closed popup, no error needed
    alert(err.message || 'Google sign-in was cancelled or failed.');
  }
}

async function handleCustomerResetPassword(e) {
  e.preventDefault();
  const email = document.getElementById('forgot-email')?.value.trim();
  const msgEl = document.getElementById('forgot-msg');
  const btn = document.getElementById('forgot-submit-btn');

  if (!email) return;
  if (btn) btn.disabled = true;

  try {
    if (!window.MokeCloud) throw new Error('Cloud services initializing.');
    await MokeCloud.sendPasswordReset(email);
    if (msgEl) {
      msgEl.className = 'text-xs p-2.5 rounded-xl text-center bg-emerald-50 text-emerald-700 border border-emerald-200 block';
      msgEl.textContent = 'Password reset email sent! Check your inbox.';
    }
  } catch (err) {
    if (msgEl) {
      msgEl.className = 'text-xs p-2.5 rounded-xl text-center bg-red-50 text-red-600 border border-red-200 block';
      msgEl.textContent = err.message || 'Could not send reset email.';
    }
  } finally {
    if (btn) btn.disabled = false;
  }
}

async function handleCustomerSignOut() {
  if (window.MokeCloud) {
    await MokeCloud.signOut();
  }
  showToast('Signed out successfully.');
}

// =========================================================================
// CUSTOMER ORDER TRACKING & LIVE VERIFICATION
// =========================================================================
let myOrdersListener = null;

function getSavedOrderIds() {
  try {
    return JSON.parse(localStorage.getItem('moke_customer_order_ids') || '[]');
  } catch (e) {
    return [];
  }
}

function saveCustomerOrderId(id) {
  const ids = getSavedOrderIds();
  if (!ids.includes(id)) {
    ids.unshift(id);
    localStorage.setItem('moke_customer_order_ids', JSON.stringify(ids));
  }
}

function openOrdersModal() {
  const modal = document.getElementById('customer-orders-modal');
  if (modal) modal.classList.remove('hidden');
  document.body.classList.add('overflow-hidden');
  loadCustomerOrders();
  setupIcons();
}

function closeOrdersModal() {
  const modal = document.getElementById('customer-orders-modal');
  if (modal) modal.classList.add('hidden');
  document.body.classList.remove('overflow-hidden');
}

function initCustomerOrdersTracker() {
  loadCustomerOrders();
}

function loadCustomerOrders() {
  const container = document.getElementById('customer-orders-list');
  const badge = document.getElementById('orders-badge');
  if (!container) return;

  const savedIds = getSavedOrderIds();
  const customerEmail = currentCustomer ? currentCustomer.email : null;

  if (typeof firebase === 'undefined' || !firebase.firestore) {
    // Offline or fallback to localStorage MokeDB
    const localOrders = (window.MokeDB ? MokeDB.getOrders() : []).filter(o => {
      return savedIds.includes(o.id) || (customerEmail && o.customerEmail === customerEmail);
    });
    renderCustomerOrdersList(localOrders);
    return;
  }

  const db = firebase.firestore();
  
  if (myOrdersListener) myOrdersListener();

  myOrdersListener = db.collection('orders').onSnapshot((snapshot) => {
    const matchedOrders = [];
    let hasPending = false;

    snapshot.forEach(doc => {
      const data = { id: doc.id, ...doc.data() };
      const isMine = savedIds.includes(doc.id) || 
                     (customerEmail && data.customerEmail && data.customerEmail.toLowerCase() === customerEmail.toLowerCase()) ||
                     (currentCustomer && data.userId && data.userId === currentCustomer.uid);
      if (isMine) {
        matchedOrders.push(data);
        if (data.status === 'pending') hasPending = true;
      }
    });

    // Update notification badge
    if (badge) {
      if (hasPending) {
        badge.classList.remove('hidden');
      } else {
        badge.classList.add('hidden');
      }
    }

    matchedOrders.sort((a,b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    renderCustomerOrdersList(matchedOrders);
  }, (err) => {
    console.warn('Orders listener notice:', err);
  });
}

function renderCustomerOrdersList(orders) {
  const container = document.getElementById('customer-orders-list');
  if (!container) return;

  if (!orders || orders.length === 0) {
    container.innerHTML = `
      <div class="text-center py-12 px-4 bg-stone-50 rounded-2xl border border-stone-200">
        <i data-lucide="package-open" class="w-12 h-12 text-stone-300 mx-auto mb-3"></i>
        <h4 class="text-base font-serif text-stone-800">No Orders Placed Yet</h4>
        <p class="text-xs text-stone-500 mt-1 max-w-sm mx-auto">When you order handcrafted pieces and upload your payment proof, you can track studio approval here in real time.</p>
      </div>
    `;
    setupIcons();
    return;
  }

  container.innerHTML = orders.map(order => {
    const isApproved = order.status === 'approved';
    const isRejected = order.status === 'rejected';
    const isPending = !isApproved && !isRejected;

    let statusBadge = '';
    let statusBanner = '';

    if (isPending) {
      statusBadge = `<span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-300">
        <span class="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
        🟡 Pending Verification
      </span>`;
      statusBanner = `
        <div class="bg-amber-50/80 border border-amber-200 rounded-xl p-3 text-xs text-amber-900 flex items-start gap-2.5">
          <i data-lucide="clock" class="w-4 h-4 text-amber-700 shrink-0 mt-0.5"></i>
          <div>
            <strong class="font-semibold">Payment Screenshot Received</strong>
            <p class="text-[11px] text-amber-800 mt-0.5">Our studio manager is verifying your bank transfer. Once confirmed, your order status will automatically change here.</p>
          </div>
        </div>
      `;
    } else if (isApproved) {
      statusBadge = `<span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-300">
        <i data-lucide="check-circle" class="w-3.5 h-3.5 text-emerald-600"></i>
        ✅ Confirmed & Approved
      </span>`;
      statusBanner = `
        <div class="bg-emerald-50/90 border border-emerald-200 rounded-xl p-3 text-xs text-emerald-950 flex items-start gap-2.5">
          <i data-lucide="sparkles" class="w-4 h-4 text-emerald-600 shrink-0 mt-0.5"></i>
          <div>
            <strong class="font-semibold text-emerald-900">Order Confirmed!</strong>
            <p class="text-[11px] text-emerald-800 mt-0.5">${order.statusNote || 'We will contact you soon on your phone to arrange white-glove delivery.'}</p>
          </div>
        </div>
      `;
    } else {
      statusBadge = `<span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-800 border border-red-300">
        <i data-lucide="x-circle" class="w-3.5 h-3.5 text-red-600"></i>
        ❌ Rejected
      </span>`;
      statusBanner = `
        <div class="bg-red-50/80 border border-red-200 rounded-xl p-3 text-xs text-red-950 flex items-start gap-2.5">
          <i data-lucide="alert-triangle" class="w-4 h-4 text-red-600 shrink-0 mt-0.5"></i>
          <div>
            <strong class="font-semibold text-red-900">Payment Not Verified</strong>
            <p class="text-[11px] text-red-800 mt-0.5">${order.statusNote || 'The payment screenshot could not be confirmed with the bank account. Please check your transfer or reach out to our team.'}</p>
          </div>
        </div>
      `;
    }

    const itemsList = (order.items || []).map(i => `
      <div class="flex items-center justify-between text-xs py-1 border-b border-stone-100 last:border-0">
        <span class="text-stone-700">${i.quantity}x ${i.name} (${i.color || 'Standard'})</span>
        <span class="font-mono font-medium text-stone-900">${(i.price * i.quantity).toLocaleString()} Birr</span>
      </div>
    `).join('');

    const formattedDate = order.createdAt ? new Date(order.createdAt).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }) : 'Recent';

    return `
      <div class="p-5 bg-stone-50 rounded-2xl border border-stone-200 space-y-3.5">
        <div class="flex flex-wrap items-center justify-between gap-2 border-b border-stone-200 pb-3">
          <div>
            <span class="text-[10px] text-stone-400 uppercase tracking-widest font-semibold block">Order #${order.id.slice(0, 8)}</span>
            <span class="text-xs text-stone-500">${formattedDate}</span>
          </div>
          <div>${statusBadge}</div>
        </div>

        ${statusBanner}

        <div class="bg-white rounded-xl p-3 border border-stone-200">
          <div class="text-[10px] text-stone-400 uppercase tracking-wider font-semibold mb-2">Pieces Ordered</div>
          <div class="divide-y divide-stone-100">${itemsList}</div>
          <div class="flex justify-between items-center pt-2 mt-2 border-t border-stone-200 text-xs font-semibold text-stone-900">
            <span>Total Amount:</span>
            <span class="text-sm font-mono text-stone-900">${(order.subtotal || 0).toLocaleString()} Birr</span>
          </div>
        </div>

        <div class="flex flex-wrap items-center justify-between text-xs text-stone-600 gap-2 pt-1">
          <div>
            <span class="font-medium text-stone-800">Payment:</span> ${order.paymentMethod || 'Bank Transfer'}
          </div>
          ${order.receiptUrl ? `
            <a href="${order.receiptUrl}" target="_blank" class="inline-flex items-center gap-1 text-stone-800 hover:underline font-medium">
              <i data-lucide="image" class="w-3.5 h-3.5"></i> View Uploaded Screenshot
            </a>
          ` : ''}
        </div>
      </div>
    `;
  }).join('');

  setupIcons();
}

// Option B: Set Section Filter (e.g. sofas -> leather)
function setSectionFilter(category, filterValue) {
  if (!sectionState[category]) return;

  sectionState[category].filter = filterValue;
  sectionState[category].isExpanded = false; // reset to 3 items when filter changes

  // Update chip styles for this section
  const chips = document.querySelectorAll(`.${category}-chip`);
  chips.forEach(chip => {
    chip.classList.remove('bg-stone-900', 'text-white', 'border-stone-900');
    chip.classList.add('bg-white', 'text-stone-700', 'border-stone-200');
  });

  const activeChip = Array.from(chips).find(c => c.getAttribute('onclick')?.includes(`'${filterValue}'`));
  if (activeChip) {
    activeChip.classList.remove('bg-white', 'text-stone-700', 'border-stone-200');
    activeChip.classList.add('bg-stone-900', 'text-white', 'border-stone-900');
  }

  renderSection(category);
}

// Toggle Section Expand / Collapse
function toggleSectionExpand(category) {
  if (!sectionState[category]) return;

  sectionState[category].isExpanded = !sectionState[category].isExpanded;
  renderSection(category);

  // If collapsed, smoothly scroll back to the section title
  if (!sectionState[category].isExpanded) {
    const sectionEl = document.getElementById(category);
    if (sectionEl) {
      sectionEl.scrollIntoView({ behavior: 'smooth' });
    }
  }
}

function renderAllSections() {
  activeProducts = getCatalogProducts();
  renderSection('sofas');
  renderSection('chairs');
  renderSection('tables');
}

// Render Single Section
function renderSection(category) {
  const gridEl = document.getElementById(`${category}-grid`);
  const seeMoreEl = document.getElementById(`${category}-see-more`);
  if (!gridEl) return;

  const currentFilter = sectionState[category].filter;
  const isExpanded = sectionState[category].isExpanded;
  const limit = sectionState[category].limit;

  // Always pull from activeProducts (includes custom added/modified pieces)
  // Filter out hidden products
  const items = activeProducts.filter(p => {
    if (p.category !== category) return false;
    if (p.hidden === true) return false;
    if (currentFilter === 'all') return true;
    return p.filterTag === currentFilter;
  });

  if (items.length === 0) {
    gridEl.innerHTML = `
      <div class="col-span-full py-12 text-center text-stone-400">
        <p class="font-serif text-lg text-stone-700 mb-1">No pieces found in this material</p>
        <button onclick="setSectionFilter('${category}', 'all')" class="text-xs uppercase tracking-wider text-amber-900 font-semibold underline mt-2">
          View all ${category}
        </button>
      </div>
    `;
    if (seeMoreEl) seeMoreEl.innerHTML = '';
    setupIcons();
    return;
  }

  // Slice if not expanded
  const displayed = isExpanded ? items : items.slice(0, limit);

  gridEl.innerHTML = displayed.map(product => {
    const discount = product.originalPrice ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100) : null;

    return `
      <div class="group flex flex-col bg-white rounded-xl sm:rounded-2xl overflow-hidden border border-stone-200/80 hover:border-stone-400 transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
        <!-- Image Container -->
        <div class="relative w-full aspect-[4/3] bg-stone-100 overflow-hidden cursor-pointer" onclick="openQuickView('${product.id}')">
          <img 
            src="${product.image}" 
            alt="${product.name}" 
            loading="lazy"
            class="w-full h-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105"
          />
          
          <!-- Badges -->
          <div class="absolute top-2 left-2 sm:top-3.5 sm:left-3.5 flex flex-col gap-1 z-10">
            <span class="px-2 py-0.5 sm:px-2.5 sm:py-1 text-[9px] sm:text-[11px] font-medium tracking-wide uppercase bg-white/95 backdrop-blur-sm text-stone-900 rounded-full shadow-sm">
              ${product.tag}
            </span>
            ${discount ? `
              <span class="px-2 py-0.5 sm:px-2.5 sm:py-1 text-[9px] sm:text-[11px] font-semibold tracking-wide uppercase bg-amber-800 text-white rounded-full shadow-sm w-fit">
                Save ${discount}%
              </span>
            ` : ''}
          </div>

          ${product.model3d ? `
            <button 
              onclick="event.stopPropagation(); openQuickView3D('${product.id}')"
              class="absolute top-2 right-2 sm:top-3.5 sm:right-3.5 px-2.5 py-1 text-[9px] sm:text-[11px] font-semibold tracking-wider uppercase bg-stone-900/90 hover:bg-black text-white rounded-full shadow-md backdrop-blur-sm transition flex items-center gap-1 z-10"
              title="Interactive 3D View">
              <i data-lucide="box" class="w-3.5 h-3.5 text-amber-300"></i> 3D
            </button>
          ` : ''}

          <!-- Quick View Hover Button (Desktop Only) -->
          <div class="hidden sm:flex absolute inset-x-4 bottom-4 z-10 translate-y-3 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 gap-2">
            <button 
              onclick="event.stopPropagation(); openQuickView('${product.id}')"
              class="flex-1 py-2.5 px-4 bg-white/95 hover:bg-white text-stone-900 text-xs font-medium uppercase tracking-wider rounded-xl backdrop-blur-sm shadow-md transition flex items-center justify-center gap-1.5">
              <i data-lucide="eye" class="w-3.5 h-3.5"></i> Quick View
            </button>
            <button 
              onclick="event.stopPropagation(); quickAddToCart('${product.id}')"
              class="p-2.5 bg-stone-900 hover:bg-stone-800 text-white rounded-xl shadow-md transition" 
              title="Add to Bag">
              <i data-lucide="shopping-bag" class="w-4 h-4"></i>
            </button>
          </div>
        </div>

        <!-- Content (Clean & Shrunk) -->
        <div class="p-2.5 sm:p-4 flex flex-col flex-grow justify-between">
          <div>
            <!-- Title -->
            <h3 
              onclick="openQuickView('${product.id}')"
              class="font-serif text-xs sm:text-base text-stone-900 font-normal leading-tight sm:leading-snug hover:text-amber-900 transition cursor-pointer mb-1 line-clamp-1">
              ${product.name}
            </h3>
          </div>

          <!-- Bottom Row: Clean Price -->
          <div class="pt-1.5 sm:pt-2 border-t border-stone-100 flex items-center justify-between">
            <div class="flex items-baseline gap-1.5 sm:gap-2">
              <span class="text-xs sm:text-base font-semibold text-stone-900">${product.price.toLocaleString()} Birr</span>
              ${product.originalPrice ? `
                <span class="text-[10px] sm:text-xs text-stone-400 line-through">${product.originalPrice.toLocaleString()} Birr</span>
              ` : ''}
            </div>
          </div>
        </div>
      </div>
    `;
  }).join('');

  // Update See More Container
  if (seeMoreEl) {
    if (items.length > limit) {
      if (!isExpanded) {
        const remaining = items.length - limit;
        seeMoreEl.innerHTML = `
          <div class="flex flex-col items-center gap-2 pt-2">
            <button 
              onclick="toggleSectionExpand('${category}')" 
              class="px-8 py-3.5 bg-stone-900 hover:bg-stone-800 text-white rounded-full text-xs font-semibold uppercase tracking-widest transition-all duration-300 shadow-md hover:shadow-xl hover:-translate-y-0.5 inline-flex items-center gap-2.5">
              <span>See More</span>
              <i data-lucide="chevron-down" class="w-4 h-4"></i>
            </button>
          </div>
        `;
      } else {
        seeMoreEl.innerHTML = `
          <div class="flex flex-col items-center gap-2 pt-2">
            <button 
              onclick="toggleSectionExpand('${category}')" 
              class="px-8 py-3 bg-white border border-stone-300 hover:bg-stone-100 text-stone-700 rounded-full text-xs font-semibold uppercase tracking-widest transition-all inline-flex items-center gap-2.5">
              <span>Show Less</span>
              <i data-lucide="chevron-up" class="w-4 h-4"></i>
            </button>
          </div>
        `;
      }
    } else {
      seeMoreEl.innerHTML = '';
    }
  }

  setupIcons();
}

// Quick View Modal
function openQuickView(productId) {
  const product = activeProducts.find(p => p.id === productId);
  if (!product) return;

  state.activeQuickView = product;
  state.selectedColorIndex = 0;
  state.quickViewQty = 1;
  state.viewMode3D = false;

  renderQuickViewModal();
  quickViewModal.classList.remove('hidden');
  document.body.classList.add('overflow-hidden');
  setupIcons();
}

function openQuickView3D(productId) {
  const product = activeProducts.find(p => p.id === productId);
  if (!product) return;

  state.activeQuickView = product;
  state.selectedColorIndex = 0;
  state.quickViewQty = 1;
  state.viewMode3D = true;

  renderQuickViewModal();
  quickViewModal.classList.remove('hidden');
  document.body.classList.add('overflow-hidden');
  setupIcons();
}

function setQuickViewMode(is3D) {
  state.viewMode3D = is3D;
  renderQuickViewModal();
  setupIcons();
}

function closeQuickView() {
  quickViewModal.classList.add('hidden');
  document.body.classList.remove('overflow-hidden');
}

function renderQuickViewModal() {
  const product = state.activeQuickView;
  if (!product) return;

  const discount = product.originalPrice ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100) : null;
  const klarna = Math.round(product.price / 4);

  quickViewContent.innerHTML = `
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-8">
      <!-- Media Column (Slide-up Option A Bottom Sheet on Mobile) -->
      <div class="flex flex-col gap-2.5 sm:gap-3">
        <!-- 3D Toggle Buttons (If 3D model available) -->
        ${product.model3d ? `
          <div class="flex items-center gap-1.5 sm:gap-2 bg-stone-100 p-1 sm:p-1.5 rounded-xl w-fit">
            <button 
              onclick="setQuickViewMode(false)" 
              class="px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-lg text-[10px] sm:text-xs font-semibold uppercase tracking-wider transition ${!state.viewMode3D ? 'bg-stone-900 text-white shadow-sm' : 'text-stone-600 hover:text-stone-900'}">
              📷 Photos
            </button>
            <button 
              onclick="setQuickViewMode(true)" 
              class="px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-lg text-[10px] sm:text-xs font-semibold uppercase tracking-wider transition flex items-center gap-1.5 ${state.viewMode3D ? 'bg-stone-900 text-white shadow-sm' : 'text-stone-600 hover:text-stone-900'}">
              <i data-lucide="box" class="w-3.5 h-3.5 text-amber-400"></i> 3D (360°)
            </button>
          </div>
        ` : ''}

        <div class="relative w-full h-48 sm:h-auto sm:aspect-square rounded-2xl overflow-hidden bg-stone-100 border border-stone-200">
          ${product.model3d && state.viewMode3D ? `
            <model-viewer 
              src="${product.model3d}" 
              alt="${product.name} 3D Model" 
              auto-rotate 
              camera-controls 
              ar 
              shadow-intensity="1.5" 
              exposure="1.0"
              class="w-full h-full min-h-[190px] sm:min-h-[360px] bg-stone-100 cursor-grab active:cursor-grabbing">
              <div slot="ar-button" class="absolute bottom-3 right-3 sm:bottom-4 sm:right-4 bg-stone-900 text-white px-3 py-1.5 rounded-full text-[10px] sm:text-xs font-medium uppercase tracking-wider flex items-center gap-1.5 shadow-xl hover:bg-black transition cursor-pointer">
                <i data-lucide="camera" class="w-3.5 h-3.5 sm:w-4 sm:h-4"></i> View in Room (AR)
              </div>
            </model-viewer>
          ` : `
            <img 
              src="${product.image}" 
              alt="${product.name}" 
              class="w-full h-full object-cover"
            />
            <div class="absolute top-3 left-3 sm:top-4 sm:left-4">
              <span class="px-2.5 py-0.5 sm:px-3 sm:py-1 text-[10px] sm:text-xs font-semibold uppercase tracking-wider bg-white/95 backdrop-blur-md rounded-full text-stone-900 shadow">
                ${product.tag}
              </span>
            </div>
          `}
        </div>

        <!-- Specifications Grid -->
        <div class="grid grid-cols-2 gap-2 sm:gap-3 text-xs bg-stone-50 p-2.5 sm:p-4 rounded-xl border border-stone-200">
          <div>
            <span class="text-stone-400 block font-medium uppercase text-[9px] sm:text-[10px] tracking-wider">Dimensions</span>
            <span class="text-stone-800 font-medium text-xs sm:text-sm">${product.dimensions}</span>
          </div>
          <div>
            <span class="text-stone-400 block font-medium uppercase text-[9px] sm:text-[10px] tracking-wider">Seat / Clearance</span>
            <span class="text-stone-800 font-medium text-xs sm:text-sm">${product.seatHeight}</span>
          </div>
          <div>
            <span class="text-stone-400 block font-medium uppercase text-[9px] sm:text-[10px] tracking-wider">Total Weight</span>
            <span class="text-stone-800 font-medium text-xs sm:text-sm">${product.weight}</span>
          </div>
          <div>
            <span class="text-stone-400 block font-medium uppercase text-[9px] sm:text-[10px] tracking-wider">Craftsmanship</span>
            <span class="text-stone-800 font-medium text-xs sm:text-sm">FSC Certified Timber</span>
          </div>
        </div>
      </div>

      <!-- Details Column -->
      <div class="flex flex-col justify-between">
        <div>
          <!-- Clean Breadcrumb (No Fake Reviews) -->
          <div class="text-xs text-stone-500 mb-1">
            <span class="uppercase tracking-widest text-[10px] sm:text-[11px] font-semibold text-stone-400">Moke Collection / ${product.category}</span>
          </div>

          <!-- Title -->
          <h2 class="font-serif text-xl sm:text-2xl lg:text-3xl text-stone-900 font-normal mb-1.5 sm:mb-2">${product.name}</h2>
          
          <!-- Price -->
          <div class="flex items-baseline gap-2 sm:gap-3 mb-2.5 sm:mb-4">
            <span class="text-xl sm:text-2xl font-semibold text-stone-900">${product.price.toLocaleString()} Birr</span>
            ${product.originalPrice ? `
              <span class="text-xs sm:text-sm text-stone-400 line-through">${product.originalPrice.toLocaleString()} Birr</span>
              <span class="text-[10px] sm:text-xs font-bold text-amber-800 uppercase tracking-wide bg-amber-50 px-2 py-0.5 rounded-full">Save ${discount}%</span>
            ` : ''}
          </div>

          <p class="text-[11px] sm:text-xs text-stone-500 mb-3 sm:mb-5 flex items-center gap-1.5">
            <i data-lucide="shield-check" class="w-4 h-4 text-emerald-700 shrink-0"></i>
            🚚 Free Delivery on All Orders. Includes 10-year frame warranty.
          </p>

          <!-- Description -->
          <div class="text-stone-600 text-xs sm:text-sm leading-relaxed mb-4 sm:mb-6 pb-3 sm:pb-6 border-b border-stone-200">
            ${product.description}
          </div>

          <!-- Color / Finish Selector -->
          <div class="mb-6">
            <div class="flex justify-between items-center text-xs mb-2.5">
              <span class="font-semibold text-stone-800 uppercase tracking-wider text-[11px]">Finish / Upholstery:</span>
              <span id="qv-selected-color-name" class="text-stone-600 font-medium">${product.colorNames[state.selectedColorIndex]}</span>
            </div>
            <div class="flex items-center gap-3">
              ${product.colors.map((color, idx) => `
                <button 
                  onclick="selectQuickViewColor(${idx})"
                  class="w-8 h-8 rounded-full border-2 transition-all p-0.5 ${idx === state.selectedColorIndex ? 'border-stone-900 scale-110 shadow-sm' : 'border-stone-200 hover:border-stone-400'}"
                  title="${product.colorNames[idx]}">
                  <span class="w-full h-full block rounded-full" style="background-color: ${color};"></span>
                </button>
              `).join('')}
            </div>
          </div>

          <!-- Will it Fit Accordion -->
          <div class="bg-amber-50/60 border border-amber-200/60 rounded-xl p-3.5 mb-6 text-xs text-stone-700 flex items-start gap-2.5">
            <i data-lucide="ruler" class="w-4 h-4 text-amber-900 shrink-0 mt-0.5"></i>
            <div>
              <strong class="font-medium text-amber-950 block">Will It Fit Your Space?</strong>
              Requires minimum 80cm doorway clearance for standard delivery. White-glove assembly available at checkout.
            </div>
          </div>
        </div>

        <!-- Quantity & Add to Cart -->
        <div class="pt-4 border-t border-stone-200 flex items-center gap-3">
          <div class="flex items-center border border-stone-300 rounded-xl bg-white overflow-hidden">
            <button onclick="updateQty(-1)" class="px-3.5 py-3 hover:bg-stone-100 text-stone-600 text-sm font-semibold transition">-</button>
            <span id="qv-qty" class="w-10 text-center font-medium text-sm text-stone-900">1</span>
            <button onclick="updateQty(1)" class="px-3.5 py-3 hover:bg-stone-100 text-stone-600 text-sm font-semibold transition">+</button>
          </div>
          <button 
            onclick="addQuickViewToCart()"
            class="flex-1 py-3.5 px-6 bg-stone-900 hover:bg-stone-800 text-white rounded-xl font-medium text-xs tracking-wider uppercase shadow-lg hover:shadow-xl transition flex items-center justify-center gap-2">
            <i data-lucide="shopping-bag" class="w-4 h-4"></i>
            Add to Bag • ${(product.price * state.quickViewQty).toLocaleString()} Birr
          </button>
        </div>
      </div>
    </div>
  `;
}

function selectQuickViewColor(idx) {
  state.selectedColorIndex = idx;
  const product = state.activeQuickView;
  const label = document.getElementById('qv-selected-color-name');
  if (label && product) {
    label.textContent = product.colorNames[idx];
  }
  renderQuickViewModal();
  setupIcons();
}

function updateQty(delta) {
  state.quickViewQty = Math.max(1, state.quickViewQty + delta);
  const qtyEl = document.getElementById('qv-qty');
  if (qtyEl) qtyEl.textContent = state.quickViewQty;
  renderQuickViewModal();
  setupIcons();
}

function addQuickViewToCart() {
  if (!state.activeQuickView) return;
  const product = state.activeQuickView;
  const selectedColor = product.colorNames[state.selectedColorIndex];

  addToCart({
    id: product.id,
    name: product.name,
    price: product.price,
    image: product.image,
    color: selectedColor,
    quantity: state.quickViewQty
  });

  closeQuickView();
  openCart();
}

function quickAddToCart(productId) {
  const product = activeProducts.find(p => p.id === productId);
  if (!product) return;

  addToCart({
    id: product.id,
    name: product.name,
    price: product.price,
    image: product.image,
    color: product.colorNames[0],
    quantity: 1
  });

  showToast(`Added "${product.name}" to your bag.`);
}

// Cart System
function addToCart(item) {
  const existing = state.cart.find(i => i.id === item.id && i.color === item.color);
  if (existing) {
    existing.quantity += item.quantity;
  } else {
    state.cart.push(item);
  }

  saveCart();
  updateCartUI();
}

function removeFromCart(index) {
  state.cart.splice(index, 1);
  saveCart();
  updateCartUI();
}

function updateCartItemQty(index, delta) {
  const item = state.cart[index];
  if (!item) return;

  item.quantity += delta;
  if (item.quantity <= 0) {
    state.cart.splice(index, 1);
  }
  saveCart();
  updateCartUI();
}

function saveCart() {
  localStorage.setItem('moke_cart', JSON.stringify(state.cart));
}

function updateCartUI() {
  const totalCount = state.cart.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = state.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  if (cartBadge) {
    cartBadge.textContent = totalCount;
    cartBadge.classList.toggle('opacity-0', totalCount === 0);
  }

  if (cartSubtotalEl) cartSubtotalEl.textContent = `${subtotal.toLocaleString()} Birr`;
  if (cartTotalEl) cartTotalEl.textContent = `${subtotal.toLocaleString()} Birr`;

  // Free delivery — always free for Moke
  const threshold = 1500;
  if (freeShippingProgress && freeShippingText) {
    freeShippingProgress.style.width = `100%`;
    freeShippingText.innerHTML = `<strong>🚚 Free Delivery on All Orders!</strong>`;
  }

  // Render items
  if (cartItemsContainer) {
    if (state.cart.length === 0) {
      cartItemsContainer.innerHTML = `
        <div class="h-full flex flex-col items-center justify-center text-center p-8 text-stone-400">
          <div class="w-16 h-16 rounded-full bg-stone-100 flex items-center justify-center mb-3 text-stone-400">
            <i data-lucide="shopping-bag" class="w-8 h-8"></i>
          </div>
          <p class="font-serif text-stone-800 text-lg mb-1">Your bag is empty</p>
          <p class="text-xs text-stone-500 max-w-xs mb-6">Explore our curated sofas, chairs, and tables to start styling your home.</p>
          <button onclick="closeCart()" class="px-5 py-2.5 bg-stone-900 text-white rounded-full text-xs font-medium uppercase tracking-wider hover:bg-stone-800 transition">
            Continue Browsing
          </button>
        </div>
      `;
    } else {
      cartItemsContainer.innerHTML = state.cart.map((item, idx) => `
        <div class="flex gap-4 p-4 bg-stone-50/70 rounded-2xl border border-stone-200/70">
          <img src="${item.image}" alt="${item.name}" class="w-20 h-20 rounded-xl object-cover border border-stone-200 shrink-0" />
          <div class="flex flex-col justify-between flex-grow">
            <div>
              <div class="flex justify-between items-start">
                <h4 class="font-serif text-sm font-medium text-stone-900 line-clamp-1">${item.name}</h4>
                <button onclick="removeFromCart(${idx})" class="text-stone-400 hover:text-red-600 transition p-1">
                  <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
                </button>
              </div>
              <p class="text-xs text-stone-500">${item.color}</p>
            </div>
            <div class="flex justify-between items-center mt-2">
              <span class="font-semibold text-stone-900 text-sm">${(item.price * item.quantity).toLocaleString()} Birr</span>
              <div class="flex items-center border border-stone-300 rounded-lg bg-white overflow-hidden">
                <button onclick="updateCartItemQty(${idx}, -1)" class="px-2 py-1 hover:bg-stone-100 text-stone-600 text-xs font-semibold">-</button>
                <span class="w-7 text-center font-medium text-xs text-stone-900">${item.quantity}</span>
                <button onclick="updateCartItemQty(${idx}, 1)" class="px-2 py-1 hover:bg-stone-100 text-stone-600 text-xs font-semibold">+</button>
              </div>
            </div>
          </div>
        </div>
      `).join('');
    }
  }

  setupIcons();
}

function openCart() {
  if (cartDrawer) {
    cartDrawer.classList.remove('translate-x-full');
    cartBackdrop.classList.remove('hidden');
    document.body.classList.add('overflow-hidden');
  }
}

function closeCart() {
  if (cartDrawer) {
    cartDrawer.classList.add('translate-x-full');
    cartBackdrop.classList.add('hidden');
    document.body.classList.remove('overflow-hidden');
  }
}

// Toast System
function showToast(message) {
  if (!toastEl) return;
  toastEl.textContent = message;
  toastEl.classList.remove('opacity-0', 'translate-y-4');
  toastEl.classList.add('opacity-100', 'translate-y-0');

  setTimeout(() => {
    toastEl.classList.remove('opacity-100', 'translate-y-0');
    toastEl.classList.add('opacity-0', 'translate-y-4');
  }, 2800);
}
