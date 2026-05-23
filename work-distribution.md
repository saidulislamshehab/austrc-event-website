# ARC Event Website — Work Distribution

## What's Already Done (by Director)

- Deployed the project
- Auth system (signup, login, Google OAuth, NextAuth)
- Admin route protection (email verification, role check)
- Database schema (Prisma + PostgreSQL on Neon)
- Seed script for initial dummy data

## What's Left

The admin panel shows fake hardcoded data. Buttons don't work. Nothing saves to the database.
Public pages also show fake data. They don't read from the database.

We need to build the full data pipeline:

```
Admin Panel → API Routes → Database → Public Pages
```

## Important Rule: Keep Dummy Data

> **DO NOT remove any existing hardcoded/dummy data from any file.**
>
> Instead, use a "dual-source" pattern:
> - Every page tries to fetch from the database first
> - If the database is empty, it falls back to the existing hardcoded dummy data
> - This way the site always looks populated, even without real data
>
> When admin adds real data through the admin panel, it saves to the database,
> and the public page will show the real data instead of the dummy data.

```
Page loads → Fetch from DB → Got data? → Show DB data
                              ↓ No
                         Show existing hardcoded dummy data
```

---

## Team Structure

```
                        Director (You)
                   Code Review + Testing
                   Final Approval
                          |
            ┌─────────────┼─────────────┐
            │                           │
          AD 1                        AD 2
     Backend Expert              Frontend Expert
  Cross-team backend work    Cross-team frontend work
  API design consistency     UI/UX consistency
  Security review            Upload system design
            │                           │
    ┌───────┼───────┐                   │
    │       │       │                   │
  Team 1  Team 2  Team 3         Helps all teams
```

### Director (You)

- Final code review on all pull requests
- Testing all features before merge
- Final approval before release
- Already completed: auth, admin protection, deployment, UI

### AD 1 — Backend Expert

- Make sure all API routes follow the same pattern (see "Shared API Pattern" below)
- Help teams when they get stuck on Prisma queries
- Review all Zod validation schemas across teams
- Make sure every admin API checks admin session
- Handle cross-team backend problems
- Security review (no secrets in frontend, proper validation)
- Review the admin-guard helper and make sure it's used everywhere

### AD 2 — Frontend Expert

- Make sure all admin forms look and behave the same way
- Make sure the dual-source fallback pattern is used correctly in every page
- Handle cross-team frontend problems
- Make sure loading states (Skeleton) and error messages (Sonner toast) are consistent
- Help connect public pages to database using the server-component prop-passing pattern
- Future: Design the image upload flow (not in current scope)

---

## Tech Decisions (Everyone Must Know)

| What | Decision | Why |
|------|----------|-----|
| Admin API protection | `requireAdmin()` helper using `getServerSession` | Consistent, reusable |
| Input validation | Zod schemas in `src/lib/validations/` | Already using Zod for auth |
| Admin forms | Shadcn `Dialog` + `Input` + `Select` + `Textarea` | Already installed, 48 UI components available |
| Toast messages | `sonner` (`toast.success()`, `toast.error()`) | Already installed |
| Delete confirmation | Shadcn `AlertDialog` | Already installed |
| Loading states | Shadcn `Skeleton` | Already installed |
| Public page data | Server component → Prisma query → pass as prop to client component | Fast, good for SEO |
| Admin page data | Client-side `fetch()` to API routes | Admin pages are already `"use client"` |
| Fallback data | Keep existing hardcoded arrays, use when DB is empty | Site always looks populated |

---

## Team 1 — Event Core (Segments + Schedule)

> This team owns everything about Segments and Schedule.
> When admin creates a segment or schedule item, it saves to the database.
> Public pages show DB data, or fall back to dummy data if DB is empty.

### Members

| Role | Person |
|------|--------|
| Team Lead + Developer | Deputy 1 |
| Senior Developer | SSE 1 |
| Senior Developer | SSE 2 |
| Developer | SE 1 |

