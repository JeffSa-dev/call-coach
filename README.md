# Call Coach AI

An AI-powered sales coaching platform built with Next.js, Supabase, and Claude AI.

## Features

- Sales call analysis
- Real-time AI coaching feedback
- Conversation history
- Supabase data persistence

## Getting Started

1. Clone the repository
2. Install dependencies:
```bash
npm install
```

3. Install Chakra UI and its dependencies:
```bash
npm install @chakra-ui/react @emotion/react @emotion/styled framer-motion
```

4. Set up environment variables in `.env.local`:
```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
ANTHROPIC_API_KEY=your_claude_api_key
```

5. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## API Endpoints

### `/api/test-analysis`
Tests connection to Supabase and retrieves analysis data.

### `/api/test-coaching`
Tests Claude AI coaching responses with analysis context.

### `/api/test-conversation-history`
Tests conversation history with Claude AI.

## Tech Stack

- [Next.js](https://nextjs.org) - React framework
- [Supabase](https://supabase.com) - Database and authentication
- [Claude AI](https://anthropic.com) - AI coaching engine
- [TypeScript](https://typescriptlang.org) - Type safety

## Development

The project uses:
- Pages Router for API routes
- TypeScript for type safety
- Environment variables for configuration
- Supabase for data storage

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Claude AI Documentation](https://docs.anthropic.com/claude/docs)

## Deploy

Deploy using [Vercel](https://vercel.com/new) and configure the following:
1. Environment variables
2. Supabase integration
3. Build settings

## Vercel Configuration

### Cron Jobs

The application uses Vercel Cron Jobs to handle background PDF text extraction. This is configured in `vercel.json`:

```json
{
  "crons": [{
    "path": "/api/cron/extract-pdf",
    "schedule": "*/15 * * * *"
  }]
}
```

To set this up:

1. Add the `vercel.json` file to your project root
2. Add `CRON_SECRET` to your Vercel environment variables:
   - Go to Project Settings → Environment Variables
   - Add `CRON_SECRET` with a secure random value
3. Deploy to Vercel to activate the cron job

The cron job will run every 15 minutes to process any pending PDF extractions.

### Environment Variables

Required environment variables for Vercel deployment:

```bash
CRON_SECRET=           # Secret key for cron job authentication
ANTHROPIC_API_KEY=     # Claude API key
NEXT_PUBLIC_SUPABASE_URL=     # Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=# Supabase anonymous key
```

### Monitoring

You can monitor cron job executions in your Vercel dashboard:
1. Go to your project dashboard
2. Navigate to "Functions" or "Logs"
3. Filter for `/api/cron/extract-pdf` to see execution history
