const mongoose = require("mongoose");
const Genre = require("./models/genre");
const Content = require("./models/content");
const Episode = require("./models/episode");
require("dotenv").config();

// נתחבר למונגו
const seedConnectionString =
  process.env.DB_URL ||
  `mongodb+srv://gorenedith1_db_user:${process.env.mongoDBp}@clusterone.q2wvkfp.mongodb.net/video-streaming?retryWrites=true&w=majority`;

mongoose
  .connect(seedConnectionString)
  .then(() => console.log("MongoDB connected for seeding"))
  .catch((err) => {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  });

// ז'אנרים לדוגמה
const genres = [
  { name: "Action", description: "Action movies and shows" },
  { name: "Comedy", description: "Funny movies and shows" },
  { name: "Drama", description: "Emotional stories" },
  { name: "Sci-Fi", description: "Science fiction content" },
  { name: "Horror", description: "Scary content" },
  { name: "Documentary", description: "Real world stories" },
];

// סרטים לדוגמה - משתמשים בקבצים הקיימים
const movies = [
  {
    title: "Nature Exploration",
    type: "movie",
    description: "A beautiful journey through nature's wonders",
    releaseYear: 2023,
    imageUrl: "./posters/nature.jpg", // פוסטר תואם
    videoUrl: "./videos/nature.mp4", // סרטון תואם
    rating: 8.5,
    duration: 15, // 15 דקות
  },
  {
    title: "Urban Life",
    type: "movie",
    description: "Modern city life and architecture",
    releaseYear: 2022,
    imageUrl: "./posters/urban.jpg", // פוסטר תואם
    videoUrl: "./videos/urban.mp4", // סרטון תואם
    rating: 7.8,
    duration: 12,
  },
  {
    title: "Ocean Adventure",
    type: "movie",
    description: "Explore the depths of the ocean",
    releaseYear: 2021,
    imageUrl: "./posters/ocean.jpg", // פוסטר תואם
    videoUrl: "./videos/ocean.mp4", // סרטון תואם
    rating: 9.1,
    duration: 18,
  },
];

// סדרות לדוגמה - משתמשים בפוסטרים הקיימים
const series = [
  {
    title: "Wildlife Documentary",
    type: "series",
    description: "Explore wildlife across different continents",
    releaseYear: 2022,
    imageUrl: "./posters/wildlife.jpg", // פוסטר תואם
    videoUrl: "./videos/wildlife.mp4", // סרטון תואם
    rating: 9.2,
  },
  {
    title: "Tech Innovations",
    type: "series",
    description: "Latest technology innovations explained",
    releaseYear: 2023,
    imageUrl: "./posters/tech.jpg", // פוסטר תואם
    videoUrl: "./videos/tech.mp4", // סרטון תואם
    rating: 8.7,
  },
];

// פרקים לדוגמה לכל סדרה - משתמשים בקבצי הוידאו הקיימים
const episodeTemplates = [
  // פרקים לסדרה 1 - Wildlife Documentary
  [
    {
      title: "African Savanna",
      seasonNumber: 1,
      episodeNumber: 1,
      description: "Exploring the wildlife of African Savanna",
      duration: 22,
      videoUrl: "./videos/wildlife.mp4", // סרטון תואם לסדרה
    },
    {
      title: "Amazon Rainforest",
      seasonNumber: 1,
      episodeNumber: 2,
      description: "Discovering the Amazon rainforest ecosystem",
      duration: 24,
      videoUrl: "./videos/wildlife.mp4", // משתמשים באותו סרטון
    },
  ],
  // פרקים לסדרה 2 - Tech Innovations
  [
    {
      title: "AI Revolution",
      seasonNumber: 1,
      episodeNumber: 1,
      description: "How AI is changing our world",
      duration: 20,
      videoUrl: "./videos/tech.mp4", // סרטון תואם לסדרה
    },
    {
      title: "Sustainable Tech",
      seasonNumber: 1,
      episodeNumber: 2,
      description: "Technology innovations for sustainability",
      duration: 18,
      videoUrl: "./videos/tech.mp4", // משתמשים באותו סרטון
    },
  ],
];

// פונקציה לאתחול בסיס הנתונים
async function seedDatabase() {
  try {
    // מחיקת כל הנתונים הקיימים
    await Genre.deleteMany({});
    await Content.deleteMany({});
    await Episode.deleteMany({});

    console.log("Previous data deleted");

    // הוספת ז'אנרים
    const savedGenres = await Genre.insertMany(genres);
    console.log(`${savedGenres.length} genres added`);

    // מיפוי ז'אנרים לשימוש בתוכן
    const genreMap = {};
    savedGenres.forEach((genre) => {
      genreMap[genre.name] = genre._id;
    });

    // הוספת סרטים עם ז'אנרים מתאימים
    const moviesWithGenres = movies.map((movie) => {
      // בחירת ז'אנרים אקראיים לכל סרט
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

    // הוספת סדרות עם ז'אנרים מתאימים
    const seriesWithGenres = series.map((series, index) => {
      // בחירת ז'אנרים אקראיים לכל סדרה
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

    // הוספת פרקים לכל סדרה
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

// הרצת הפונקציה
seedDatabase();