### Features Owned

- Segment CRUD (create, read, update, delete)
- Schedule CRUD (create, read, update, delete)
- Admin Segment page → connected to database
- Admin Schedule page → connected to database
- Public Segment page → reads from database (fallback to dummy)
- Public Schedule page → reads from database (fallback to dummy)
- Event Details page → reads from database (fallback to dummy)

---

### Deputy 1 (Team Lead)

**Main job: Segment API + Admin Segment page**

#### Step 1: Build Segment Validation Schema

Create `src/lib/validations/segment.ts`:

```typescript
import { z } from "zod";

export const segmentSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().min(1, "Description is required"),
  rules: z.string().min(1, "Rules are required"),
  prizePool: z.string().min(1, "Prize pool is required"),
  status: z.enum(["active", "inactive"]).default("active"),
  imageUrl: z.string().url().optional().nullable(),
});
```

#### Step 2: Build Segment API Routes

Create `src/app/api/admin/segments/route.ts`:
- `GET` — Return all segments (include inactive ones for admin)
- `POST` — Create new segment (validate with segmentSchema, check admin session)

Create `src/app/api/admin/segments/[id]/route.ts`:
- `GET` — Return one segment by ID
- `PUT` — Update a segment
- `DELETE` — Delete a segment

Create `src/app/api/public/segments/route.ts`:
- `GET` — Return segments where `status = "active"` (no auth needed)

#### Step 3: Connect Admin Segment Page

Edit `src/components/pages/admin/AdminSegmentsPage.tsx`:
- **Keep** the existing `segmentsData` array — rename it to `FALLBACK_SEGMENTS`
- Add `useState` for segments list, loading, and selected segment
- Add `useEffect` to fetch from `/api/admin/segments`
- If API returns data → use it. If empty → use `FALLBACK_SEGMENTS`
- Add a `<Dialog>` for create/edit form (name, description, rules, prizePool, status, imageUrl)
- Wire "Create Segment" button → opens dialog in create mode
- Wire edit icon → opens dialog in edit mode with pre-filled data
- Wire delete icon → opens `<AlertDialog>` → calls DELETE API
- After any create/edit/delete → re-fetch the list
- Show `<Skeleton>` while loading
- Show `toast.success()` or `toast.error()` from sonner

**Files Deputy 1 creates/edits:**
- Create: `src/lib/validations/segment.ts`
- Create: `src/app/api/admin/segments/route.ts`
- Create: `src/app/api/admin/segments/[id]/route.ts`
- Create: `src/app/api/public/segments/route.ts`
- Edit: `src/components/pages/admin/AdminSegmentsPage.tsx`

---

### SSE 1

**Main job: Schedule API + Admin Schedule page**

#### Step 1: Build Schedule Validation Schema

Create `src/lib/validations/schedule.ts`:

```typescript
import { z } from "zod";

export const scheduleSchema = z.object({
  segmentId: z.number().int().optional().nullable(),
  title: z.string().min(1, "Title is required"),
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  venue: z.string().min(1, "Venue is required"),
  displayOrder: z.number().int().default(0),
});
```

#### Step 2: Build Schedule API Routes

Create `src/app/api/admin/schedule/route.ts`:
- `GET` — Return all schedule items with related segment info (`include: { segment: true }`)
- `POST` — Create new schedule item

Create `src/app/api/admin/schedule/[id]/route.ts`:
- `PUT` — Update a schedule item
- `DELETE` — Delete a schedule item

Create `src/app/api/public/schedule/route.ts`:
- `GET` — Return all schedule items ordered by `startTime`, include segment name

#### Step 3: Connect Admin Schedule Page

