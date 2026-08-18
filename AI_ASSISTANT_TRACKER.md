# AI Shopping Assistant — Implementation Tracker

Living doc for the AI shopping assistant Afrizonemart is building.
Captures the strategic frame, the v1 scope, the tech choices,
implementation plan across api / web / mobile, content needs, cost
model, and the deferred v2/v3 roadmap.

Same role as the other tracker docs in this repo
(PLAYSTORE_COMPLIANCE.md, ISO_27001_GAP_ASSESSMENT.md,
MOBILE_APP_TRACKER.md): single source of truth. When something
changes — a decision is made, a PR ships, a price changes — edit
this file in the same commit so future-us doesn't re-derive from
chat history.

Last updated: 2026-06-08

---

## 1. Vision

A multilingual, culturally-fluent shopping copilot on
afrizonemart.com and the Android app. Lives as a floating button
bottom-right. Users tap → ask a question in their own words →
get a real answer that takes real action.

What makes it uniquely Afrizonemart-shaped (vs Shein / Amazon /
Temu copilots):

1. **Multilingual conversational search.** "Find me the spice we
   use for ofada" — system understands intent across English /
   Pidgin / Yoruba / Igbo / Hausa / Swahili / Amharic / French /
   Portuguese / Arabic and finds matching listings even when the
   listing wording doesn't match the user's words.
2. **Care-package and gift flows.** Diaspora user: "Mum's
   birthday next month, she's in Ibadan, my budget is ₦50k, she
   likes books and skincare." Assistant curates a draft cart.
   The diaspora segment has the highest order value; this is
   where the AI earns its keep first.
3. **Cultural completion on PDPs.** Bought ankara fabric? "Want
   matching head ties or a recommended tailor?" Not random
   "people also bought" — actual cultural sense.
4. **Order + delivery + returns in plain English.** Plain
   answers to "where's my order," "how do I return this," "what
   are my coins worth," without the customer hunting through
   menus.
5. **Voice input** (mic icon). Wins for older users, multitaskers,
   users who don't type fast in English. Voice OUTPUT is deferred
   to v2 — reading is faster than listening for most shopping
   tasks.

---

## 2. Scope

### v1 — ship in 3-4 weeks

