# TwitterAiManager

A full-stack application for managing Twitter interactions with AI-powered content generation and autonomous posting capabilities.

## Features

- **Twitter Integration**: OAuth authentication and API integration for posting, timeline management, and mentions
- **AI Content Generation**: Text and image generation using Hugging Face and OpenRouter APIs
- **Autonomous Posting**: Automated tweet scheduling and posting
- **Cryptocurrency Integration**: Real-time crypto data from CoinMarketCap
- **Real-time Updates**: WebSocket support for live updates
- **Modern UI**: React-based frontend with Tailwind CSS

## Tech Stack

- **Frontend**: React, TypeScript, Vite, Tailwind CSS
- **Backend**: Node.js, Express, TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Twitter OAuth 1.0a
- **AI Services**: Hugging Face, OpenRouter
- **Real-time**: WebSockets

## Prerequisites

- Node.js 18+
- PostgreSQL database (or Supabase)
- Twitter Developer Account with API keys
- Hugging Face API key
- OpenRouter API key (optional)
- CoinMarketCap API key (optional)

## Environment Variables

Create a `.env` file with the following variables:

```env
# Twitter API
TWITTER_API_KEY=your_twitter_api_key
TWITTER_API_SECRET=your_twitter_api_secret
TWITTER_ACCESS_TOKEN=your_access_token
TWITTER_ACCESS_TOKEN_SECRET=your_access_token_secret
TWITTER_BEARER_TOKEN=your_bearer_token
TWITTER_CALLBACK_URL=http://localhost:5000/api/twitter/callback

# AI Services
HUGGINGFACE_API_KEY=your_huggingface_api_key
OPENROUTER_API_KEY=your_openrouter_api_key

# Database
DATABASE_URL=postgresql://username:password@localhost:5432/database_name

# Supabase (if using)
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key

# Server Configuration
PORT=5000
NODE_ENV=development
SESSION_SECRET=your_session_secret

# Optional
COINMARKETCAP_API_KEY=your_coinmarketcap_api_key
```

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd TwitterAiManager
```

2. Install dependencies:
```bash
npm install
```

3. Set up the database:
```bash
npm run db:push
```

4. Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5000`

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run db:push` - Push database schema
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier

## Deployment

### Railway (Recommended)

1. Connect your GitHub repository to Railway
2. Set up environment variables in Railway dashboard
3. Deploy automatically on push

### Render

1. Connect repository to Render
2. Configure build and start commands
3. Set environment variables
4. Deploy

### Vercel + Supabase

1. Deploy frontend to Vercel
2. Use Supabase for database
3. Configure environment variables

## API Endpoints

- `GET /api/twitter/auth` - Twitter authentication
- `POST /api/twitter/post` - Create tweet
- `GET /api/twitter/user` - Get user info
- `POST /api/ai/generate-text` - Generate AI text
- `POST /api/ai/generate-image` - Generate AI image
- `GET /api/crypto/prices` - Get crypto prices

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License