Edit `src/components/pages/admin/AdminSchedulePage.tsx`:
- **Keep** existing `scheduleData` array — rename to `FALLBACK_SCHEDULE`
- Fetch from `/api/admin/schedule`, fallback to `FALLBACK_SCHEDULE`
- Add create/edit `<Dialog>` with fields: title, startTime, endTime, venue, segmentId (dropdown), displayOrder
- Fetch segment list from `/api/admin/segments` for the segment dropdown
- Wire all add/edit/delete buttons
- Group fetched items by date (keep the existing day-group UI)
- Show loading and toast messages

**Files SSE 1 creates/edits:**
- Create: `src/lib/validations/schedule.ts`
- Create: `src/app/api/admin/schedule/route.ts`
- Create: `src/app/api/admin/schedule/[id]/route.ts`
- Create: `src/app/api/public/schedule/route.ts`
- Edit: `src/components/pages/admin/AdminSchedulePage.tsx`

---

### SSE 2

**Main job: Connect public pages to database**

> SSE 2 waits for Deputy 1 and SSE 1 to finish the APIs first,
> then connects the public-facing pages to the database.

#### Pattern to Follow

Public pages use server components to fetch data and pass it as props:

```typescript
// src/app/(public)/segments/page.tsx (server component)
import { prisma } from "@/lib/prisma";
import SegmentsPage from "@/components/pages/SegmentsPage";

export default async function Page() {
  const segments = await prisma.segment.findMany({
    where: { status: "active" },
    orderBy: { id: "asc" },
  });
  return <SegmentsPage dbSegments={segments} />;
}
```

Then in the client component, accept the prop and use it with fallback:

```typescript
// Inside SegmentsPage.tsx
export default function SegmentsPage({ dbSegments }: { dbSegments?: any[] }) {
  // Use DB data if available, otherwise use existing hardcoded array
  const segments = dbSegments && dbSegments.length > 0
    ? dbSegments.map(s => ({ /* map DB fields to UI format */ }))
    : allSegments; // existing hardcoded data stays as fallback

  // ... rest of the component unchanged
}
```

#### Tasks

1. Edit `src/app/(public)/segments/page.tsx` — add Prisma fetch, pass as prop
2. Edit `src/components/pages/SegmentsPage.tsx` — accept `dbSegments` prop, use with fallback
3. Edit `src/app/(public)/schedule/page.tsx` — add Prisma fetch, pass as prop
4. Edit `src/components/pages/SchedulePage.tsx` — accept `dbSchedule` prop, use with fallback
5. Edit `src/app/(public)/event/[id]/page.tsx` — fetch segment by ID from Prisma
6. Edit `src/components/pages/EventDetailsPage.tsx` — accept `dbSegment` prop, fallback to hardcoded `eventData`

**Files SSE 2 edits:**
- Edit: `src/app/(public)/segments/page.tsx`
- Edit: `src/components/pages/SegmentsPage.tsx`
- Edit: `src/app/(public)/schedule/page.tsx`
- Edit: `src/components/pages/SchedulePage.tsx`
- Edit: `src/app/(public)/event/[id]/page.tsx`
- Edit: `src/components/pages/EventDetailsPage.tsx`

---

### SE 1

**Main job: Shared infrastructure that all teams need**

> SE 1 works on this FIRST, before other team members start.
> Everyone depends on these utilities.

#### Task 1: Admin Guard Helper

Create `src/lib/admin-guard.ts`:

```typescript
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session || session.user?.role !== "admin") {
    return null;
  }
  return session;
}
```

All admin API routes will use this:
```typescript
const session = await requireAdmin();
if (!session) {
  return NextResponse.json({ message: "Not authorized" }, { status: 401 });
}
```

#### Task 2: Admin API Client Helper

Create `src/lib/admin-api.ts`:

```typescript
import { toast } from "sonner";

export async function adminFetch<T = any>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    const message = data.message || "Something went wrong";
    toast.error(message);
    throw new Error(message);
  }
  return res.json();
}
```

All admin pages will use this to call APIs.

#### Task 3: Auth validation schema already exists

