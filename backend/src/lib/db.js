import mongoose from "mongoose";
import dns from "node:dns";

import dotenv from "dotenv";

dotenv.config();

// The local DNS resolver refuses Atlas SRV lookups; use public resolvers.
dns.setServers(["1.1.1.1", "8.8.8.8"]);

export const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`Database connected ${conn.connection.host}`);
  } catch (error) {
    console.log("Error connecting to database", error);
    process.exit(1); // exit with failure
  }
};