- Web + mobile (one engine, two clients)
- Text-first, voice INPUT via mic icon (no voice output)
- Multilingual (English + auto-detect for ~10 African languages
  via Claude's native multilingual capabilities)
- Action-capable: can search products, look up orders, fetch
  loyalty balance, add to cart, explain policies
- Streaming responses (Server-Sent Events) so the UI feels live
- Persistent conversation memory (30-day retention)
- Per-user rate limit (20 messages / hour at launch)
- Feature flag kill switch (we already have the registry)

### Explicitly NOT in v1 (deferred to v2/v3)

- Cartoon character avatar (start with branded chat-bubble icon
  + a strong tone of voice)
- Voice OUTPUT (TTS)
- Sign-language interpreter (real-time AI sign generation isn't
  production-quality yet; pre-recorded NSL videos are a cheaper,
  higher-quality alternative we should ship instead under
  general accessibility)
- Image-based search ("find this product from a photo") — overlaps
  with the Shein-style #9 camera-search item that's already on
  the mobile backlog
- Payment processing inside the chat (too sensitive for v1)
- Human escalation handoff (existing WhatsApp button covers this)
- Account creation flow inside the chat

---

## 3. Open decisions

These three need to be locked in before we start scaffolding.

### 3.1 Name + personality

Five candidates:

| Name | Origin | Vibe |
|---|---|---|
| **Adaeze** | Igbo, "daughter of royalty" | Warm, knowledgeable, slightly elegant |
| **Akin** | Yoruba, "brave one" | Confident, direct |
| **Zola** | Nguni, "calm / quiet" | Friendly, soothing |
| **Sade** | Yoruba, "honour bestows a crown" | Premium, considered |
| **Ife** | Yoruba, "love" | Warm, approachable |

**Recommendation**: Adaeze.

Personality decision: assistant uses "I" but is explicit she's
an assistant ("I'm Adaeze, Afrizonemart's shopping assistant").
No pretending to be human.

**Status**: ⏳ Awaiting Magnus.

### 3.2 Anthropic API account

Open an account at console.anthropic.com, add a credit card, set
a $500/mo spending cap initially. Generate an API key. We'll set
it on Railway via CLI (never paste in chat).

**Status**: ⏳ Awaiting Magnus.

### 3.3 Floating button — one or two?

Option A: replace the existing WhatsApp floating bubble with a
combined menu — tap → "Chat with Adaeze" / "WhatsApp our team".

Option B: keep them separate — WhatsApp on the left, Adaeze on
the right.

**Recommendation**: Option A. Cleaner, doesn't crowd the
viewport, and creates a clear hierarchy ("AI first, human if AI
can't help").

**Status**: ⏳ Awaiting Magnus.

---

## 4. Tech stack

| Layer | Choice | Why |
|---|---|---|
| LLM | Anthropic Claude (Haiku 4.5 for simple queries, Sonnet 4.6 for complex) | Best multilingual + cultural nuance, strict refusal of made-up answers, rock-solid tool-use |
| Streaming | Server-Sent Events (SSE) | Native browser support, simpler than WebSockets, works through Cloudflare |
| Vector store | Postgres pgvector | Already have Postgres on Railway; no new infra |
| Embedding model | Anthropic Voyage AI OR OpenAI text-embedding-3-small | Both ~$0.02/M tokens; pick whichever has better African-language support after a quick eval |
| Voice input | Browser Web Speech API (web) + expo-speech-recognition (mobile) | Free, on-device for most browsers, no API cost |
| Conversation storage | Postgres `AssistantSession` + `AssistantMessage` tables | Same DB as everything else |
| Observability | PostHog (already wired) + Sentry (already wired) | Existing analytics triangle |
| Kill switch | Existing feature-flag registry | `assistant.enabled` flag, default off, flip per environment |
| Cost cap | Anthropic dashboard spending cap + per-user rate limit | Belt + braces |

---

## 5. Backend implementation (afrizonemart-api)

Estimated effort: **~1 week** for backend foundation.

### 5.1 New schema

```prisma
model AssistantSession {
  id          String   @id @default(cuid())
  userId      String?  // nullable for anonymous chats
  user        User?    @relation(fields: [userId], references: [id], onDelete: SetNull)
  /// Last-active timestamp drives 30-day TTL purge cron.
  lastActiveAt DateTime @default(now())
  createdAt   DateTime @default(now())

  messages    AssistantMessage[]

  @@index([userId])
  @@index([lastActiveAt])
}

enum AssistantMessageRole {
  USER
  ASSISTANT
  TOOL
  SYSTEM
}

model AssistantMessage {
  id          String                @id @default(cuid())
  sessionId   String
  session     AssistantSession      @relation(fields: [sessionId], references: [id], onDelete: Cascade)
  role        AssistantMessageRole
  content     String                @db.Text
  /// Tool call payload — JSON. For ASSISTANT messages that
  /// invoke a tool; null otherwise.
  toolCalls   Json?
  /// Cost telemetry — number of input + output tokens for this
  /// message. Drives daily spend dashboard.
  tokensIn    Int                   @default(0)
  tokensOut   Int                   @default(0)
  createdAt   DateTime              @default(now())

  @@index([sessionId])
}

model ProductEmbedding {
  id          String   @id @default(cuid())
  productId   String   @unique
  product     Product  @relation(fields: [productId], references: [id], onDelete: Cascade)
  /// Concatenated source text the embedding was computed from —
  /// name + description + category name + country name. Re-embed
  /// when source changes (hook on product.updated event).
  source      String   @db.Text
  embedding   Unsupported("vector(1536)")  // pgvector
  updatedAt   DateTime @updatedAt
}
```

Migration also needs `CREATE EXTENSION IF NOT EXISTS vector;` —
Railway Postgres supports pgvector out of the box.

### 5.2 New endpoint

```
POST /api/assistant/chat
  Headers: Authorization: Bearer <token>  (optional)
  Body: {
    sessionId: string | null,  // null on first message; server creates
    message: string,
    context: {
      page: 'home' | 'product' | 'cart' | 'order' | 'category' | ...
      productSlug?: string,
      orderId?: string,
      categorySlug?: string
    }
  }
  Response: Server-Sent Events stream
    event: token    data: {"text":"chunk of response"}
    event: tool     data: {"tool":"search_products","args":{...},"result":{...}}
    event: done     data: {"sessionId":"...","tokensIn":...,"tokensOut":...}
    event: error    data: {"message":"..."}
```

Internally:

```
1. requireAuth or anonymous (allow logged-out users; rate-limit by IP)
2. Load conversation history from Postgres (or create new session)
3. Build context (current page, user's recent orders if signed in,
   current cart, current product if on PDP, etc.)
4. Build system prompt (Adaeze's voice + brand voice + capabilities)
5. RAG: embed the user message + nearest-neighbour search on
   ProductEmbedding. Pull top 5-10 products into context if the
   message looks search-shaped.
6. Call Claude API with:
   - System prompt
   - History (last N messages)
   - Tools available (see §5.3)
   - Stream=true
7. As tokens stream in: forward to client via SSE
8. If Claude requests a tool call: execute it, append the result,
   continue the conversation
9. On done: persist all messages with token counts
```

### 5.3 Tool surface

Functions Claude can call to act on the user's behalf:

```
search_products(query: string, filters?: { category, country, priceMax, inStock })
  → returns top 10 products as { slug, name, price, image, rating }

get_product_details(slug: string)
  → returns full product detail (description, variants, reviews summary)

get_my_recent_orders(userId: string)
  → returns last 5 orders for the user with status + timeline

get_order(orderId: string)
  → full order detail (auth-checked the user owns it)

get_loyalty_balance(userId: string)
  → current coin balance + tier

get_policy_snippet(topic: 'returns' | 'shipping' | 'loyalty' | 'privacy' | ...)
  → markdown snippet of relevant policy

calculate_shipping(items: [{productId, quantity}], country: string)
  → quote in NGN + ETA

add_to_cart(productSlug: string, quantity: number, variant?: string)
  → adds to the user's cart, returns updated cart summary
  Only available when userId is set (logged-in users).

list_supported_countries()
  → 54 African nations, for "do you ship to X?"
```

All tools return JSON. Claude decides when to invoke based on
the system prompt + user intent.

### 5.4 Rate limiting

- Logged-in user: 20 messages / hour
- Anonymous user (by IP): 10 messages / hour
- Per-session token cap: 50,000 tokens (cumulative input + output)
  — prevents runaway threads
- All limits via existing `express-rate-limit` middleware

### 5.5 Cost telemetry

Every `AssistantMessage` row records `tokensIn` + `tokensOut`.
Daily cron rolls up:

```
GET /api/admin/assistant/cost-report
  Returns: { today, yesterday, last7days, last30days, byModel,
             p50_response_ms, p95_response_ms }
```

Surface on `/admin` dashboard. Hard-cap alert at 80% of monthly
Anthropic spending limit.

### 5.6 Env vars (Railway api)

```
ANTHROPIC_API_KEY        = sk-ant-...  (sensitive)
ANTHROPIC_MODEL_SIMPLE   = claude-haiku-4-5
ANTHROPIC_MODEL_COMPLEX  = claude-sonnet-4-6
ASSISTANT_MAX_TOKENS_PER_RESPONSE = 1500
ASSISTANT_RATE_LIMIT_AUTHED      = 20
ASSISTANT_RATE_LIMIT_ANON        = 10
ASSISTANT_MONTHLY_USD_CAP        = 500
```

---

## 6. Web implementation (afrizonemart-v2)

Estimated effort: **~3-4 days**.

### 6.1 Floating button

Decision pending (§3.3). Assuming combined menu:

```
   ┌───────────────────────────────┐
   │                               │
   │                               │
   │            (page)             │
   │                               │
   │                          ┌──┐ │
   │                          │AI│ │  ← floating button bottom-right
   │                          └──┘ │     navy bg, amber chat icon
   └───────────────────────────────┘
```

Tap → menu unfurls:
```
   ┌───────────────────────────────┐
   │                  ┌───────────┐│
   │                  │ 💬 Chat   ││
   │                  │   Adaeze  ││
   │                  ├───────────┤│
   │                  │ 📱 WhatsApp││
   │                  │   our team││
   │                  └───────────┘│
   │                          ┌──┐ │
   │                          │AI│ │
   │                          └──┘ │
   └───────────────────────────────┘
```

Tap "Chat Adaeze" → slides up a bottom-right chat panel
(420×640px on desktop, full-screen on mobile web).

### 6.2 Chat panel

```
┌────────────────────────────────────┐
│ Adaeze · Afrizonemart  ─ ✕         │  ← header
├────────────────────────────────────┤
│                                    │
│ Hi 👋 I'm Adaeze. I can help you   │
│ find products, track orders, or    │  ← welcome state
│ build a care package. Ask me!      │
│                                    │
│ Try:                               │
│  ▸ Where's my order?               │  ← context-aware prompts
│  ▸ Show me Nigerian skincare       │     change per page
│  ▸ Help me build a gift package    │
│                                    │
├────────────────────────────────────┤
│ 🎤  [ Type your question…    ]  ↑  │  ← input
└────────────────────────────────────┘
```

When the assistant responds, streaming tokens render in real-time.
Inline product cards when she recommends — same `ProductCard`
component the rest of the site uses, rendered from the tool-call
result.

### 6.3 Context awareness

Every page tells the chat component what context it's in:

- Home page → context: `{ page: 'home' }`
- PDP → `{ page: 'product', productSlug: 'tom-brown-cereal' }`
- Cart → `{ page: 'cart' }`
- Order detail → `{ page: 'order', orderId: '...' }`

The system prompt uses this to seed "context-aware" suggested
prompts and to weight tool-use ("on the cart page, prioritise
checkout-related help").

### 6.4 Voice input

Browser Web Speech API. Hold mic button → speech-to-text → fills
input. Works on Chrome/Edge/Safari; degrades gracefully on
Firefox (mic button hidden).

### 6.5 New files / changes

```
src/components/assistant/
  AssistantFloatingButton.tsx     ← the bottom-right FAB
  AssistantPanel.tsx              ← the chat panel
  AssistantMessage.tsx            ← one bubble
  AssistantProductCard.tsx        ← inline product card
  AssistantInput.tsx              ← input + mic
src/lib/api/assistant.ts          ← chat() with SSE parsing
src/components/layout/Footer.tsx  ← swap ChatBubble for the new floating
src/components/layout/ChatBubble.tsx ← deprecate or merge
```

---

## 7. Mobile implementation (afrizonemart-mobile)

Estimated effort: **~3-4 days**.

### 7.1 Entry point

Two reasonable spots:

a) **Header search bar** — tap → expands into Adaeze panel.
   The sparkle icon next to the search icon signals "AI-powered."
b) **Dedicated bottom-bar tab** ("Ask"). Adds another tab to
   our 5-tab bar; would replace Categories or Trends.

**Recommendation**: option (a). Don't crowd the bottom bar.
Header sparkle icon next to the existing search is the cleanest
discovery surface AND keeps users in their browse context.

### 7.2 Panel

Same UX as web — bottom-sheet modal that takes the full screen
on phones (matches the rest of the app's modal style). Streaming
responses, inline product cards via `ProductCard`, mic input via
`expo-speech-recognition`.

### 7.3 Files

```
src/screens/assistant/AssistantScreen.tsx  ← the modal
src/components/AssistantFab.tsx            ← header sparkle (optional)
src/hooks/useAssistant.ts                  ← SSE client
src/lib/api/assistant.ts                   ← fetch + parse SSE
```

Register `Assistant` route in `navigation/types.ts` + AppNavigator
(presentation: 'modal').

---

## 8. Content + prompts

Estimated effort: **~1 week** for the content side (yours, mine,
or a copywriter's — can run in parallel with engineering).

### 8.1 System prompt

A few hundred words describing:
- Who Adaeze is + her role
- Tone of voice (warm, knowledgeable, slightly informal, never
  condescending, comfortable with Pidgin, respectful of elders)
- What she can do (the tool surface)
- What she refuses (off-topic, harmful, jailbreak attempts,
  account changes, payment processing)
- How to handle complaints (acknowledge, point to existing
  return/refund flow, offer WhatsApp handoff)
- Cultural sensitivity notes (avoid pan-African generalisations,
  acknowledge country-specific differences)

Lives in `afrizonemart-api/src/modules/assistant/system-prompt.md`
so it's editable without a code deploy via a small admin form
later.

### 8.2 FAQ knowledge base

20-30 markdown documents Adaeze can quote:

- Return policy details (already exists in privacy/terms)
- How Continental Rewards work
- What countries we ship to
- Show & Scan delivery flow
- How to delete account
- What payment methods we accept (Squad, GTSquad, bank transfer,
  COD)
- What happens when an order is cancelled
- How to track orders
- Privacy policy summary
- Terms of service summary
- Loyalty tier benefits + how to earn
- Birthday bonus
- Referral program
- Multi-currency display
- Customer support contact
- ...

Embedded into pgvector. Retrieved via RAG when relevant.

### 8.3 Cultural context document

The "secret sauce" — what makes Adaeze sound African, not generic.

- Major Nigerian / pan-African holidays + gifting occasions
  (Eid, Christmas, Ramadan, traditional weddings, Iya / Mama
  Day, naming ceremonies)
- Regional product names (Yoruba/Igbo/Hausa/Swahili names for
  common ingredients, fabrics, dishes)
- Diaspora-specific patterns (care-package conventions, who
  sends to whom, typical contents)
- Language register guidance (when to switch to Pidgin, when to
  formalise)

Lives in `afrizonemart-api/src/modules/assistant/cultural-context.md`.

---

## 9. Operational

### 9.1 Kill switch

Feature flag: `assistant.enabled` (boolean, default `false` until
go-live). Per-environment. Flipping `false` hides the floating
button on web + mobile + returns 503 from the API endpoint with
a "temporarily unavailable" message.

Why we want this: if costs spike or the model says something
embarrassing, one toggle disappears the surface in <60 seconds.

### 9.2 Observability

PostHog events (extend the existing `TRACK` enum):

```
ASSISTANT_OPENED       — floating button tapped, panel opens
ASSISTANT_MESSAGE_SENT — user sent a message
ASSISTANT_TOOL_INVOKED — Claude called a tool, with tool name
ASSISTANT_ACTION_TAKEN — Claude did something with side effects
                         (added to cart, etc.)
ASSISTANT_CLOSED       — panel closed
ASSISTANT_VOICE_USED   — mic input was used
```

Sentry captures any chat-pipeline errors. Existing PII scrubber
strips user message content from error contexts.

### 9.3 Admin surface

`/admin/assistant` page:
- Today's spend, yesterday's, last 7d, last 30d
- Top intents (clustered queries)
- Tool-call distribution (which tools get used most)
- p50 / p95 response time
- Top users by usage (cost attribution)
- Hard-cap alert (red banner at 80% of monthly cap)
- Kill switch toggle (mirror of the feature flag)

### 9.4 Abuse + safety

- Input filter: regex for known jailbreak patterns
- Per-user / per-IP rate limits (§5.4)
- Output filter: post-process Claude's response to redact any
  email/phone-shaped patterns it might invent (paranoid mode)
- Anthropic API does not train on API conversations by default —
  per their policy, no extra opt-out needed
- Privacy policy update: add a line about the AI assistant +
  what it stores

---

## 10. Cost model

### 10.1 Anthropic pricing (Jun 2026)

| Model | Input | Output |
|---|---|---|
| Claude Haiku 4.5 | $0.80 / M tokens | $4 / M tokens |
| Claude Sonnet 4.6 | $3 / M tokens | $15 / M tokens |

### 10.2 Per-conversation estimate

Average conversation: 10 messages, ~500 tokens each, 70% Haiku
30% Sonnet.

- Input: ~5,000 tokens × (0.7 × $0.80 + 0.3 × $3) / 1M = ~$0.007
- Output: ~5,000 tokens × (0.7 × $4 + 0.3 × $15) / 1M = ~$0.036
- **Total: ~$0.04-0.05 per conversation**

### 10.3 Monthly projection

| Daily active users | Conversations/day | Monthly cost |
|---|---|---|
| 100 | ~500 | ~$200-500 |
| 500 | ~2,500 | ~$1,000-2,500 |
| 1,000 | ~5,000 | ~$2,000-5,000 |
| 5,000 | ~25,000 | ~$10,000-25,000 |

Caching common queries cuts ~30% off. Hard cap on Anthropic
dashboard prevents runaway burn.

### 10.4 Other costs

- Embeddings: $5 one-time for full catalog, <$5/mo for updates
- Voice STT (Whisper API or browser native): free if browser,
  $0.006/min if cloud
- Postgres + pgvector: covered by existing Railway plan
- No new infrastructure cost

### 10.5 Spend control

- Anthropic dashboard monthly cap: start at $500, raise as needed
- Per-user rate limit
- Per-session token cap (50k tokens)
- Daily admin email if spend > 80% of cap
- Auto-disable feature flag if spend > 100% of cap

---

## 11. Timeline

3-4 weeks to v1.

| Week | Deliverable |
|---|---|
| **1** | Backend: schema migration, AssistantSession + Message tables, ProductEmbedding, /api/assistant/chat endpoint with SSE, tool surface, rate limits, basic system prompt |
| **2** | Web: floating button, chat panel, streaming, inline product cards, voice input |
| **3** | Mobile: header entry, modal, SSE consumer, voice input via expo-speech-recognition |
| **4** | Content: system prompt + FAQs + cultural context, end-to-end QA, cost monitoring dashboard, kill switch, public launch behind feature flag |

Could compress to 2 weeks by skipping voice input (text-only first
launch).

---

## 12. Risks + pitfalls

| Risk | Mitigation |
|---|---|
| Hallucination — Adaeze invents products that don't exist | Strict grounding: RAG over real catalog; system prompt forbids inventing SKUs; respond "I couldn't find X, here are similar matches" |
| Tone drift over time | Locked system prompt + version-controlled in the repo; periodic review (monthly) |
| Latency | Stream tokens immediately; use Haiku for simple queries; edge-deploy proxy if needed (defer) |
| Privacy — conversations contain personal info | Anthropic doesn't train on API data; privacy policy updated; per-user data deletion when account deleted (already plumbed via [[user.deleted]] event) |
| Jailbreak attempts | Input regex filter + system prompt instructions + Anthropic's built-in safety |
| Cost runaway | Anthropic cap + per-user rate limits + kill switch |
| Bad first impression | Soft launch behind feature flag to internal team first; expand to 10% of users; iterate on tone; full launch when satisfied |
| Misses cultural nuance | Cultural context document; ongoing feedback loop; manual review of top intents weekly for the first month |
| Voice input doesn't work for African accents | Browser Speech API has limited African-accent support today. Fall back to typing gracefully — mic icon hidden when not supported. Whisper API as a cloud upgrade later if browser is poor. |

---

## 13. v2 / v3 roadmap

These are explicitly NOT in v1. Captured here so we don't lose
them.

### v2

- **Voice OUTPUT** (TTS) — ElevenLabs or OpenAI Realtime API.
  Useful for accessibility (blind users) + low-literacy users.
- **Cartoon character avatar** — branded illustration, animated
  micro-interactions when Adaeze responds (small bounce, smile).
  Static illustration first, then animated.
- **Image-based search** — overlaps with mobile #9 Shein-style
  camera search. "Show me products like this photo."
- **Personalisation** — uses purchase history + viewed products
  to bias recommendations. "What would you like to try this
  month?"

### v3

- **Sign-language interpreter** — text-to-NSL via 3D avatar OR
  webcam-based NSL input recognition. Currently research-grade
  tech; revisit when production-quality vendor exists. Until then,
  ship the lower-tech but higher-quality alternative:
  pre-recorded NSL videos for top-10 flows (sign up, checkout,
  return, contact). $2-3k one-time production cost.
- **Live human escalation inside the chat** — currently WhatsApp
  is the human escalation path; bring it inline once we have a
  staff dashboard for handling chats.
- **Proactive nudges** — Adaeze speaks first when she has
  something useful to say. "Your favourite Naija seasoning is
  in stock again," "Your delivery is 5 min away," etc.

---

## 14. Status log

| Date | Event |
|---|---|
| 2026-06-08 | Doc created. Magnus + Claude aligned on brain-before-face approach. Three open decisions: name, Anthropic account, single-vs-dual floating button. |
| 2026-06-08 | Revolutionary Bets (§16) added — six ideas Magnus + Claude landed on as the ambitious end of the AI roadmap, separate from the chat-assistant v1. |

---

## 15. Implementation order (when go-live)

When Magnus signs off on the three open decisions, kick off in
this order:

1. **PR 1 (api)** — Schema migration (AssistantSession,
   AssistantMessage, ProductEmbedding). pgvector extension.
   Empty endpoint stub. Re-embedding cron seeded.
2. **PR 2 (api)** — `/api/assistant/chat` with Anthropic
   integration, system prompt, tool surface (search_products +
   get_my_recent_orders + get_loyalty_balance + get_policy_snippet
   to start). SSE streaming. Rate limits.
3. **PR 3 (api)** — Add the rest of the tools (add_to_cart,
   calculate_shipping, get_product_details, list_supported_countries).
4. **PR 4 (v2)** — Web floating button + chat panel. Feature flag
   `assistant.enabled`.
5. **PR 5 (mobile)** — Header sparkle entry + AssistantScreen.
6. **PR 6 (both)** — Voice input.
7. **PR 7 (api + v2)** — Admin cost dashboard at /admin/assistant.
8. **PR 8 (content)** — System prompt + 20-30 FAQ docs +
   cultural context doc.

Each PR is one half-day to one day. Whole stack in 3-4 weeks.

---

## 16. Revolutionary bets

The v1 chat-assistant in §1-§15 is genuinely useful but it's
incremental UX over what Shein / Amazon Rufus / Walmart Sparky
already do. This section captures the ambitious end of the
roadmap — ideas that would change the fundamental assumptions of
how Afrizonemart shopping works, not just polish the existing
flow.

Each idea is rated on three axes:

- **Production-readiness** (★ = research-grade, ★★★★★ = ship today)
- **Moat potential** (★ = competitors copy in a month, ★★★★★ = compounds over time / requires data they don't have)
- **Build cost** (S = days, M = weeks, L = months, XL = quarter+)

These are NOT in §11's v1 timeline. They sit alongside as
separate workstreams to greenlight individually as energy and
capital allow.

### 16.1 WhatsApp-as-the-app

★★★★★ readiness · ★★★★★ moat · M cost

**The inversion**: most e-commerce assumes the customer comes to
the site or installs the app. The reality for African shoppers:
WhatsApp is open all day, app downloads cost data + storage on
cheap phones + decision fatigue, websites lose connection
mid-checkout. Don't pull customers to a new place — meet them
where they already are.

**What it is**: full shopping happens inside WhatsApp. Customer
messages our number. The AI assistant is the storefront, the
cart, the checkout. It sends product images, the customer
replies with what they want, the AI sends a Squad payment link,
the customer pays in-app, the AI tracks delivery via the same
chat.

**Why it's revolutionary for Afrizonemart specifically**:

- Jumia would have built this if they were started in 2024.
  They weren't, and now have an app-acquisition cost problem.
- Western competitors (Amazon, Shein, Temu) don't build this
  because their markets don't need it — they have cheap data
  and high-storage phones. Their moat-shaped advantage doesn't
  cross to ours.
- We already have Meta Business + WhatsApp template
  infrastructure planned (currently paused on verification;
  see FEATURES_BACKLOG.md and project_whatsapp_admin_alerts).
  Reuses sunk cost.
- Skips the Play Store / App Store install friction entirely
  for the rural + diaspora segments that struggle with native
  app installs.
- Conversion-rate impact: industry case studies on
  WhatsApp-commerce (Reliance Jio's JioMart-on-WhatsApp,
  Wati.io customers, Yalo) report 3-5× higher conversion vs
  web for low-tech-literacy markets.

**What it looks like**:

```
Customer:  morning, I need rice
AI:        [4 product cards as WhatsApp media attachments]
           Here are the popular options. Reply 1-4 to add to cart.
Customer:  2 plus the small ones
AI:        Added 1× Aso-Oke Long Grain 25kg + 1× same 5kg.
           Subtotal ₦42,000.
           Want to checkout? Reply 'pay'.
Customer:  pay
AI:        [Squad payment link as WhatsApp button]
           Tap to pay. I'll let you know when payment lands.
```

**Architecture**:

- WhatsApp Business Cloud API (already plumbed for admin alerts)
- New inbound webhook for customer-sent messages
- Per-customer conversation state in Postgres (similar to
  AssistantSession + AssistantMessage but with WhatsApp
  channel)
- Same Claude backend with the same tool surface — just
  rendered as WhatsApp message templates instead of HTML
- Product cards become WhatsApp catalog items (Meta's native
  WhatsApp Commerce API supports this)
- Squad payment link generation via existing payment module

**Cost**:

- Meta WhatsApp Business: $0.005-0.015 per conversation
  (varies by country). For NG specifically: $0.008.
- At launch volume (100 conversations/day): ~$25/mo
- At 1,000/day: ~$240/mo
- Plus Anthropic Claude (same cost model as web assistant)

**Risks**:

- Meta WhatsApp template approval — needed for any non-replied
  message (proactive notifications). Reply-to-customer-message
  is unrestricted.
- 24-hour conversation window — if the customer doesn't reply
  in 24h, the AI can only re-engage via approved template
  messages (low rate of free-form re-engagement).
- WhatsApp Commerce API has feature gaps (limited catalog
  size, no full product attribute support yet).

**Recommended next step**: this deserves its own tracker doc
(`WHATSAPP_COMMERCE_TRACKER.md`). It's a sister workstream to
the chat-assistant, not a subsection. Once the Meta verification
in FEATURES_BACKLOG clears, we have the foundation to build it
fast.

### 16.2 Code-switching voice + text agent

★★★★ readiness · ★★★★ moat · S cost

**The pain**: Nigerians (and most African shoppers) code-switch
constantly. A real query in the wild:

> "I dey find that thing, you know that ankara fabric — the one
> wey get red flowers, abi maybe blue — anything you fit show
> me?"

That's English + Pidgin grammar + a Yoruba-style sentence flow,
in one query. Most LLMs handle a paragraph in one language well.
They handle code-switching badly — they "correct" to standard
English, miss the intent, or respond in stiff formal English
that breaks the conversation rapport.

**What it is**: the assistant matches the customer's register
+ language switches in real time. If you message in Pidgin, it
replies in Pidgin. If you mix Yoruba + English, it answers the
same way.

**Why revolutionary**: no major e-commerce assistant does this
well today. Most "multilingual" support means "we have separate
English, French, Portuguese versions." Code-switching IS the
mother tongue of urban Africa. The first one that lets users
shop in their actual mental language wins them.

**Build approach**:

- Claude already handles code-switching reasonably (~80% with
  a generic prompt). Strong system-prompt engineering gets it
  to ~95% — emphasize "mirror the customer's register, never
  correct their language, respond in the same blend they
  used."
- Voice input via Whisper handles African accents better than
  browser-native STT. Worth the ~$0.006/min cost.
- Optional fine-tune later on a corpus of code-switched
  customer-service transcripts (collect via early adoption +
  consent).

**Status in this tracker**: already in v1's design (§4, §8.1).
The "revolutionary" framing is: don't treat this as
multilingual support. Treat it as the brand-defining
characteristic of Adaeze. Lead the marketing with it.

### 16.3 AI seller assistant (raising the marketplace floor)

★★★★ readiness · ★★★★★ moat · M cost

**The inversion**: every AI-commerce startup thinks about
helping the buyer. Our marketplace has thousands of small
African sellers — artisans, ethnic-food producers, small
fashion brands — many of whom don't speak fluent English. Their
listings reflect that: titles like "good quality fabric small
size", no SEO keywords, missing attributes, blurry photos.
Result: bad search rank, no sales, seller churn, the catalog
floor stays low.

**What it is**: when a seller uploads a product:

1. They upload a photo + a few sentences in their own language
   (Yoruba / Igbo / Hausa / Swahili / French / Portuguese).
2. AI generates a full English (and bonus French / Portuguese)
   listing with culturally appropriate copy.
3. AI suggests pricing based on similar items already on the
   marketplace.
4. AI flags missing-but-valuable attributes ("you didn't
   mention what country the cocoa is from — buyers care").
5. AI writes SEO-friendly title + meta description.
6. AI inspects the photo and offers to enhance (background
   removal, white-bg standardisation) before publish.

**Why revolutionary**:

- Inverts the AI-commerce playbook. Buyer-helping AI is a race
  to the bottom (everyone has Rufus / Sparky / Adaeze). Seller-
  helping AI in the African context is a moat — the data
  (thousands of small-seller listings + how good listings
  perform) is ours and ours alone.
- Compound effect: better listings → better search → more
  sales → less seller churn → bigger catalog → better
  discovery → more buyers. Self-reinforcing loop.
- Lifts the entire marketplace floor in months, not years.

**Build cost**: cheaper than the buyer-side assistant. Same
Claude backend, fewer tools (no order lookup, no payment, no
shipping calc — just text generation + image cleanup). One
focused screen in the seller admin.

**Recommended next step**: after v1 of the buyer assistant
ships and we've proven the LLM plumbing works, this is the
fastest follow-on with the highest marketplace-wide ROI.

### 16.4 AI return prevention

★★★ readiness · ★★ moat · S cost

**The idea**: AI catches "you're about to buy something you'll
return" patterns before checkout and intervenes.

Customer adds size-M ankara dress. AI checks: customer's previous
orders show they returned the last two size-M dresses (size ran
small). Cart sidebar surfaces: *"Heads up — for dresses with
this brand, customers like you often size up. Try size L?"*

**Production-readiness**: high once we have ~3 months of
purchase + return history. Today the dataset's too thin.

**Why interesting**: returns are 1-3% of revenue lost (shipping
back, restocking, write-offs). Cutting returns by 30% pays the
entire AI infrastructure cost.

**Why only ★★ moat**: incremental UX — easily copied. But the
data is ours.

**Build cost**: S (small). Single tool that runs at add-to-cart
time, RAG over the customer's return history.

**Status**: not a v1 — needs purchase + return data we haven't
accumulated yet. Park for ~6 months post-launch.

### 16.5 AI gift planning across the year

★★★ readiness · ★★★★ moat · M cost

**The flip**: instead of helping with one purchase, help with a
year of purchases.

**The pain**: diaspora users obsess over the gifting calendar.
Mum's birthday in March. Sister's wedding anniversary in July.
Father's Day in June. Cousin's traditional naming ceremony
sometime in September. Eid + Christmas + Boxing Day. They plan
manually, often late, often last-minute-stressed.

**What it is**: give the AI your social graph — mum, dad,
siblings, friends, kids — their birthdays, anniversaries,
religious occasions, taste profiles. AI plans 14 gifts for the
year in advance. You sign off on the slate. AI batch-orders
monthly with delivery scheduled to arrive on the right day.

**Why revolutionary**:

- The diaspora segment has the highest order value AND the
  highest emotional stakes per purchase. Winning their loyalty
  is worth more per user than the in-country segment.
- It's a relationship product, not a shopping product. Users
  hire Adaeze to think for them. Loyalty effect is enormous.
- Very hard to copy without the cultural-occasion knowledge.

**Build cost**: M. Needs:

- Social-graph capture UI (a one-time setup wizard)
- Calendar with cultural occasions pre-seeded for each
  African country
- Scheduled-order pipeline (queue an order to fulfil 7-10 days
  before the occasion)
- Approval flow (user reviews the slate, swaps items,
  approves)
- Reminders + change-of-mind handling

**Why ★★★ readiness** (not ★★★★): the social-graph capture has
PII implications (you're storing data about non-users — the
gift recipients). NDPR + GDPR review needed before launch.

**Recommended next step**: greenlight after v1 ships AND
diaspora becomes a measurable segment. Builds on existing user
profile + addressing infrastructure.

### 16.6 AI clothing fitter (camera body-mapping)

★ readiness · ★★★ moat · L cost

**The vision**: point your phone camera at yourself, AI maps
your body proportions, then shows clothing fitted to your
actual size. Not generic S/M/L — your exact body.

**Production-readiness**: low. The good versions of this
(Bold Metrics, EyeEm, retail-grade fit-tech) require either
calibrated rooms or specific stationary poses. Phone-camera
versions exist (Wannaby, Fit:Match) but quality varies wildly
with lighting, clothing, camera quality. Promising research,
not production-grade for a Nigerian-shopper context where
lighting is variable and phones are mid-range Androids.

**Why we'd want it**: fashion is a meaningful category for us
(ankara, traditional wear, modern Afro-fusion). Fit-driven
returns are a known cost.

**Why we should defer**: it's a research project today, not a
ship-it. Building it well takes 3-6 months and the tech is
moving fast — what we build in June 2026 might be obsolete by
January 2027. Wait for a vendor to package it.

**What we can do TODAY in this category**: ask sellers to
upload size charts in a standard format. Show "customers like
you sized this way" stats on the PDP based on review data.
Cheaper, more reliable, ships in days.

**Recommended next step**: park. Revisit Q3 2027. If a
production-grade vendor emerges (a Stripe-of-fit-tech), plug
in via API rather than build in-house.

---

## Summary — what we'd actually green-light from §16

In priority order of "we'd actually build this":

1. **§16.2 Code-switching voice + text agent** — already in v1
   scope. Reframe as the brand-defining capability, not a
   side-feature. No new build needed.
2. **§16.1 WhatsApp-as-the-app** — sister workstream. Own
   tracker doc. Greenlight once Meta verification clears (it's
   blocked there today regardless).
3. **§16.3 AI seller assistant** — first follow-on after v1
   ships. Highest marketplace-wide ROI.
4. **§16.5 AI gift planning** — second follow-on. Diaspora moat.
5. **§16.4 AI return prevention** — third follow-on (needs
   accumulated data). Practical, not revolutionary.
6. **§16.6 AI clothing fitter** — park. Wait for the tech.

---
