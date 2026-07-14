# Deployment Notes

This is a Vite React static app. It can be deployed to Vercel, Netlify, or any static hosting service that serves the `dist` folder.

## Build

```bash
npm install
npm run build
```

The production files will be created in `dist`.

## Preview Locally

```bash
npm run preview
```

For testing from another device on the same network:

```bash
npm run preview:host
```

## Vercel

Vercel can use `vercel.json` automatically.

- Build command: `npm run build`
- Output directory: `dist`

## Netlify

Netlify can use `netlify.toml` automatically.

- Build command: `npm run build`
- Publish directory: `dist`

## Shared Team Test Data

For a team test, connect the deployed app to Supabase. When Supabase variables are present, receipts, categories, and the receipt counter are shared across browsers.

1. Create a Supabase project.
2. Open the Supabase SQL editor.
3. Run `database/schema.sql`.
4. Add these environment variables to Vercel or Netlify:

```bash
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

5. Redeploy the app.

The app will show `Shared data connected` in the sidebar when shared storage is active.

If these variables are missing, the app falls back to browser local storage and each tester will have separate data.

## Security Note

The `shared_app_state` policies in `database/schema.sql` are for team testing only. Anyone with the deployed app URL can update shared test data. Before real production use, replace this demo sharing setup with Supabase Auth and stricter row-level security.

Demo login:

- Email: `admin@school.test`
- Password: `password123`
