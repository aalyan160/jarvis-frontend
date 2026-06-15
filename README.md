# JARVIS Frontend

Next.js frontend for the JARVIS AI assistant.

## Vercel Environment Variables

Add these in Vercel under Project Settings > Environment Variables:

```env
NEXT_PUBLIC_SUPABASE_URL=https://cimfjvmaidmimnvttftz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_PfXL5IdAZg3Md92TLvelYg_eGC1TJ1R
NEXT_PUBLIC_N8N_WEBHOOK_URL=https://n8n.alyanabbas.tech/webhook/jarvis-chat
```

## Local Development

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.
