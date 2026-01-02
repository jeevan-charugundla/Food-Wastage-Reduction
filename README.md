# Smart Food Redistribution System

A production-ready MVP designed to reduce food wastage in hostels and campuses by predicting attendance and efficiently redistributing surplus food to NGOs.

## Features

- **Admin Dashboard**: View attendance predictions, list surplus food, and track analytics.
- **NGO Panel**: View available food nearby, book pickups, and generate digital receipts.
- **Student Portal**: Confirm meal attendance, vote on daily meals, and view impact stats.
- **Smart Prediction**: AI-driven logic to estimate food requirements based on history and live votes.
- **Digital Receipts**: Automated PDF receipt generation for audit trails.

## Tech Stack

- **Frontend**: React, TypeScript, Tailwind CSS
- **Visualization**: Recharts
- **Icons**: Lucide React
- **PDF Generation**: jsPDF
- **Build System**: No-build setup using ES Modules (esm.sh) for rapid prototyping and easy deployment.

## Deployment

### Vercel (Recommended)
1. Fork this repository.
2. Import the project into Vercel.
3. Vercel will automatically detect the settings. The included `vercel.json` handles routing.

### Static Hosting (Netlify, GitHub Pages)
This project uses client-side routing via `HashRouter`, which works out of the box on any static hosting service.
1. Upload the files.
2. Ensure `index.html` is the entry point.

## Local Development

Since this project uses modern ES modules via CDN, you don't need `npm install` to run it locally.

1. Open the project folder.
2. Run a local server:
   ```bash
   npx serve .
   ```
3. Open `http://localhost:3000` in your browser.

## Backend Note
This MVP uses a mock database service (`services/mockDb.ts`) running in the browser's LocalStorage for demonstration purposes. For a real-world deployment, replace `services/api.ts` with calls to a real backend (Node.js/Express/PostgreSQL). See `server-implementation.md` for the reference backend code.