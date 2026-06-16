// config/db.js — MongoDB Atlas connection via Mongoose
// The database connection function is exported (rather than a connection object)
// to allow the caller to control when the connection is established, which
// facilitates using different URIs during testing.

const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      // These options silence deprecation warnings and enable connection pooling
      serverSelectionTimeoutMS: 5000, // fail fast if Atlas is unreachable
    });

    console.log(`MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
    // Exit the process — the app is useless without a database
    process.exit(1);
  }
};

module.exports = connectDB;