Check `src/lib/validations/auth.ts` — it already exists. Good, no changes needed.

**Files SE 1 creates:**
- Create: `src/lib/admin-guard.ts`
- Create: `src/lib/admin-api.ts`

---

## Team 2 — Content & Media (FAQ + Sponsors)

> This team owns FAQ and Sponsors.
> When admin adds a FAQ or sponsor, it saves to the database.
> Public pages show DB data, or fall back to dummy data if DB is empty.

### Members

| Role | Person |
|------|--------|
| Team Lead + Developer | Deputy 2 |
| Senior Developer | SSE 3 |
| Developer | SE 2 |

### Features Owned

- FAQ CRUD (create, read, update, delete)
- Sponsor CRUD (create, read, update, delete)
- Admin Content page (FAQ tab + Sponsors tab) → connected to database
- Public FAQ page + FAQ homepage section → reads from database (fallback to dummy)
- Public Sponsors page + Sponsors homepage section → reads from database (fallback to dummy)

---

### Deputy 2 (Team Lead)

**Main job: Sponsor API + Sponsors tab in Admin Content page**

#### Step 1: Build Sponsor Validation Schema

Create `src/lib/validations/sponsor.ts`:

```typescript
import { z } from "zod";

export const sponsorSchema = z.object({
  name: z.string().min(1, "Name is required"),
  logoUrl: z.string().min(1, "Logo URL is required"),
  tier: z.enum(["gold", "silver", "bronze"]),
  websiteUrl: z.string().url().optional().nullable(),
  displayOrder: z.number().int().default(0),
});
```

#### Step 2: Build Sponsor API Routes

Create `src/app/api/admin/sponsors/route.ts`:
- `GET` — Return all sponsors ordered by displayOrder
- `POST` — Create new sponsor

Create `src/app/api/admin/sponsors/[id]/route.ts`:
- `PUT` — Update a sponsor
- `DELETE` — Delete a sponsor

Create `src/app/api/public/sponsors/route.ts`:
- `GET` — Return all sponsors grouped by tier, ordered by displayOrder

#### Step 3: Connect Sponsors Tab in Admin Content Page

Edit `src/components/pages/admin/AdminContentPage.tsx` (Sponsors tab only):
- **Keep** existing `sponsorsData` array — rename to `FALLBACK_SPONSORS`
- Fetch from `/api/admin/sponsors`, fallback to `FALLBACK_SPONSORS`
- Add create/edit `<Dialog>` (name, logoUrl, tier, websiteUrl, displayOrder)
- Wire edit/delete buttons
- Show loading and toast

**Files Deputy 2 creates/edits:**
- Create: `src/lib/validations/sponsor.ts`
- Create: `src/app/api/admin/sponsors/route.ts`
- Create: `src/app/api/admin/sponsors/[id]/route.ts`
- Create: `src/app/api/public/sponsors/route.ts`
- Edit: `src/components/pages/admin/AdminContentPage.tsx` (sponsors tab only)

---

### SSE 3

**Main job: FAQ API + FAQ tab in Admin Content page + Public pages**

#### Step 1: Build FAQ Validation Schema

Create `src/lib/validations/faq.ts`:

```typescript
import { z } from "zod";

export const faqSchema = z.object({
  question: z.string().min(1, "Question is required"),
  answer: z.string().min(1, "Answer is required"),
  displayOrder: z.number().int().default(0),
});
```

#### Step 2: Build FAQ API Routes

Create `src/app/api/admin/faq/route.ts`:
- `GET` — Return all FAQs ordered by displayOrder
- `POST` — Create new FAQ

Create `src/app/api/admin/faq/[id]/route.ts`:
- `PUT` — Update a FAQ
- `DELETE` — Delete a FAQ

Create `src/app/api/public/faq/route.ts`:
- `GET` — Return all FAQs ordered by displayOrder

#### Step 3: Connect FAQ Tab in Admin Content Page

