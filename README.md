# MindFill

Deployed on https://mind-fill.vercel.app/

A therapeutic digital coloring app designed for cognitive wellness and creative joy. Users color outline templates with a brush, eraser, or flood fill, receive optional AI-powered encouragement, and track session analytics over time.

## Features

- **Fun & Care modes** — casual coloring or a guided session with movement telemetry and real-time Gemini AI encouragement
- **Template engine** — upload any photo and convert it to a line-art coloring template via edge detection
- **Session analytics** — post-session AI analysis of metrics (activity, neglect ratio, quadrant coverage)
- **Gallery** — save, browse, and delete completed artwork stored in the cloud
- **Overview** — trend charts and stats across all sessions

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| UI | React 19, Tailwind CSS 4, Lucide React |
| AI | Google Gemini (`@google/generative-ai`) |
| Database / Storage | Supabase |
| Image Processing | Sharp, image-js |
| Language | TypeScript |

## Architecture

```
app/
├── page.tsx                  # Home — coloring canvas (fun / care mode)
├── gallery/page.tsx          # Saved artwork gallery
├── gallery/overview/page.tsx # Session stats & trend charts
└── api/
    ├── gemini/analyze/       # AI analysis of session metrics
    ├── gemini/encouragement/ # Real-time AI encouragement (care mode)
    ├── sessions/             # Persist & aggregate session data
    ├── gallery/              # CRUD for saved images
    ├── upload-template/      # Accept user photo uploads
    └── process-template/     # Edge-detect → coloring template

components/   # Canvas, ColorPicker, modals, TrendChart, Toast
lib/          # floodFill algorithm, gallery client helpers, Supabase client
```

