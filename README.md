# Touzi Maker

Touzi Maker is a modern, full-stack web application built with Next.js. It features a robust technology stack designed for performance, scalability, and an excellent developer experience.

## Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) (App Router)
- **Database**: [Neon Database (Serverless Postgres)](https://neon.tech/)
- **ORM**: [Drizzle ORM](https://orm.drizzle.team/)
- **Authentication**: [NextAuth.js](https://next-auth.js.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **UI Components**: [Radix UI](https://www.radix-ui.com/) & [Lucide React](https://lucide.dev/)
- **Forms & Validation**: [React Hook Form](https://react-hook-form.com/) & [Zod](https://zod.dev/)
- **State Management**: [Zustand](https://zustand-demo.pmnd.rs/)
- **Internationalization (i18n)**: [next-intl](https://next-intl-docs.vercel.app/)
- **Charts**: [Recharts](https://recharts.org/)
- **PDF Generation**: jsPDF & html2canvas

## Getting Started

### Prerequisites

- Node.js 18+ or later
- npm, yarn, pnpm, or bun

### Environment Variables

Copy the example environment file and fill in your details:

```bash
cp .env.example .env.local
```

Required environment variables include:
- Database connection string
- NextAuth secret and providers configuration

### Database Setup

Generate and apply database migrations using Drizzle Kit:

```bash
npm run db:generate
npm run db:migrate
```

To seed the database with initial data:
```bash
npm run db:seed
```

To open Drizzle Studio for database management:
```bash
npm run db:studio
```

### Installation & Development

Install dependencies:
```bash
npm install
```

Start the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Available Scripts

- `npm run dev`: Starts the development server.
- `npm run build`: Builds the app for production.
- `npm run start`: Runs the built app in production mode.
- `npm run lint`: Lints the codebase.
- `npm run db:generate`: Generates Drizzle migrations based on your schema.
- `npm run db:migrate`: Applies migrations to your database.
- `npm run db:push`: Pushes schema changes directly to the database.
- `npm run db:studio`: Opens Drizzle Studio to view and manage your data.
- `npm run db:seed`: Seeds the database.

## Learn More

To learn more about the core technologies used in this project:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Drizzle ORM](https://orm.drizzle.team/docs/overview) - typescript ORM.
- [Neon Serverless Driver](https://neon.tech/docs/serverless/serverless-driver) - connect to Neon from serverless functions.
