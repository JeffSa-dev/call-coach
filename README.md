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
