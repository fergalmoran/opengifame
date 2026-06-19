# OpenGifame - Image Sharing Platform

An open-source image sharing platform similar to Imgur, built with Next.js, Drizzle ORM, PostgreSQL, NextAuth, and
shadcn/ui.

## Features

- 🖼️ **Image Upload & Sharing** - Upload and share images with the community
- 🎥 **Smart Video Processing** - Intelligent streaming system with real-time transcoding and smart caching
- 🎬 **GIF Generation** - Create animated GIFs from any segment of uploaded videos
- 👍 **Voting System** - Upvote and downvote images
- 💬 **Comments** - Comment on images with threaded replies
- 🏷️ **Tagging System** - Tag images and create new tags
- 📈 **Trending Gallery** - View trending images based on community votes
- 🔐 **Authentication** - Sign in with GitHub or Google
- 🌙 **Dark/Light Mode** - Responsive design with theme support
- 📱 **Mobile Responsive** - Works great on all devices

## Video Features

OpenGifame includes a sophisticated video processing system with three intelligent modes:

- **Hybrid Mode** (Default): Automatically chooses between streaming and caching based on video duration
- **Streaming Mode**: Real-time transcoding for immediate playback (2-3 second start time)
- **Cache Mode**: Pre-conversion with instant subsequent access

**Key Benefits:**

- Long videos (>60s) stream immediately without waiting for conversion
- Short videos (≤60s) are cached for instant repeat access
- All videos converted to 480p MP4 for universal browser compatibility
- Supports MP4, AVI, MKV, MOV, WMV, FLV, WebM, M4V formats
- Zero storage overhead for streaming mode

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS, shadcn/ui components
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: NextAuth.js
- **Icons**: Lucide React
- **Package Manager**: Bun

## Getting Started

### Prerequisites

- Node.js 18+ or Bun
- PostgreSQL database
- Git

### Installation

1. **Clone the repository**

   ```bash
   git clone <your-repo-url>
   cd opengifame
   ```

2. **Install dependencies**

   ```bash
   bun install
   ```

3. **Set up environment variables**

   ```bash
   cp .env.example .env.local
   ```

   Edit `.env.local` and configure:

   ```env
   # Database
   DATABASE_URL="postgres://postgres:hackme@localhost:5432/opengifame"

   # NextAuth
   NEXTAUTH_URL="http://localhost:3000"
   NEXTAUTH_SECRET="your-secret-key-here"

   # OAuth providers (optional)
   GITHUB_CLIENT_ID="your-github-client-id"
   GITHUB_CLIENT_SECRET="your-github-client-secret"
   GOOGLE_CLIENT_ID="your-google-client-id"
   GOOGLE_CLIENT_SECRET="your-google-client-secret"
   ```

4. **Set up the database**

   Create the PostgreSQL database:

   ```sql
   CREATE DATABASE opengifame;
   ```

   Run the database migration:

   ```bash
   bun run db:push
   ```

5. **Start the development server**

   ```bash
   bun run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser.

## Database Schema

The application uses the following main tables:

- **users** - User accounts (NextAuth)
- **images** - Uploaded images with metadata
- **votes** - User votes on images (upvote/downvote)
- **comments** - Comments on images with threading support
- **tags** - Image tags
- **image_tags** - Many-to-many relationship between images and tags

## API Endpoints

- `POST /api/images/upload` - Upload a new image
- `POST /api/images/vote` - Vote on an image
- `GET/POST /api/auth/[...nextauth]` - NextAuth endpoints

## Scripts

- `bun run dev` - Start development server
- `bun run build` - Build for production
- `bun run start` - Start production server
- `bun run lint` - Run ESLint
- `bun run db:generate` - Generate database migrations
- `bun run db:push` - Push schema changes to database
- `bun run db:studio` - Open Drizzle Studio

## OAuth Setup (Optional)

### GitHub OAuth

1. Go to GitHub Settings > Developer settings > OAuth Apps
2. Create a new OAuth App with:
  - Homepage URL: `http://localhost:3000`
  - Authorization callback URL: `http://localhost:3000/api/auth/callback/github`
3. Add the Client ID and Secret to your `.env.local`

### Google OAuth

1. Go to the Google Cloud Console
2. Create a new project or select an existing one
3. Enable the Google+ API
4. Create OAuth 2.0 credentials with:
  - Authorized JavaScript origins: `http://localhost:3000`
  - Authorized redirect URIs: `http://localhost:3000/api/auth/callback/google`
5. Add the Client ID and Secret to your `.env.local`

## Project Structure

```bash
src/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── upload/            # Upload page
│   ├── trending/          # Trending page
│   └── page.tsx           # Home page
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   ├── header.tsx        # Navigation header
│   └── image-card.tsx    # Image display component
├── lib/                  # Utilities and configuration
│   ├── db/              # Database configuration and schema
│   ├── auth.ts          # NextAuth configuration
│   └── utils.ts         # Utility functions
└── types/               # TypeScript type definitions
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## License

This project is open source and available under the [MIT License](LICENSE).

## Deployment

The application can be deployed to any platform that supports Next.js:

- **Vercel** (recommended)
- **Netlify**
- **Railway**
- **Docker**

Make sure to:

1. Set up environment variables in your deployment platform
2. Configure a PostgreSQL database
3. Set up OAuth providers for production URLs

## Support

If you have any questions or issues, please open an issue on GitHub.
