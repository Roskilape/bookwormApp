import express from "express";
import "dotenv/config";
import authRoutes from "./routes/authRoutes.js";
import { connectDB } from "./lib/db.js";
import bookRoutes from "./routes/bookRoutes.js";

const app = express();

app.use(express.json());

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`server is running on PORT ${PORT}`);
  connectDB();
});

app.use("/api/auth", authRoutes);
app.use("/api/books", bookRoutes);