Edit `src/components/pages/admin/AdminContentPage.tsx` (FAQ tab only):
- **Keep** existing `faqData` — rename to `FALLBACK_FAQ`
- Fetch from `/api/admin/faq`, fallback to `FALLBACK_FAQ`
- Add create/edit `<Dialog>` (question, answer, displayOrder)
- Wire edit/delete buttons

#### Step 4: Connect Public Pages to Database

Edit public pages to fetch from DB with fallback:

- Edit `src/app/(public)/faq/page.tsx` — fetch FAQs from Prisma, pass as prop
- Edit `src/components/pages/FAQPage.tsx` — accept `dbFaqs` prop
- Edit `src/components/FAQ.tsx` — accept `faqs` prop (use DB data or hardcoded fallback)
- Edit `src/app/(public)/sponsors/page.tsx` — fetch sponsors from Prisma, pass as prop
- Edit `src/components/pages/SponsorsPage.tsx` — accept `dbSponsors` prop
- Edit `src/components/Sponsors.tsx` — accept `sponsors` prop (use DB data or hardcoded fallback)

**Files SSE 3 creates/edits:**
- Create: `src/lib/validations/faq.ts`
- Create: `src/app/api/admin/faq/route.ts`
- Create: `src/app/api/admin/faq/[id]/route.ts`
- Create: `src/app/api/public/faq/route.ts`
- Edit: `src/components/pages/admin/AdminContentPage.tsx` (FAQ tab only)
- Edit: `src/app/(public)/faq/page.tsx`
- Edit: `src/components/pages/FAQPage.tsx`
- Edit: `src/components/FAQ.tsx`
- Edit: `src/app/(public)/sponsors/page.tsx`
- Edit: `src/components/pages/SponsorsPage.tsx`
- Edit: `src/components/Sponsors.tsx`

---

### SE 2

**Main job: Past Events + Announcements tab**

#### Tasks

1. Create a simple Past Events API:
   - Create `src/app/api/admin/past-events/route.ts` (GET, POST)
   - Create `src/app/api/admin/past-events/[id]/route.ts` (PUT, DELETE)
   - Create `src/app/api/public/past-events/route.ts` (GET)
   - Create `src/lib/validations/past-event.ts`

2. Connect Past Events public page:
   - Edit `src/app/(public)/past-events/page.tsx` — fetch from Prisma
   - Edit `src/components/pages/PastEventsPage.tsx` — accept prop, fallback to dummy

3. Build the Announcements tab in AdminContentPage (if time allows):
   - Currently shows "No Active Announcements"
   - Simple create/edit for homepage banners

**Files SE 2 creates/edits:**
- Create: `src/lib/validations/past-event.ts`
- Create: `src/app/api/admin/past-events/route.ts`
- Create: `src/app/api/admin/past-events/[id]/route.ts`
- Create: `src/app/api/public/past-events/route.ts`
- Edit: `src/app/(public)/past-events/page.tsx`
- Edit: `src/components/pages/PastEventsPage.tsx`
- Edit: `src/components/pages/admin/AdminContentPage.tsx` (announcements tab only)

---

## Team 3 — Users, Registration & Dashboard

> This team owns user management, the registration flow, and dashboards.
> Admin can see and manage users. Dashboard shows real stats.
> Settings can be saved to the database.

### Members

| Role | Person |
|------|--------|
| Team Lead + Developer | Deputy 3 |
| Senior Developer | SSE 4 |
| Developer | SE 3 |

### Features Owned

- Admin Users page → connected to database
- Admin Dashboard → real stats from database
- Admin Settings → connected to database
- Registration flow (form → DB)
- User Dashboard → real data (future scope, lower priority)

---

### Deputy 3 (Team Lead)

**Main job: Admin Users page + Registration API**

#### Step 1: Build Users API

