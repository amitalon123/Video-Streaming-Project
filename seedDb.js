const mongoose = require("mongoose");
const Genre = require("./models/genre");
const Content = require("./models/content");
const Episode = require("./models/episode");
const User = require("./models/user");
const bcrypt = require("bcryptjs");
require("dotenv").config();

// connection to mongodb
const seedConnectionString =
  process.env.DB_URL ||
  `mongodb+srv://${process.env.MONGO_DB_USER}:${process.env.MONGO_DB_PASSWORD}@clusterone.q2wvkfp.mongodb.net/video-streaming?retryWrites=true&w=majority`;

mongoose
  .connect(seedConnectionString, { serverSelectionTimeoutMS: 30000 })
  .then(() => console.log("MongoDB connected for seeding"))
  .catch((err) => {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  });

// genres for example
const genres = [
  { name: "Action", description: "Action movies and shows" },
  { name: "Comedy", description: "Funny movies and shows" },
  { name: "Drama", description: "Emotional stories" },
  { name: "Sci-Fi", description: "Science fiction content" },
  { name: "Horror", description: "Scary content" },
  { name: "Documentary", description: "Real world stories" },
];

// movies for example - using the existing files
const movies = [
  {
    title: "Nature Exploration",
    type: "movie",
    description: "A beautiful journey through nature's wonders",
    releaseYear: 2023,
    imageUrl: "./posters/nature.jpg", // matching poster
    videoUrl: "./videos/nature.mp4", // matching video
    rating: 8.5,
    duration: 15, // 15 minutes
  },
  {
    title: "Urban Life",
    type: "movie",
    description: "Modern city life and architecture",
    releaseYear: 2022,
    imageUrl: "./posters/urban.jpg", // matching poster
    videoUrl: "./videos/urban.mp4", // matching video
    rating: 7.8,
    duration: 12,
  },
  {
    title: "Ocean Adventure",
    type: "movie",
    description: "Explore the depths of the ocean",
    releaseYear: 2021,
    imageUrl: "./posters/ocean.jpg", // matching poster
    videoUrl: "./videos/ocean.mp4", // matching video
    rating: 9.1,
    duration: 18,
  },
];

// series for example - using the existing posters
const series = [
  {
    title: "Wildlife Documentary",
    type: "series",
    description: "Explore wildlife across different continents",
    releaseYear: 2022,
    imageUrl: "./posters/wildlife.jpg", // matching poster
    videoUrl: "./videos/wildlife.mp4", // matching video
    rating: 9.2,
  },
  {
    title: "Tech Innovations",
    type: "series",
    description: "Latest technology innovations explained",
    releaseYear: 2023,
    imageUrl: "./posters/tech.jpg", // matching poster
    videoUrl: "./videos/tech.mp4", // matching video
    rating: 8.7,
  },
];

// episodes for example - using the existing videos
const episodeTemplates = [
  // episodes for series 1 - Wildlife Documentary
  [
    {
      title: "African Savanna",
      seasonNumber: 1,
      episodeNumber: 1,
      description: "Exploring the wildlife of African Savanna",
      duration: 22,
      videoUrl: "./videos/wildlife.mp4", // matching video
    },
    {
      title: "Amazon Rainforest",
      seasonNumber: 1,
      episodeNumber: 2,
      description: "Discovering the Amazon rainforest ecosystem",
      duration: 24,
      videoUrl: "./videos/wildlife.mp4", // matching video
    },
  ],
  // episodes for series 2 - Tech Innovations
  [
    {
      title: "AI Revolution",
      seasonNumber: 1,
      episodeNumber: 1,
      description: "How AI is changing our world",
      duration: 20,
      videoUrl: "./videos/tech.mp4", // matching video
    },
    {
      title: "Sustainable Tech",
      seasonNumber: 1,
      episodeNumber: 2,
      description: "Technology innovations for sustainability",
      duration: 18,
      videoUrl: "./videos/tech.mp4", // matching video
    },
  ],
];

// function to initialize the database
async function seedDatabase() {
  try {
    // delete all existing data
    await User.deleteMany({});
    await Genre.deleteMany({});
    await Content.deleteMany({});
    await Episode.deleteMany({});

    console.log("Previous data deleted");

    // add users
    const usersToSeed = [
      { name: "Amit Alon", email: "amit@example.com", password: "password123", role: "admin", avatarUrl: "/Images/Amit.jpg" },
      { name: "Asaf Sardas", email: "asaf@example.com", password: "password123", role: "user", avatarUrl: "/Images/Asaf.jpg" },
      { name: "Reut Maduel", email: "reut@example.com", password: "password123", role: "user", avatarUrl: "/Images/Reut.jpg" },
      { name: "Edith goren", email: "edith@example.com", password: "password123", role: "user", avatarUrl: "/Images/Edith.jpg" },
    ];
    const hashedUsers = await Promise.all(
      usersToSeed.map(async (u) => ({
        name: u.name,
        email: u.email,
        role: u.role,
        avatarUrl: u.avatarUrl,
        passwordHash: await bcrypt.hash(u.password, 10),
      }))
    );
    const savedUsers = await User.insertMany(hashedUsers);
    console.log(`${savedUsers.length} users added`);

    // add genres
    const savedGenres = await Genre.insertMany(genres);
    console.log(`${savedGenres.length} genres added`);

    // mapping genres for use in content
    const genreMap = {};
    savedGenres.forEach((genre) => {
      genreMap[genre.name] = genre._id;
    });

    // add movies with matching genres
    const moviesWithGenres = movies.map((movie) => {
      // select random genres for each movie
      const randomGenres = [];
      randomGenres.push(genreMap["Action"]);
      randomGenres.push(genreMap["Drama"]);

      return {
        ...movie,
        genres: randomGenres,
      };
    });

    const savedMovies = await Content.insertMany(moviesWithGenres);
    console.log(`${savedMovies.length} movies added`);

    // add series with matching genres
    const seriesWithGenres = series.map((series, index) => {
      // select random genres for each series
      const randomGenres = [];
      if (index === 0) {
        randomGenres.push(genreMap["Documentary"]);
        randomGenres.push(genreMap["Drama"]);
      } else {
        randomGenres.push(genreMap["Sci-Fi"]);
        randomGenres.push(genreMap["Documentary"]);
      }

      return {
        ...series,
        genres: randomGenres,
      };
    });

    const savedSeries = await Content.insertMany(seriesWithGenres);
    console.log(`${savedSeries.length} series added`);

    // add episodes for each series
    let totalEpisodes = 0;

    for (let i = 0; i < savedSeries.length; i++) {
      const seriesId = savedSeries[i]._id;
      const episodesForSeries = episodeTemplates[i].map((episode) => ({
        ...episode,
        content: seriesId,
      }));

      const savedEpisodes = await Episode.insertMany(episodesForSeries);
      totalEpisodes += savedEpisodes.length;
    }

    console.log(`${totalEpisodes} episodes added`);

    console.log("Database seeded successfully");
  } catch (error) {
    console.error("Error seeding database:", error);
  } finally {
    mongoose.disconnect();
    console.log("MongoDB disconnected");
  }
}

// run the function
seedDatabase();
