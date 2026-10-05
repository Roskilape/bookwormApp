import express from "express";
import User from "../models/User.js";
import jwt from "jsonwebtoken";

const router = express.Router();

const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: "15d" });
};

router.post("/register", async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (password.length < 6) {
      return res
        .status(400)
        .json({ message: "Password should be at least 6 characters long" });
    }

    if (username.length < 3) {
      return res
        .status(400)
        .json({ message: "username should be at least 3 characters long" });
    }

    //check if user already exists
    const existingEmail = await User.findOne({ email });
    if (existingEmail)
      return res.status(400).json({ message: "email already exists" });

    const existingUsername = await User.findOne({ username });
    if (existingUsername)
      return res.status(400).json({ message: "Username already exists" });
    // get random avatar
    const profileImage = `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`;

    const newUser = new User({
      username,
      email,
      password,
      profileImage,
    });

    await newUser.save();

    const token = generateToken(newUser._id);
    res.status(200).json({
      token,
      user: {
        _id: newUser._id,
        username: newUser.username,
        email: newUser.email,
        profileImage: newUser.profileImage,
        createdAt: newUser.createdAt,
        updatedAt: newUser.updatedAt,
      },
    });
  } catch (error) {
    console.log("Error in register route", error);
    res.status(500).json({ message: "internal server error" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ message: "all fields requires" });

    const user = await User.findOne({ email });
    if (!user) return res.status(500).json({ message: "invalid credentials" });
    const isPasswordCorrect = await user.comparePassword(password);
    if (!isPasswordCorrect)
      return res.status(400).json({ message: "invalid credentials" });

    const token = generateToken(user._id);
    res.status(200).json({
      token,
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        profileImage: user.profileImage,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });
  } catch (error) {
    console.log("Error in login route", error);
    res.status(500).json({ message: "internal server error" });
  }
});

export default router;
