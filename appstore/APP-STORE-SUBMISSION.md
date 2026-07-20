# Loopa — App Store Connect submission content

Everything below is ready to copy-paste into App Store Connect. Screenshots are in
`appstore/screenshots/`. See the bottom of this file for what's still manual.

---

## 1. Screenshots

| Device requirement | Folder | Resolution | Status |
|---|---|---|---|
| iPhone 6.9" (iPhone 17 Pro Max / 16 Pro Max) | `appstore/screenshots/iphone-6.9/` | 1320 × 2868 | ✅ 4 shots |
| iPad 13" (iPad Pro 13-inch M5) | `appstore/screenshots/ipad-13/` | 2064 × 2752 | ✅ 4 shots |

Apple auto-scales these to every other required size, so no other sizes are needed
(app supports tablet, so iPad screenshots are mandatory, not optional).

Shot order (same on both devices):
1. `01_daily.png` — Daily view: progress ring, grouped recurring/one-off tasks
2. `02_manage.png` — Manage Tasks: category-grouped routine list
3. `03_taskform.png` — Add Task: recurring/one-off toggle + category chips
4. `04_calendar.png` — Expanded month calendar picker

Captured from a real signed-in account with representative data (categories:
Morning Routine, Work, Health, Home; a mix of recurring + one-off tasks; 50%
day progress) — not empty states.

---

## 2. App name & subtitle

**Name** (30 char max): `Loopa`

**Subtitle** (30 char max, shown under the name in search/product page):
`Routines, done your way`

---

## 3. Promotional text (170 char max — editable anytime without a new review)

```
A daily planner that separates your real routine from one-off to-dos, groups everything by category, and shows your progress at a glance.
```
(159 chars)

---

## 4. Description (4000 char max)

```
Most to-do apps make you choose between "simple" and "actually useful." Loopa doesn't.

It separates the two kinds of things that live on a real daily list — the routine you repeat every day, and the one-off thing you just need to remember today — instead of dumping both into one undifferentiated pile that gets messier the longer you use the app.

RECURRING VS. JUST FOR TODAY
Recurring tasks are your actual routine — they show up on your list every day until you archive them. One-off tasks are scheduled for a single day and disappear after, for the things that don't belong in your routine but still need doing today.

COLOR-CODED CATEGORIES, NO EXCEPTIONS
Every task belongs to a category — there's no junk-drawer "uncategorized" pile to ignore. Create one with a name and a color in seconds, and both your daily view and your task list group everything by it automatically, so your day reads at a glance instead of as a wall of text.

A DAILY VIEW THAT RESPECTS YOUR TIME
A week-strip date picker expands into a full month calendar with one tap, so you can jump to any day directly instead of paging through arrows. A live progress ring shows how much of the day is done without counting, and pull-to-refresh keeps things current.

REAL ACCOUNTS, NOT A SHARED NOTEPAD
Email/password sign-in, your session token held in the device's secure storage, and every request scoped to your account on the server. Your data is yours — nobody else's account can ever see it.

DESIGNED LIKE SOMETHING YOU'D PAY FOR
A custom icon, splash screen, and design system — not the default framework look — with full light and dark mode that follows your system setting.

Loopa is a small, focused app that does one thing well: it helps you tell the difference between what you do every day and what you just need to remember today, and it never lets either one get lost in a pile.
```
(1,777 chars — well under the 4000 limit, room to expand later)

---

## 5. Keywords (100 char max, comma-separated, no spaces after commas to save room)

```
todo,tasks,daily planner,routine,habit,checklist,productivity,schedule,organizer,to-do list
```
(93 chars)

Don't repeat words already in the app name/subtitle ("Loopa", "routine") — Apple
indexes those automatically, so this list is tuned to add *new* search terms.

---

## 6. Category

- **Primary:** Productivity
- **Secondary (optional):** Lifestyle

---

## 7. Support URL & Privacy Policy URL

Both are now served directly from the existing backend (`backend/src/index.ts` +
`backend/public/`), reusing `api.loopa.codewithxjohn.com` — no new hosting needed.

- **Support URL:** `https://api.loopa.codewithxjohn.com/support`
- **Privacy Policy URL:** `https://api.loopa.codewithxjohn.com/privacy`
- **Marketing URL (optional):** leave blank, or use the GitHub repo if you want one public

⚠️ **These routes aren't live yet** — the backend code change is committed locally
but hasn't been deployed. Push to `main` and let the CI/CD pipeline (with its
manual approval gate) roll it out before submitting, or App Review will 404 on
both URLs.

---

## 8. Copyright

```
© 2026 John Rocha
```

---

## 9. Age rating questionnaire

Answer **None / No** to every content descriptor (violence, mature themes, gambling,
horror, alcohol/tobacco/drugs, unrestricted web access, etc.) and **No** to
user-generated content being shared with other users (tasks are private per-account,
never visible to anyone else). This resolves to **4+**.

---

## 10. App Privacy — "nutrition label" (Data collection) answers

Loopa has no analytics, no ads, no crash reporting SDK, and no third-party trackers —
`mobile/package.json` only pulls in Expo/React Navigation/Redux, nothing else. The
answers below reflect exactly what the app collects, per `backend/src/routes/`.

**Data collected — linked to the user, used for App Functionality only, never for tracking:**

| Data type | Category | Purpose | Linked to user? | Used for tracking? |
|---|---|---|---|---|
| Email Address | Contact Info | App Functionality (account/auth) | Yes | No |
| Other User Content (tasks, categories) | User Content | App Functionality (core feature) | Yes | No |

**Everything else: mark "Data Not Collected"** — Location, Contacts, Health &
Fitness, Financial Info, Browsing/Search History, Identifiers, Usage Data,
Diagnostics, Photos/Videos/Audio, Purchases. Loopa's `infoPlist` requests no
device permissions, so this matches reality.

**"Data Used to Track You":** None — answer "No" when asked if you or third-party
partners track users across apps/websites.

---

## Still manual (needs your Apple Developer / App Store Connect access)

1. Deploy the `/privacy` and `/support` backend routes (see §7 above).
2. Upload the 8 screenshots from `appstore/screenshots/` to the corresponding
   device-size slots in App Store Connect → your app → App Store tab. Make sure
   the 1320×2868 shots go in the **6.9" Display** slot specifically — App Store
   Connect also shows a legacy 6.5"/6.7" slot that expects older sizes
   (1242×2688 / 1284×2778) and will reject the 6.9" files if dropped there.
3. Paste in the copy from sections 2–6 above.
4. Fill in the Age Rating questionnaire (§9) and the App Privacy questions (§10)
   in App Store Connect's web UI — these aren't settable from a config file.
5. ✅ App Review sign-in account created and seeded with representative data
   (matches the screenshots). Credentials are in `appstore/REVIEW-CREDENTIALS.local.md`
   (gitignored, not in this doc since the repo is public) — paste them into
   **App Review Information → Sign-In Information** and toggle "Sign-in required" on.
6. Confirm the build you want reviewed is already uploaded via EAS Submit
   (per `LOOPA-BUILD-GUIDE.md`), then attach it to this version and submit for review.
