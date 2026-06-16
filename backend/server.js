// server.js — Entry point for the Mental Wellness Chatbot backend
// Express app and HTTP server are separated to support port-free testing.

require("dotenv").config();
const app = require("./app");
const connectDB = require("./config/db");

const PORT = process.env.PORT || 5000;

// Connect to MongoDB, then start server
// We only listen after DB is ready — avoids requests hitting an unready DB
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT} [${process.env.NODE_ENV}]`);
  });
});
