# Quick Start Guide

## 🚀 Get Running in 3 Steps

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Development Server
```bash
npm run dev
```

### 3. Open in Browser
Navigate to: [http://localhost:5173](http://localhost:5173)

---

## 🎯 Quick Feature Tour

### View Data
- **Paginated table** showing 10 rows by default
- **Color-coded dwelling times**: Green (good) → Red (critical)
- Change rows per page: 10 / 25 / 50 / 100

### Filter Data

#### Option 1: Top Dropdowns (Quick Filters)
- **Invoice Type**: Select "By Air" or "By Sea"
- **Donor**: Select from 6 organizations
- **Procurer**: Select "EPSS" or "MOH"

#### Option 2: Advanced Filters
1. Click **"FILTERS"** button
2. Click **"Add Filter"**
3. Choose: Column → Operator → Value
4. Click **"Apply Filters"**

**Available Operators:**
- `contains` - Find substring
- `equals` - Exact match
- `starts with` - Prefix match
- `ends with` - Suffix match
- `is empty` - No value
- `is not empty` - Has value
- `is any of` - Multiple values (comma-separated)

### Hide/Show Columns
1. Click **"COLUMNS"** button
2. Toggle columns on/off
3. Use search to find columns quickly
4. Use **"SHOW ALL"** or **"HIDE ALL"** for bulk actions

### Export Data
- Click **"EXPORT"** button
- CSV file downloads automatically
- Includes ALL data (not just filtered view)

### Clear Filters
- Click **"Cleared"** button (top-right, appears when filters active)
- Removes all filters at once

---

## 📊 Example Use Cases

### Find Critical Delays
1. Click "FILTERS"
2. Add filter: `DwellingTime` → `equals` → `678`
3. Apply

### Find Items from Specific Officer
1. Click "FILTERS"
2. Add filter: `ShipmentOfficer` → `contains` → `Amanuel`
3. Apply

### Find Empty Shipment Officers
1. Click "FILTERS"
2. Add filter: `ShipmentOfficer` → `is empty`
3. Apply (no value needed)

### Combine Multiple Filters (AND logic)
1. Filter 1: `PortArrivalDate` → `contains` → `Jul`
2. Filter 2: `DwellingTime` → `is not empty`
3. Both conditions must match

---

## 🎨 Color Legend

| Color | Days | Status |
|-------|------|--------|
| 🟢 Green | 0-30 | Optimal |
| 🟡 Yellow | 31-60 | Warning |
| 🟠 Orange | 61-90 | Concerning |
| 🔴 Red | 90+ | Critical |

---

## ⌨️ Keyboard Shortcuts

- **Escape** - Close any open modal
- **Tab** - Navigate through form fields
- **Enter** - Submit forms / Apply actions

---

## 🏗️ Build for Production

```bash
npm run build
```

Output will be in `dist/` folder.

### Preview Production Build
```bash
npm run preview
```

---

## 🔧 Troubleshooting

### Port Already in Use?
```bash
# Kill process on port 5173 (Windows)
netstat -ano | findstr :5173
taskkill /PID <PID> /F

# Or change port in vite.config.js
```

### Filters Not Working?
- Ensure you've clicked **"Apply Filters"**
- Check that column name is spelled correctly
- Use case-insensitive search (automatic)

### Export Not Working?
- Check browser's download settings
- Ensure pop-up blocker isn't blocking download
- Try a different browser

---

## 📚 More Information

- Full documentation: See `README.md`
- Project specification: See `claude.md`
- Design system: See `DESIGN.md`

---

**Happy filtering! 🎉**
