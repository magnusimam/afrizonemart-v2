# Shelf Manager — Admin Walkthrough

A practical guide to the shelf system at `/admin/shelves`. Covers what shelves are, how to add products, how to mix countries on one shelf, how to schedule promotions, and the common workflows you'll do most often.

This document is the source of truth for admin operations. The technical architecture lives elsewhere; here we focus on **what you click and what happens**.

---

## 1. What a shelf is

A **shelf** is a curated row of products. The storefront homepage has shelves like "Today's Deals" and "Groceries, Beverages & Drinks"; the mobile app has the same shelves, in the same order. Both surfaces read from the same data, so when you publish a change in admin it lands everywhere within ~30 seconds.

Each shelf has:

| Field | What it does |
|---|---|
| `key` | Stable identifier (e.g. `shelf_groceries`). Code references shelves by key. **Don't rename keys** — links break. |
| `title` | The big text shown above the shelf on web + mobile. |
| `subtitle` | Optional smaller text under the title. |
| `rows × cols` | How many products to render. `rows: 1, cols: 12` = up to 12 products. |
| `enabled` | When off, the shelf disappears from web + mobile. Use as a kill-switch. |
| **mode** | Country-rule / Category auto-fill / Explicit picks. Explained below. |

---

## 2. Where shelves appear

| Surface | What renders shelves |
|---|---|
| Storefront homepage | All enabled shelves (per the page builder layout) |
| Mobile Home tab | Shelves listed in `mobile.home.layout` content key — defaults to the 10 home shelves below |
| Mobile sidebar destinations | `Today's Deals` opens a shelf-backed list; other "Browse" entries are filter-backed |

Disable a shelf in admin → it vanishes from both web and mobile next time customers reload. No deploy needed.

---

## 3. Tour of the shelf manager UI

Open `https://afrizonemart.com/admin/shelves`.

### List page

You'll see a table of all shelves with their key, title, enabled state, and product count. Click any row to edit, or click **New shelf** to create one.

### Edit page (`/admin/shelves/<key>`)

Three sections, top to bottom:

1. **Container settings** — title, subtitle, rows × cols, enabled toggle. Standard stuff.
2. **Auto-fill rules** — country rule or category auto-fill. Optional; when set, the explicit picks below are ignored.
3. **Products** — the explicit picks list. Search + add, drag to reorder, per-product chips for country/schedule.

The page saves in two parts:
- **Container + rules** save via the `Save settings` button at the top.
- **Products** save via the `Save products` button at the bottom of the list.

Each save is independent — adjusting rules doesn't touch your picks, and vice versa.

---

## 4. The three modes — which one to use

Shelves run in one of three modes, evaluated in this order at request time:

```
1. Country-rule mode      (if countryRows is set)
2. Category auto-fill     (if categoryAutoFill is set)
3. Explicit picks         (default)
```

### Mode 1 — Country-rule auto-fill

**Use it when:** you want a per-country mix without curating each market individually. The shelf renders e.g. "6 South African products, then 4 Nigerian, then 6 of anything else" — and the catalog auto-fills as new products are added.

**How to set it:**
- In `/admin/shelves/<key>` find the **Country rows** section.
- Add a row: `country: ZA, count: 6`
- Add another: `country: NG, count: 4`
- Add a final catch-all: `country: (any), count: 6`
- Save.

Each row maps to a slot on the shelf. The server filters by `Product.origin` and pulls the most recent products matching each rule. New products land here automatically.

**When NOT to use it:** when you want hand-picked control over exactly which products show. Switch to explicit picks instead.

### Mode 2 — Category auto-fill

**Use it when:** you want every product from a category (and its subcategories) on the shelf. Most of the mobile home shelves use this — `shelf_groceries` auto-fills from `groceries + drinks`, `shelf_books` from `books` (which expands to all 20 book subcategories), etc.

**How to set it:**
- In the shelf editor, find **Category auto-fill**.
- Type one or more category slugs: `groceries`, `drinks`
- Save.

The shelf shows the latest in-stock products from those categories, including their subcategories. New products in those categories appear automatically. If a category has imageless products, those are included as a fallback after the with-image products run out.

**When NOT to use it:** when you want a curated selection (e.g. "10 products our editor picked for this week's promo"). Use explicit picks.

### Mode 3 — Explicit picks

**Use it when:** you want hand-picked control. `homepage_featured` and `staff_picks` work this way.

**How to set it:**
- Leave Country rows + Category auto-fill empty.
- In the **Products** section, search for products by name.
- Click **Add** to drop one into the shelf.
- Drag to reorder.
- Click **Save products**.

This is the most labour-intensive mode but gives full editorial control.

---

## 5. Mixing countries on one shelf

