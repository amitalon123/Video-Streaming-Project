# Video Streaming Project

An end-to-end video streaming platform built with Node.js, Express, MongoDB (Mongoose), and EJS views. It includes user authentication with sessions, profile management, content and episodes, genres, viewing history, admin content management, statistics, robust logging, and responsive UI with an HTML5 player.

## Features

- Authentication with bcrypt and session-based login (stored in MongoDB)
- Profiles CRUD per user
- Content management: movies and series with episodes
- Genres and feed views
- Viewing history and actions
- Admin panel for uploads and metadata, plus external ratings support
- Recommendations foundation (by history and likes)
- Statistics with charts
- Comprehensive error handling and structured logging to DB
- Responsive EJS-based UI with static assets

## Tech Stack

- Runtime: Node.js (Express)
- Database: MongoDB (Mongoose)
- Views: EJS
- Sessions: express-session + connect-mongo
- Styling/Static: public/css, public/js, public/posters, public/videos

## Getting Started

### Prerequisites

- Node.js (v18+ recommended)
- npm (comes with Node)
- MongoDB (Atlas or local). A connection string is required.

### Installation

```bash
git clone <your-fork-or-repo-url>
cd Video-Streaming-Project
npm install
```

### Environment Variables

Use the provided sample file as reference:

- Copy `env.examlpe` to `.env` in the project root
- Fill in your real values

Key variables:
- `DB_URL` — Mongo connection string (required)
- `SESSION_SECRET` — long random string for session signing (required)
- `PORT` — server port (default 3000)
- `NODE_ENV` — `development` or `production`
- `MONGO_DB_USER`, `MONGO_DB_PASSWORD` — optional, used by seeding if `DB_URL` is not provided
- `IMDB_API_KEY` — optional, enables IMDb rating lookup in admin content creation
- `GENRE_ITEMS_PER_PAGE` — optional UI setting (defaults handled in code/UI if not set)

### Run the App

```bash
# Development with auto-reload
npm run dev

# Production-style start
npm start
```

The server defaults to `http://localhost:3000` unless `PORT` is set.

### Seed the Database (Optional)

Seeds users, genres, content, and episodes using existing posters/videos under `public/`.

```bash
npm run seed
```

Seeded users include:
- Admins: `amit@gmail.com`, `asaf@gmail.com`, `reut@gmail.com`, `edith@gmail.com` 
- User: `daniel@gmail.com`

## Project Structure

```
Video-Streaming-Project/
  app.js
  config/
    config.js
    database.js
  controllers/
    adminController.js
    authController.js
    contentController.js
    episodeController.js
    genreController.js
    profileController.js
    statisticsController.js
    userController.js
    viewingHabitController.js
  middleware/
    authMiddleware.js
    errorHandleMiddleware.js
    httpRequestLogger.js
  models/
    content.js
    episode.js
    genre.js
    log.js
    user.js
    viewingHabit.js
  routes/
    api/
      adminRoutes.js
      authRoutes.js
      contentRoutes.js
      episodeRoutes.js
      genreRoutes.js
      profileRoutes.js
      statisticsRoutes.js
      userRoutes.js
      viewingHabitRoutes.js
    views/
      add-content.js
      content.js
      feed.js
      genre.js
      login.js
      profiles.js
      register.js
      settings.js
  public/
    css/
    js/
    posters/
    videos/
  views/
    admin/
      add-content.ejs
    auth/
      login.ejs
      profiles.ejs
      register.ejs
    content/
      content-detail.ejs
      feed.ejs
      genre.ejs
      player.ejs
      settings.ejs
    partials/
      footer.ejs
      header.ejs
  utils/
    apiHelper.js
    logger.js
  seedDb.js
  README.md
```

## Scripts

- `npm run dev`: Start with nodemon
- `npm start`: Start the server
- `npm run seed`: Seed the database

## Routes Overview

### API (JSON)

- `/api/content` — content listing, details, create/update (admin), etc.
- `/api/genres` — genre listing and details
- `/api/episodes` — episode listing and per-content episodes
- `/api/admin` — admin operations (content upload/management)
- `/api/stats` — statistics endpoints
- `/api/users` — user operations
- `/api/viewings` — viewing history/actions
- `/api/auth` — authentication: login/register/logout
- `/api/profiles` — profile CRUD

Check the route files under `routes/api/*` and their corresponding controllers in `controllers/*`.

### Views (EJS)

- `/feed` — home feed
- `/profiles` — profile selection
- `/login` — login page
- `/register` — registration page
- `/genre` — genre view
- `/content` — content details
- `/add-content` — admin add-content UI
- `/settings` — user settings

View route handlers live under `routes/views/*` and templates under `views/*`.

## Logging & Error Handling

- HTTP requests are persisted to MongoDB via `middleware/httpRequestLogger.js`
- Structured logs are written using `utils/logger.js` (info/warn/error with context)
- Centralized error handling through `middleware/errorHandleMiddleware.js`

## Sessions & Security

- Session cookie name: `vsid`
- Session store: MongoDB via `connect-mongo`
- Configure `SESSION_SECRET` in `.env`
- In production, ensure cookies are `secure: true` behind HTTPS/reverse proxy

## Static Assets

Static files are served from `public/`:
- Posters: `public/posters`
- Videos: `public/videos`
- Styles/JS: `public/css`, `public/js`

## Deployment Notes

- Provide `DB_URL` and `SESSION_SECRET` as environment variables
- Set `NODE_ENV=production`, configure HTTPS, and set session cookie `secure: true`
- Ensure your hosting environment allows streaming of static assets under `public/videos`

## License

ISC License — see `package.json` for details.
