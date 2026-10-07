import express from "express";
import "dotenv/config";
import authRoutes from "./routes/authRoutes.js";
import { connectDB } from "./lib/db.js";
import bookRoutes from "./routes/bookRoutes.js";
import job from "./lib/cron.js";

const app = express();

// Base64 book images need a larger limit than regular API requests.
app.use("/api/books", express.json({ limit: "10mb" }));
app.use(express.json());

app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`server is running on PORT ${PORT}`);
  job.start();
  connectDB();
});

app.use("/api/auth", authRoutes);
app.use("/api/books", bookRoutes);

app.use((error, req, res, next) => {
  if (error.type === "entity.too.large") {
    return res
      .status(413)
      .json({
        message:
          "Image is too large. Choose a smaller image (request limit: 10 MB).",
      });
  }
  if (error.type === "entity.parse.failed") {
    return res.status(400).json({ message: "Invalid JSON request body" });
  }
  next(error);
});
