# Deploy to Render — click-by-click

This guide assumes your code is already in a GitHub repository and you've never used Render before. No installs required.

## One-time setup (≈ 5 minutes)

### 1. Push the two new files to GitHub
Before deploying, make sure these new files are in your GitHub repo:

- `render.yaml` (at the root of the repo)
- Updated `backend/src/server.js`

If you uploaded the folder before these were created, just drag the two updated files onto your repo's web page on github.com and click **Commit changes**.

### 2. Sign up for Render
Go to [render.com](https://render.com) → **Get Started for Free** → sign in with the same GitHub account you used above. That's the only login you need.

### 3. Create a Blueprint deployment
On the Render dashboard:

1. Click **New +** (top right) → **Blueprint**.
2. Under **Connect a repository**, pick your repo (e.g. `sadik/team-board`). If it's not listed, click **Configure account** to grant Render access.
3. Render reads `render.yaml` automatically. You'll see one service listed: `team-board`.
4. Click **Apply**.

### 4. Wait for first build (≈ 3–5 minutes)
Render installs Node dependencies, builds the React frontend, and starts the server. Watch the **Logs** tab — you'll see:

```
==> Build successful 🎉
==> Deploying...
==> Your service is live 🎉
```

### 5. Get your URL
Your app URL appears at the top of the service page, like:

```
https://team-board-xxxx.onrender.com
```

**That's the URL you bookmark and share with your team.** Every teammate opens that link, clicks "Create an account", and they're in.

## Known caveats of the free tier

- **Sleeps after 15 min of inactivity.** First visit after idle takes ≈ 30 seconds to wake. Any further clicks are fast.
- **Data does not persist across redeploys.** If you push new code to GitHub, the SQLite database file is reset. For a real team, you'll want to switch to a persistent database. Two easy upgrades when you're ready:
  - Add a $1.50/mo Render Disk in the service settings → SQLite data persists forever.
  - Or migrate to a free Neon Postgres (I can do this swap for you — it takes one conversation).

## Daily use

- You bookmark `https://team-board-xxxx.onrender.com`.
- Your team members open the link, register themselves, and start collaborating.
- You don't have to touch Render, GitHub, or any terminal ever again — unless you want to change something in the code.

## Making changes later

To tweak anything (add a column, change a color, fix something):

1. Open the file in your GitHub repo in the browser.
2. Click the pencil icon → edit → **Commit changes**.
3. Render auto-detects the commit and redeploys in ≈ 2 minutes.
4. Refresh your bookmark — updated app.
