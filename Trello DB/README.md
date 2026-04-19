# Team Board — a simpler Trello for your team

A lightweight task-tracking dashboard built to replace Trello for your team's campaign workflow. Every logged-in teammate sees every board, can create tasks, assign each other, drop comments, and watch work move through the pipeline.

## What's inside

```
Trello DB/
├── backend/      Node + Express + SQLite API (JWT auth)
└── frontend/     React + Vite dashboard
```

### Default kanban columns (seeded on every new board)

Briefing → MP WIP → MP Submitted → MP under Revision → MP Approved → LPO Received → Creatives Received → Campaign Live → POP Shared → EOC Report Shared

You can add, rename, or delete columns on any board — these are just the defaults.

## Running it

You need Node.js 18+ installed.

### 1. Backend

```bash
cd backend
cp .env.example .env        # edit JWT_SECRET to something random
npm install
npm start
```

The API will run on `http://localhost:4000`. SQLite data is stored in `backend/data.sqlite` — just back up that one file to back up everything.

### 2. Frontend

In another terminal:

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`. The Vite dev server proxies `/api` calls to the backend automatically.

## First run

1. Open the frontend.
2. Register the first account — that's your first user.
3. Create a board — it auto-seeds with the 10 default columns.
4. Invite teammates from the board header (`+ Member`) using their registered email.
5. Everyone who logs in can see every board on the dashboard.

## API reference (quick)

All routes under `/api`. Auth routes return a JWT — send it as `Authorization: Bearer <token>` on every other request.

| Method | Path | Purpose |
|---|---|---|
| POST | `/auth/register` | `{ name, email, password }` → `{ token, user }` |
| POST | `/auth/login` | `{ email, password }` → `{ token, user }` |
| GET  | `/auth/me` | Current user |
| GET  | `/users?q=` | Search/list users (for assigning) |
| GET  | `/boards` | All boards (everyone sees everything) |
| POST | `/boards` | `{ name, description }` |
| GET  | `/boards/:id` | Full board: lists, cards, assignees, labels, members |
| PATCH | `/boards/:id` | Update name/description |
| DELETE | `/boards/:id` | Delete board |
| POST | `/boards/:id/members` | `{ email }` or `{ userId }` |
| DELETE | `/boards/:id/members/:userId` | Remove member |
| POST | `/boards/:id/lists` | `{ name }` add a new column |
| PATCH | `/lists/:id` | Rename/reorder column |
| DELETE | `/lists/:id` | Delete column |
| POST | `/lists/:id/cards` | `{ title, description?, due_date?, assigneeIds?, labels? }` |
| GET  | `/cards/:id` | Full card detail |
| PATCH | `/cards/:id` | Edit title / description / due_date / **list_id** (move column) |
| DELETE | `/cards/:id` | Delete card |
| POST | `/cards/:id/assignees` | `{ userId }` |
| DELETE | `/cards/:id/assignees/:userId` | Unassign |
| POST | `/cards/:id/labels` | `{ label, color? }` |
| DELETE | `/cards/:id/labels/:labelId` | Remove label |
| GET  | `/cards/:id/comments` | Comment thread |
| POST | `/cards/:id/comments` | `{ body }` |
| DELETE | `/comments/:id` | Delete (author only) |

## Deploying

For a small team, the simplest path:

1. Put the backend on any Node host (Render, Railway, a tiny VPS). Set `JWT_SECRET` to a long random string. The SQLite file lives on the server's disk.
2. Run `npm run build` in `frontend/` — deploy the `dist/` folder to any static host (Netlify, Vercel, S3).
3. Point the frontend at your backend by setting up a `/api` proxy (or change the fetch base URL in `src/api/client.js`).

## What's deliberately left out

To keep it simpler than Trello:

- No real-time updates (refresh to see changes).
- No drag-and-drop for cards (use the "Status" dropdown inside a card to move it between columns).
- No attachments, checklists, or automations.
- No roles beyond "owner" (creator) and "member" — everyone can edit everything.

Add these only when the team actually asks for them.
