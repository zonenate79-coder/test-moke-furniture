# MOKE FURNITURE — Web Experience

An architectural, editorial furniture web application designed with Yanick Scents-style instant categorization and filtering.

## 📁 Project Structure

```
moke-furniture/
├── index.html           # Main store landing page & responsive UI
├── app.js               # Category filtering, cart drawer, modal, and state
├── data/
│   └── products.js      # 30 curated products (10 Sofas, 10 Chairs, 10 Tables)
└── README.md            # Project documentation & logo guide
```

---

## 🚀 How to Open and Preview

### Option 1: Direct Browser Open
Double-click `index.html` in your file explorer, or right-click `index.html` and choose **Open with > Chrome / Edge / Firefox**.

### Option 2: Local Server (Optional)
From PowerShell inside `C:\Users\zonen\.gemini\antigravity\scratch\moke-furniture`:
```powershell
python -m http.server 8000
```
Then visit `http://localhost:8000` in your browser.

---

## 🏷️ How to Swap in Your Official Logo Later

In [index.html](file:///C:/Users/zonen/.gemini/antigravity/scratch/moke-furniture/index.html#L84-L96):

Look for the header brand block:
```html
<a href="#" class="group inline-flex flex-col items-center">
  <span class="font-serif text-2xl sm:text-3xl tracking-[0.25em] font-normal uppercase text-stone-900 group-hover:text-amber-900 transition">
    MOKE
  </span>
  <span class="text-[9px] uppercase tracking-[0.35em] text-stone-400 -mt-1 font-sans">
    FURNITURE
  </span>
</a>
```

To replace with an image logo:
1. Place your logo file (e.g. `logo.png` or `logo.svg`) inside the folder.
2. Replace the span elements with:
```html
<img src="logo.png" alt="Moke Furniture" class="h-8 w-auto object-contain" />
```

---

## ✨ Features Included

1. **Yanick Scents-style instant categorization**:
   - Primary tabs: `All Pieces`, `🛋️ Sofas (10)`, `🪑 Chairs (10)`, `🪵 Tables (10)`
   - Secondary curated filter chips: `Curator's Choice`, `Bouclé & Weaves`, `Solid Oak & Ash`, `Full-Grain Leather`, `Marble & Travertine`, `Under $1,000`
   - Instant live search by name, timber, or fabric
   - Sorting by Featured, Price Low to High, Price High to Low, and Highest Rated
2. **30 Realistic Products**:
   - 10 Sofas, 10 Chairs, 10 Tables
   - Realistic prices, sale discount badges, dimensions, weights, and color swatches
3. **Interactive Quick View Modal**:
   - High-res photo preview
   - Dimensions, seat height, weight, and FSC timber specs
   - Live color/finish switcher
   - "Will It Fit?" doorway clearance guide
   - Quantity selector & instant Add-to-Bag
4. **Slide-Over Shopping Bag**:
   - Free White-Glove delivery progress bar (unlocks at $1,500)
   - Dynamic counter, quantity adjusters, subtotal, and checkout flow
   - Persisted via browser `localStorage`
