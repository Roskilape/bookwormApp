import express from "express";
import cloudinary from "../lib/cloudinary.js";
import protectRoute from "../middleware/auth.middleware.js";
import Book from "../models/book.js";

const router = express.Router();

router.post("/", protectRoute, async (req, res) => {
  try {
    const { title, caption, rating, image } = req.body;
    if (!title || !caption || !rating || !image) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // upload image to cloudinary

    const uploadResponse = await cloudinary.uploader.upload(image);
    const imageUrl = uploadResponse.secure_url;
    // save the url to the database

    const newBook = new Book({
      title,
      caption,
      rating,
      image: imageUrl,
      user: req.user._id,
    });
    await newBook.save();
    res.status(201).json(newBook);
  } catch (error) {
    console.error("Error creating book:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// const response = await fetch("https://localhost:3000/api/books?page=1&limit=10", )
// pagination => infinite loading

router.get("/", protectRoute, async (req, res) => {
  try {
    const page = req.query.page ? parseInt(req.query.page) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit) : 5;
    const skip = (page - 1) * limit;

    const books = await Book.find()
      .sort({ createdAt: -1 }) // descending order
      .skip(skip)
      .limit(limit)
      .populate("user", "username email"); // populate user field with username and email

    const totalBooks = await Book.countDocuments();
    res.send({
      books,
      totalBooks,
      currentPage: page,
      totalPages: Math.ceil(totalBooks / limit),
    });
  } catch (error) {
    console.error("Error in get all books route:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/user", protectRoute, async (req, res) => {
  try {
    const books = await Book.find({ user: req.user._id }).sort({
      createdAt: -1,
    });
    res.json(books);
  } catch (error) {
    console.error("Error in get user books route:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.delete("/:id", protectRoute, async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) {
      return res.status(404).json({ message: "Book not found" });
    }

    //check if the user is the owner of the book
    if (book.user.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ message: "You are not authorized to delete this book" });
    }

    //delete image from cloudinary
    if (book.image && book.image.includes("res.cloudinary.com")) {
      try {
        const publicId = book.image.split("/").pop().split(".")[0];
        await cloudinary.uploader.destroy(publicId);
      } catch (error) {
        console.error("Error deleting image from cloudinary:", error);
      }

      await book.deleteOne();
      res.status(200).json({ message: "Book deleted successfully" });
    }
  } catch (error) {
    console.error("Error in delete book route:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});
export default router;