Two ways depending on what you want:

### Option A — Same product, different markets

You want one shelf where Kenyans see Kenyan products and Nigerians see Nigerian products.

→ Use **country-rule mode**. The server filters by the customer's country at request time.

### Option B — Different products on one shelf, each scoped to certain markets

You want a "Editor's Picks This Week" shelf where:
- Product X is shown to everyone
- Product Y is shown only in Nigeria + Ghana
- Product Z is shown only in South Africa

→ Use **explicit picks mode** + per-product country chips.

**How:**
- Add Product X. Leave its country chip empty (= all countries).
- Add Product Y. Click its country chip → select `NG`, `GH`.
- Add Product Z. Click its country chip → select `ZA`.
- Save products.

When a Nigerian customer loads the shelf they see X + Y. When a South African customer loads it they see X + Z. The shelf header stays the same; only the visible products change.

---

## 6. Time-boxed promotions

Each explicit pick has optional `Starts at` and `Ends at` fields.

**Example: a Mother's Day promotion** active only May 6–14.

- Add the products you want to feature.
- For each, set `Starts at: 2026-05-06 00:00` and `Ends at: 2026-05-14 23:59`.
- Save products.

Outside the window the products silently disappear from the shelf. No need to manually enable/disable on the day.

**Pairing with shelf enabled toggle:**
- If you want the ENTIRE shelf to disappear outside the window (not just the products), use the shelf's `enabled` toggle on a schedule (manually, or via a future cron).
- If you want the shelf to stay visible with other products year-round and only the promo products to swap in/out, just use per-product scheduling.

---

## 7. Current home shelves

These 10 shelves render on the mobile Home tab (and most also on the web homepage). Order is set by `mobile.home.layout` content key.

| Key | Title | Mode | Categories |
|---|---|---|---|
| `homepage_featured` | Today's Deals Just For You | Explicit picks | — |
| `shelf_groceries` | Groceries, Beverages & Drinks | Category auto-fill | groceries + drinks |
| `staff_picks` | Don't Wait! | Explicit picks | — |
| `shelf_books` | Come For The Book, Stay For The Story | Category auto-fill | books |
| `shelf_home` | Make It Home | Category auto-fill | home-essentials |
| `shelf_baby` | For The Little Ones | Category auto-fill | baby |
| `shelf_snacks` | Snack Attack | Category auto-fill | snacks |
| `shelf_personal_care` | Personal Care | Category auto-fill | personal-care |
| `shelf_office` | Office & Stationery | Category auto-fill | office-supplies + stationery |
| `shelf_eleganza` | Eleganza Collection | Category auto-fill | eleganza |

Plus `todays_deals_pick` — separate shelf used by the mobile sidebar's "Today's Deals" destination (curated picks). Distinct from `homepage_featured` which is the Home's first shelf.

---

## 8. Adding a new shelf

### Quick path — admin only (no code)

1. Go to `/admin/shelves`, click **New shelf**.
2. Set a `key` (lowercase + underscores, e.g. `shelf_holiday`), `title`, optional `subtitle`, `rows × cols`.
3. Pick a mode (rules vs explicit picks) — see Section 4.
4. Save settings.
5. Add products (if explicit picks) or set rules (if auto-fill).
6. Save products.

The shelf is now reachable at `GET /api/shelves/<key>`. The web storefront's page builder can pick it up via the "shelf widget"; the mobile app needs one line of code to render it (see below).

### To make it appear on mobile Home

The mobile app reads its home layout from `mobile.home.layout` content key. To add a new shelf:

**Option A — Use the existing fallback (no admin work).**
Add the shelf key to `afrizonemart-mobile/src/lib/homeLayout.ts` `DEFAULT_HOME_LAYOUT` array. Ship as a mobile PR. The shelf appears on Home in the position you list it.

**Option B — Override via admin content key.**
PATCH `/api/admin/content` with the key `mobile.home.layout` and a JSON value listing every section in the order you want. This requires more familiarity with the JSON shape — easier to start with Option A unless you've got a planned promotion cycle.

---

## 9. Common workflows

### "I want to add a Christmas Market shelf"