Create `src/app/api/admin/users/route.ts`:
- `GET` — Return all users with their registrations and segments
  ```typescript
  const users = await prisma.user.findMany({
    include: { registrations: { include: { segment: true } } },
    orderBy: { createdAt: "desc" },
  });
  ```

Create `src/app/api/admin/users/[id]/route.ts`:
- `PUT` — Update user role or status

#### Step 2: Build Registration API

Create `src/app/api/register/route.ts`:
- `POST` — Create a Registration record
  - Check user is logged in
  - Validate segment exists
  - Generate QR token using `crypto.randomUUID()`
  - Default status: "pending", paymentStatus: "unpaid"

Create `src/app/api/admin/registrations/route.ts`:
- `GET` — List all registrations with user and segment info

Create `src/app/api/admin/registrations/[id]/route.ts`:
- `PUT` — Approve or reject a registration

#### Step 3: Connect Admin Users Page

Edit `src/components/pages/admin/AdminUsersPage.tsx`:
- **Keep** existing `mockUsers` — rename to `FALLBACK_USERS`
- Fetch from `/api/admin/users`, fallback to `FALLBACK_USERS`
- Search and filter work on the fetched data (already filters locally)
- Add approve/reject actions for pending registrations

#### Step 4: Connect Registration Page

Edit `src/components/pages/RegisterPage.tsx`:
- **Keep** existing form structure
- Replace `console.log()` and `alert()` with actual API call
- On submit → `POST /api/register`
- Fetch segment list from `/api/public/segments` for the dropdown (replace hardcoded `segments` array)
- Show `toast.success()` on success, `toast.error()` on failure

**Files Deputy 3 creates/edits:**
- Create: `src/app/api/admin/users/route.ts`
- Create: `src/app/api/admin/users/[id]/route.ts`
- Create: `src/app/api/register/route.ts`
- Create: `src/app/api/admin/registrations/route.ts`
- Create: `src/app/api/admin/registrations/[id]/route.ts`
- Create: `src/lib/validations/registration.ts`
- Edit: `src/components/pages/admin/AdminUsersPage.tsx`
- Edit: `src/components/pages/RegisterPage.tsx`

---

### SSE 4

**Main job: Admin Dashboard + Admin Settings**

#### Task 1: Dashboard Stats API

Create `src/app/api/admin/dashboard/route.ts`:
- `GET` — Return aggregated stats:
  ```typescript
  const totalUsers = await prisma.user.count();
  const totalRegistrations = await prisma.registration.count();
  const pendingRegistrations = await prisma.registration.count({ where: { status: "pending" } });
  const activeSegments = await prisma.segment.count({ where: { status: "active" } });
  // Registration trends: group by day for the chart
  ```

#### Task 2: Connect Admin Dashboard Page

Edit `src/components/pages/admin/AdminDashboardPage.tsx`:
- **Keep** existing hardcoded stats and `data` array as fallback
- Fetch from `/api/admin/dashboard`
- If API returns data → use for stats cards and chart
- If empty → use existing hardcoded values
- Recent activity: show latest registrations from API data

#### Task 3: Settings API

Create `src/app/api/admin/settings/route.ts`:
- `GET` — Return all settings as key-value pairs
- `PUT` — Bulk upsert settings

#### Task 4: Connect Admin Settings Page

Edit `src/components/pages/admin/AdminSettingsPage.tsx`:
- **Keep** existing settings UI structure
- Fetch from `/api/admin/settings` on mount
- Merge API values with the UI (use DB value if exists, otherwise show default)
- Wire "Save Changes" button → `PUT /api/admin/settings`
- Show toast on success/error

**Files SSE 4 creates/edits:**
- Create: `src/app/api/admin/dashboard/route.ts`
- Create: `src/app/api/admin/settings/route.ts`
- Edit: `src/components/pages/admin/AdminDashboardPage.tsx`
- Edit: `src/components/pages/admin/AdminSettingsPage.tsx`

---

### SE 3

**Main job: User-facing pages (lower priority, do after other tasks)**

