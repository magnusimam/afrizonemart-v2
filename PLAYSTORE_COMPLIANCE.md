# Google Play Store Compliance

Operational reference for the Afrizonemart Android submission.
Everything here either needs to be (a) entered into Google Play
Console during the listing setup, or (b) attached as supporting
evidence. Keep this doc in sync with what's in the Console — if you
change an answer in the Console, edit this file too so future-you
doesn't re-derive everything from the chat history.

Last updated: 2026-06-05

---

## Pre-flight checklist

| Item | Status | Notes |
|---|---|---|
| Privacy Policy URL | ✅ | `https://afrizonemart.com/privacy` |
| Terms of Service URL | ✅ | `https://afrizonemart.com/terms` |
| In-app account deletion | ✅ | Mobile: Account → Profile → Danger Zone → Delete my account. Web: `/account/delete`. |
| Account deletion web URL (for listing) | ✅ | `https://afrizonemart.com/account/delete` |
| Target SDK 35 (Android 14) | ✅ | Managed Expo SDK 54 → targetSdkVersion 35 default. EAS Build produces a 35-targeting bundle. |
| Permissions justification | ✅ | See section below. |
| Content rating | ⏳ | Quiz to complete in Console. Answers below. |
| Data Safety form | ⏳ | Answers below — copy each row into the Console wizard. |
| Listing assets | ⏳ | See section. Magnus to produce / commission. |
| Signed AAB | ⏳ | EAS Build → upload to Internal testing first. |
| Google Play Developer account | ⏳ | $25 one-time fee. Magnus owns. |

---

## Data Safety form — answers

Copy each row directly into the Google Play Console Data Safety
wizard. Categories Google asks about and our exact answers:

### Data collection — Personal info

| Data type | Collected? | Shared? | Required? | Purpose |
|---|---|---|---|---|
| Name | Yes | No | Optional | Account management, communications |
| Email address | Yes | No | Yes | Account management, communications |
| User IDs | Yes | No | Yes | Account functionality |
| Address | Yes | Yes (with couriers) | Optional | Order delivery |
| Phone number | Yes | Yes (with couriers) | Optional | OTP sign-in, delivery, order updates |
| Race and ethnicity | No | — | — | — |
| Political or religious beliefs | No | — | — | — |
| Sexual orientation | No | — | — | — |
| Other personal info (birthday) | Yes | No | Optional | App functionality (loyalty birthday bonus) |

### Data collection — Financial info

| Data type | Collected? | Shared? | Required? | Purpose |
|---|---|---|---|---|
| User payment info | Yes | Yes (with Squad/Paystack) | Yes for orders | Process payments |
| Purchase history | Yes | No | Yes | Account functionality, order history |
| Credit score | No | — | — | — |
| Other financial info | No | — | — | — |

**Note**: We do NOT store card numbers — Squad/Paystack handle PCI-DSS-compliant storage. We only store a payment reference (gateway txn id) for reconciliation.

### Data collection — Health and fitness, Messages, Photos and videos, Audio files, Files and docs

**None of these are collected.**

Exception clarification: profile picture uploads (when a customer uses our self-service avatar upload) — declare under **Photos and videos > Photos**. Optional. Used only for the customer's own profile display.

### Data collection — Calendar, Contacts

**None.**

### Data collection — App activity

| Data type | Collected? | Shared? | Required? | Purpose |
|---|---|---|---|---|
| App interactions | Yes | No | No | Analytics, app functionality |
| In-app search history | Yes | No | No | Analytics, improve search |
| Installed apps | No | — | — | — |
| Other user-generated content (reviews) | Yes | No | Optional | App functionality |
| Other actions | No | — | — | — |

### Data collection — Web browsing history

**None.**

### Data collection — App info and performance

| Data type | Collected? | Shared? | Required? | Purpose |
|---|---|---|---|---|
| Crash logs | Yes | No | No | Analytics (once Sentry is wired) |
| Diagnostics | Yes | No | No | Analytics |
| Other app performance data | Yes | No | No | Analytics |

### Data collection — Device or other IDs

| Data type | Collected? | Shared? | Required? | Purpose |
|---|---|---|---|---|
| Device or other IDs | Yes | No | No | Push notifications, analytics |

### Security practices

- **Data encrypted in transit?** Yes (HTTPS everywhere)
- **Can users request data deletion?** Yes — link to `https://afrizonemart.com/account/delete`. Also from inside the mobile app.
- **Independent security review?** No (would require commissioning a third-party penetration test).
- **Committed to Play Families Policy?** Not applicable — not targeting children.

---

## Permissions — justification

Every permission the app declares needs a one-line public justification in the listing. Our permissions and answers:

### `INTERNET` + `ACCESS_NETWORK_STATE`
**Justification**: "Required to communicate with Afrizonemart servers to browse products, place orders, and receive order updates."

### `POST_NOTIFICATIONS` (Android 13+)
**Justification**: "Used to send order status updates — when your order is paid, shipped, out for delivery, and delivered. You can disable notifications from your device settings at any time."

### `CAMERA` (only if image-picker uses camera)
**Justification**: "Used when you upload a profile picture using your phone's camera. Optional — you can also pick from your gallery or skip altogether."

