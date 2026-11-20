# MOKE FURNITURE — Web Experience

An architectural, editorial furniture e-commerce website featuring interactive 3D/AR object inspection, mobile-optimized side-by-side cards, clean typography, and a private visual Product Studio.

---

## 📁 Project Structure

```
moke-furniture/
├── index.html           # Main store landing page (public customer-facing store)
├── builder.html         # Private Studio Builder & Orders Database Manager
├── app.js               # Store logic, 3D Quick View, checkout, shopping bag
├── images/              # Local brand photography folder (images/sofa-1.jpg, etc.)
├── data/
│   ├── db.js            # MokeDB Simple Client-Side Database Engine (orders, exports)
│   └── products.js      # Base catalog with 30 curated products
└── README.md            # Documentation
```

---

## 🌟 Key Features & Layout

### 1. Public Store (`index.html`)
* **Clean & Private**: No public admin or builder links visible anywhere on the site.
* **Warm Luminous Hero**: Balanced 50% warm espresso/charcoal overlay over sunlit interior photography.
* **Dedicated Showroom Sections**:
  * **🛋️ Sofas** (with filters: `All`, `Leather`, `Bouclé`, `Linen`, `Wood Frame`)
  * **🪑 Chairs** (with filters: `All`, `Leather`, `Oak & Cord`, `Bouclé`, `Velvet`)
  * **🪵 Tables** (with filters: `All`, `Solid Oak & Elm`, `Travertine & Marble`)
* **6-Item Starting View & "See More"**:
  * Each section starts with 6 curated pieces directly.
  * Clicking **`See More ↓`** smoothly reveals the remaining pieces downward.
  * Clicking **`Show Less ↑`** collapses back to 6.
* **Ultra-Clean Outside Cards**:
  * All fake review stars, review counts, and clutter removed.
  * Shows only high-res photo, badge (if any), 3D button (if 3D available), piece title, and price.
* **Mobile Experience (Option A — Slide-up Bottom Sheet)**:
  * 2 cards side-by-side (`grid-cols-2`).
  * When tapping a piece on mobile, it slides up as an elegant **Bottom Sheet** with a drag pull-bar handle, compact photo height (`h-48`), so title, price, swatches, and "Add to Bag" button are immediately reachable.
* **Direct Telegram Checkout (@N8bee)**:
  * When customers click **"Proceed to Checkout"**, a verification checkout window opens.
  * **Payment Methods**:
    * **CBE Bank (Commercial Bank of Ethiopia)**: Account `100000838` with 1-click Copy button.
    * **Telebirr**: Number `28398387` with 1-click Copy button.
    * **Full Payment Notice**: Explicitly requires 100% full transfer before dispatch.
  * **Payment Screenshot Upload**: Customers upload their transfer screenshot with instant receipt image preview and file name.
  * **Customer Info**: Collects Full Name, Phone Number, Delivery Address & City, and Delivery Notes.
  * Clicking **"Send Order & Screenshot to @N8bee"** opens Telegram (`t.me/N8bee`) with the complete pre-formatted order summary ready.
  * The customer attaches their bank payment screenshot in the chat, allowing you to confirm payment and dispatch White-Glove delivery.
* **Simple Database Engine (`data/db.js`) & Studio Orders Manager**:
  * Persistent structured collection for customer orders.
  * In [builder.html](file:///C:/Users/zonen/.gemini/antigravity/scratch/moke-furniture/builder.html), click **"Orders DB"** to view all customer orders, their CBE/Telebirr payment receipts, customer phone numbers, and gross order revenue.
  * Includes a 1-click **Export Database Backup (.json)** button.
* **Dedicated Mobile Footer**:
  * The copyright `© 2026 Moke Furniture. Handcrafted with FSC Timber. All rights reserved.` sits cleanly at the absolute very end of the page on mobile and desktop.
* **Interactive 3D / 360° Viewing**:
  * Powered by Google's `<model-viewer>` with 360° touch/mouse rotation and mobile AR ("View in Room").

---

### 2. Private Studio Builder (`builder.html`)
* **Admin Security Gate**:
  * **Username:** `admin`
  * **Password:** `12345678`
  * Locked behind a secure login gate so unauthorized visitors or GitHub viewers cannot access or modify your catalog.
* **Access**: [builder.html](file:///C:/Users/zonen/.gemini/antigravity/scratch/moke-furniture/builder.html).
* **Drag & Drop 3D**: Drop any `.glb` or `.gltf` file directly from your computer to preview it spinning live.
* **Drag & Drop Photos with Dual-Mode Support**:
  * **Option A (Free Cloud Upload)**: Dragging and dropping any photo automatically uploads it to a free cloud host to generate a public link that all customers worldwide can view on any phone!
  * **Option B (Local `images/` Folder)**: Click the **`images/ Path`** button to reference local files stored in `moke-furniture/images/`.
  * **Option C**: Paste any direct image URL.
* **Add & Modify**:
  * Update any price, name, or photo with 1 click.
  * Automatically syncs to the live store (`index.html`) in real time across browser tabs!