> These are lower priority. Do them if time allows.
> The user dashboard, profile, QR pass, etc. can stay with dummy data for now.
> Focus on helping Deputy 3 and SSE 4 first.

#### Tasks (if time allows)

1. Connect user profile page to session data (show real name instead of hardcoded)
2. Connect user dashboard to show real registered segments
3. Connect QR pass page to show real QR codes from registrations
4. Help test the registration flow end-to-end

**Files SE 3 might edit (lower priority):**
- Edit: `src/components/pages/DashboardPage.tsx`
- Edit: `src/components/pages/ProfilePage.tsx`
- Edit: `src/components/pages/QRPassPage.tsx`

---

## Shared API Pattern (Everyone Must Follow)

Every admin API route MUST follow this exact pattern:

```typescript
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-guard";

export async function GET() {
  // Step 1: Check admin session
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ message: "Not authorized" }, { status: 401 });
  }

  // Step 2: Fetch from database
  const items = await prisma.yourModel.findMany({
    orderBy: { id: "asc" },
  });

  // Step 3: Return response
  return NextResponse.json(items);
}

export async function POST(request: Request) {
  // Step 1: Check admin session
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ message: "Not authorized" }, { status: 401 });
  }

  // Step 2: Parse and validate
  const body = await request.json();
  const parsed = yourZodSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { message: parsed.error.errors[0].message },
      { status: 400 }
    );
  }

  // Step 3: Save to database
  const item = await prisma.yourModel.create({ data: parsed.data });

  // Step 4: Return success
  return NextResponse.json(item, { status: 201 });
}
```

For public APIs → skip the `requireAdmin()` check, just query and return.

For user APIs → check that user is logged in (any role), only return their own data.

---

## Shared Admin Page Pattern (Everyone Must Follow)

Every admin page that shows data MUST follow this pattern:

```typescript
"use client";
import { useEffect, useState } from "react";
import { adminFetch } from "@/lib/admin-api";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader,
  AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";

// Keep existing dummy data as fallback
const FALLBACK_DATA = [ /* existing hardcoded array stays here */ ];

export default function AdminSomePage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  // Fetch data
  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await adminFetch("/api/admin/something");
      setItems(data.length > 0 ? data : FALLBACK_DATA);
    } catch {
      setItems(FALLBACK_DATA);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // Create
  const handleCreate = async (formData: any) => {
    await adminFetch("/api/admin/something", {
      method: "POST",
      body: JSON.stringify(formData),
    });
    toast.success("Created successfully");
    setDialogOpen(false);
    fetchData(); // re-fetch
  };

  // Edit
  const handleEdit = async (formData: any) => {
    await adminFetch(`/api/admin/something/${editingItem.id}`, {
      method: "PUT",
      body: JSON.stringify(formData),
    });
    toast.success("Updated successfully");
    setEditingItem(null);
    fetchData();
  };

  // Delete
  const handleDelete = async () => {
    await adminFetch(`/api/admin/something/${deleteId}`, {
      method: "DELETE",
    });
    toast.success("Deleted successfully");
    setDeleteId(null);
    fetchData();
  };

  // ... render with loading skeleton, data list, modals
}
```

---

## Work Execution Order

> SE 1 goes first. Then everyone else starts in parallel.

### Day 1 (SE 1 starts first)

| Who | What |
|-----|------|
| SE 1 | Create `admin-guard.ts` and `admin-api.ts` (shared infra) |
| Everyone else | Read this document, understand the patterns |

### Day 1-3 (APIs + Validation Schemas)

| Who | What |
|-----|------|
| Deputy 1 | Segment validation + Segment API (3 route files) |
| SSE 1 | Schedule validation + Schedule API (3 route files) |
| Deputy 2 | Sponsor validation + Sponsor API (3 route files) |
| SSE 3 | FAQ validation + FAQ API (3 route files) |
| Deputy 3 | Registration API + Users API (5 route files) |
| SSE 4 | Dashboard stats API + Settings API (2 route files) |
| SE 2 | Past Events validation + API (3 route files) |