### `READ_EXTERNAL_STORAGE` / `READ_MEDIA_IMAGES` (image picker)
**Justification**: "Used when you upload a profile picture from your gallery. Optional."

### Auto-declared by Expo SDK
The Expo runtime declares a few additional permissions (e.g., `VIBRATE` for haptics). These are pre-justified in the standard Play Console UI by the SDK — no extra text needed.

### Permissions we explicitly DO NOT request
- Location (no map / location-based feature today)
- Contacts (no friend-finder)
- SMS read (OTP uses Twilio Verify — Google's autofill API reads the SMS, our app doesn't)
- Microphone, calendar, body sensors

---

## Content rating quiz — recommended answers

Google asks ~20 multiple-choice questions. Recommended answers:

- **Category**: Reference, news or educational? **No.** Social? **No.** Apps & Games → **Shopping app** is closest; pick the closest match.
- **Violence**: None
- **Sexual content**: None
- **Profanity**: None
- **Drugs**: None
- **Gambling**: None (no chance-based mechanics; loyalty coins are not gambling)
- **User-generated content**: Yes — product reviews. Pre-moderation? No (we have post-moderation tools). Reporting? Manual via email today; in-app reporting is a future feature.
- **Location sharing**: No
- **Personal information shared between users**: No (review author names visible — answer Yes if asked specifically about reviews)
- **Digital purchases**: Yes — physical goods bought through the app

Expected rating: **Everyone (E)** or equivalent regional rating.

---

## Listing assets — what to produce

Required for the Play Console listing:

| Asset | Spec | Status |
|---|---|---|
| App icon | 512×512 PNG | ⏳ Magnus to commission |
| Feature graphic | 1024×500 PNG | ⏳ |
| Phone screenshots | 2-8 PNG, min 320px, max 3840px, 16:9 or 9:16 | ⏳ |
| 7-inch tablet screenshots (optional) | 7" tablet device | ⏳ Optional |
| 10-inch tablet screenshots (optional) | 10" tablet device | ⏳ Optional |
| Short description | ≤80 chars | ⏳ |
| Long description | ≤4000 chars | ⏳ |
| App video (optional) | YouTube URL | ⏳ Optional |
| Promo image (legacy, no longer required) | n/a | — |

### Suggested short description (≤80 chars)

> Shop Africa-made products with fast delivery and trusted reviews.

(78 chars.)

### Suggested long description (~250 words)

> Afrizonemart is the marketplace for Africa-made products — groceries, fashion, beauty, books, and home essentials sourced from suppliers across the continent. Browse over 1,000 products from Nigeria, Kenya, South Africa, Ghana, and 50 more African countries, with prices in your local currency and reviews from buyers like you.
>
> **Why shop with us**
> • Fast checkout with Squad and Paystack — pay with card, bank transfer, USSD, or mobile money.
> • Reliable delivery with real-time tracking from Placed → Paid → Preparing → Shipped → Out for delivery → Delivered.
> • Show & Scan delivery confirmation — your phone is the receipt; the rider scans, your status flips, your coins land.
> • Continental Rewards — earn Afrizone Coins on every paid order, redeem at checkout for instant discounts.
> • Phone OTP sign-in — sign in with your phone number, no password to remember.
> • Push notifications for every order update — never wonder where your parcel is.
>
> **For your peace of mind**
> • All payments processed by PCI-compliant gateways. We never see your card.
> • Delete your account anytime from inside the app — Account → Profile → Danger Zone.
> • Privacy policy at afrizonemart.com/privacy. NDPR and GDPR compliant.
>
> Download Afrizonemart and start shopping the continent today.

---

## Submission flow

1. **Open Google Play Developer account** ($25, one-time). Use a business email tied to Afrizonemart.
2. **Create app** in Play Console → fill in default language, app name (Afrizonemart), default language, free/paid (Free).
3. **Set up Internal testing track** — upload the first AAB here. Invite 1-2 testers (Magnus + Claude-test account if you want).
4. **Complete listing details** — copy from this doc.
5. **Complete Data Safety form** — copy from this doc.
6. **Submit content rating quiz** — answers above.
7. **Build and upload** the signed AAB via EAS Build.
8. **Roll out to Internal testing** — works on testers' devices via a Play Store link within ~2 hours.
9. **Run end-to-end tests** with a real card. Capture screenshots.
10. **Promote to Closed beta → Open beta → Production** as confidence grows.

Internal → Production typically takes 1-2 weeks of beta testing for a launch like this.

---

## Open questions for Magnus (legal counsel review)

1. Privacy Policy — ideally reviewed by a Nigerian data protection lawyer before public launch. The current text describes what we actually do; the wording may need tightening for NDPR conformance.
2. Terms of Service — same review recommended. Particularly the limitation-of-liability + governing-law clauses.
3. Whether the actual registered entity is "Afrizonemart Limited" — if it's a different legal name, both docs need updating.
4. Lagos address (currently a placeholder) — must reflect the real registered business address.

None of these block initial submission — Google reviews the Privacy URL existence + Data Safety completeness, not the substantive legal accuracy of the document. But before official public launch, get legal eyes on it.