1. `/admin/shelves` → **New shelf**.
2. Key: `christmas_market`. Title: `Christmas Market`. Rows × Cols: `1 × 12`.
3. Mode: **Explicit picks** (handpicked seasonal products).
4. Save settings.
5. Search + add Christmas products. Set start/end dates so the shelf auto-disables outside the season.
6. Save products.
7. **For the mobile sidebar:** the sidebar already links to this key (`christmasMarket` action). The link will start working as soon as the shelf has products.
8. **For the home page:** add `{ type: 'shelf', key: 'christmas_market' }` to the `mobile.home.layout` content key (or the `DEFAULT_HOME_LAYOUT` array if you'd rather code it).

### "Disable a shelf during a stock outage"

Toggle `enabled` to off in shelf settings → save. Web + mobile drop the shelf within ~30 seconds. Toggle back on when stock returns.

### "Edit just the products on an existing shelf"

Open `/admin/shelves/<key>`. Scroll past container settings + rules. The Products section is at the bottom. Search + add + drag. Save products. Done.

### "Reorder shelves on the mobile home page"

PATCH `mobile.home.layout` content key (or update `DEFAULT_HOME_LAYOUT` in code). The layout is an ordered JSON array — first item appears first on Home. Future: a friendlier admin UI for this (PR queued).

### "Promote a product for one day only"

Add it to a shelf via explicit pick. Set `Starts at` + `Ends at` to a one-day window. Save products. It auto-disappears after the window.

---

## 10. Gotchas + troubleshooting

### "I added a product but it's not showing"

Check in order:
1. **Mode** — if the shelf has country rules OR category auto-fill set, your explicit pick is IGNORED. Clear the rule to switch to picks mode.
2. **Country chip** — if you set a country chip on the product, only customers from that country see it.
3. **Schedule** — if `Starts at` is in the future or `Ends at` is in the past, it's hidden.
4. **Enabled flag** — shelf disabled = no products show.
5. **`inStock`** — out-of-stock products are filtered server-side. The Products list in admin shows them anyway, but the live shelf hides them.
6. **Cache** — web + mobile cache shelf responses for ~30-60 seconds. Wait and reload.

### "I disabled a shelf but it's still showing"

The storefront edge cache is 60 seconds; mobile picks up changes on pull-to-refresh or next launch. If a customer's app cache is stale, the shelf can linger up to 5 minutes (SWR window).

### "Country auto-fill returns 0 products"

The chosen country has 0 products. The shelf falls back to whatever's left after the country rules — if there's no `country: (any)` catch-all row, the shelf renders empty.

### "Category auto-fill returns 0 products"

The category slug doesn't exist OR the category has 0 in-stock products with images. Books-shaped issue: the API falls back to imageless products if there aren't enough with-image, so this should be rare.

### "I want a shelf shown on web but not mobile (or vice versa)"

The container is shared. The order is set per-surface — web reads its layout from a different content key (`content.home.<section>.headline`) than mobile (`mobile.home.layout`). To hide a shelf on one surface but not the other, exclude its key from that surface's layout config.

### "I changed a category — the shelf's auto-fill broke"

If you renamed a category slug, the shelf's `categoryAutoFill` still has the old slug. Update the slug list in `/admin/shelves/<shelf-key>` to match.

---

## 11. Quick reference

### Where things live

| Thing | URL |
|---|---|
| Shelf list | `/admin/shelves` |
| Single shelf edit | `/admin/shelves/<key>` |
| Site content | `/admin/content` |
| Per-category hero | `/admin/category-heroes` |
| Categories | `/admin/categories` |
| Feature flags | `/admin/feature-flags` |
| Image uploads | (handled inline on each form) |

### API endpoints (for reference)

| Endpoint | Purpose |
|---|---|
| `GET /api/shelves/<key>` | Read a shelf (web + mobile) |
| `GET /api/shelves/<key>?country=NG` | Read a shelf scoped to a country |
| `PUT /api/admin/shelves/<key>` | Update container + rules |
| `PUT /api/admin/shelves/<key>/products` | Replace product list |
| `GET /api/content` | Read content overrides (incl. layout) |
| `PUT /api/admin/content` | Update content keys |

### Feature flag kill-switches

These let you hide entire mobile sections without touching shelves:

| Flag | Hides |
|---|---|
| `mobile_show_hero` | Hero slider on Home |
| `mobile_show_categories` | Category chip row |
| `mobile_show_country_marquee` | Shop by country row |

Flip in `/admin/feature-flags`. Effects within 60 seconds.

---

## 12. What's coming next

Items on the backlog that touch shelves:

- **Admin UI for `mobile.home.layout`** — drag-to-reorder editor instead of JSON. Currently you'd PATCH the content key manually.
- **Drag-to-reorder on the layout list** — same idea, prettier UX.
- **Shelf preview** — see how a shelf will render before saving. Today you save first, then check the live storefront/mobile.
- **Scheduled enable/disable on the shelf level** — instead of just per-product scheduling.
- **Web parity for hero slide links** — wraps slides in `<Link>` so the storefront hero is clickable too (already works on mobile).

Open a ticket / mention to the engineering team when one of these starts blocking you.

---

*Last updated: 2026-05-21. Maintained alongside the shelf system itself; if any field/UI changes break this doc, update both at the same time.*