### Day 3-5 (Admin Page Connections)

| Who | What |
|-----|------|
| Deputy 1 | Admin Segments page → fetch + create/edit/delete modals |
| SSE 1 | Admin Schedule page → fetch + create/edit/delete modals |
| Deputy 2 | Admin Content page → Sponsors tab with modals |
| SSE 3 | Admin Content page → FAQ tab with modals |
| Deputy 3 | Admin Users page → fetch + approve/reject actions |
| SSE 4 | Admin Dashboard → real stats + Admin Settings → save |
| SE 2 | Admin Content page → Announcements tab |

### Day 5-7 (Public Page Connections)

| Who | What |
|-----|------|
| SSE 2 | Public Segments + Schedule + Event Details pages |
| SSE 3 | Public FAQ + Sponsors pages + homepage components |
| SE 2 | Public Past Events page |
| Deputy 3 | Registration page → connect form to API |

### Day 7-8 (Polish + Review)

| Who | What |
|-----|------|
| All Deputies | Review their team's work, fix bugs |
| AD 1 | Review all API routes for consistency and security |
| AD 2 | Review all frontend forms for consistency |

### Day 9-10 (Testing)

| Who | What |
|-----|------|
| Director | Test every feature, find bugs |
| Everyone | Fix bugs found by Director |

---

## Work Rules

### Branching

- Every feature goes in a separate branch
- Branch format: `feature/team1-segment-api`, `feature/team2-faq-admin`, etc.
- Every PR needs Director's review before merge

### Code Rules

- **Never remove existing dummy data** — rename it to `FALLBACK_*` and use as fallback
- All API inputs validated with Zod
- All admin APIs use `requireAdmin()` from `admin-guard.ts`
- All admin pages use `adminFetch()` from `admin-api.ts`
- All admin forms use Shadcn `Dialog`
- All delete flows use Shadcn `AlertDialog`
- All loading states use Shadcn `Skeleton`
- All success/error messages use `sonner` toast
- Keep existing design style (dark theme, green accent `#588157`)

### Communication

- Each Deputy reports daily to Director
- If stuck for more than 2 hours → ask your AD
- If two teams need to coordinate → ADs handle it
- Design decisions → Director decides

---

## Done Checklist

### Admin Panel (data saves to database)
- [ ] Admin can create, edit, and delete segments → saved in DB
- [ ] Admin can create, edit, and delete schedule items → saved in DB
- [ ] Admin can create, edit, and delete FAQs → saved in DB
- [ ] Admin can create, edit, and delete sponsors → saved in DB
- [ ] Admin dashboard shows real stats from DB (with fallback)
- [ ] Admin settings can be saved to DB
- [ ] Admin can see real users from DB

### Public Pages (reads from database, falls back to dummy)
- [ ] Segments page shows DB data (or dummy fallback)
- [ ] Schedule page shows DB data (or dummy fallback)
- [ ] FAQ page shows DB data (or dummy fallback)
- [ ] Sponsors page shows DB data (or dummy fallback)
- [ ] Event details page shows DB data (or dummy fallback)

### Registration
- [ ] Registration form saves to database (not console.log)
- [ ] QR token is generated on registration

### Quality
- [ ] All admin APIs return 401 for non-admin users
- [ ] All inputs are validated (bad data gets rejected with clear error)
- [ ] Loading skeletons show while data loads
- [ ] Toast messages show on success and error
- [ ] Existing dummy data still shows when DB is empty
- [ ] Production build passes without errors

### NOT in scope (for later)
- [ ] Image upload (admin will type URLs manually for now)
- [ ] User dashboard with real data
- [ ] User profile editing
- [ ] QR pass page
- [ ] Certificates page
- [ ] Leaderboard
- [ ] Vercel deployment optimization
