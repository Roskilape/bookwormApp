import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import User from "../models/User.js";
dotenv.config();

const protectRoute = async (req, res, next) => {
  try {
    // get token
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res
        .status(401)
        .json({ message: "No authentication token provided, access denied" });
    }

    // verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded) {
      return res.status(401).json({ message: "Invalid token, access denied" });
    }
    // find user by id
    const user = await User.findById(decoded.userId).select("-password"); // give me the user without the password
    if (!user) {
      return res
        .status(401)
        .json({ message: "Token is valid but user not found, access denied" });
    }
    req.user = user; // attach the user object to the request
    next(); // proceed to the next middleware or route handler
  } catch (error) {
    console.error("Error in protectRoute:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export default protectRoute;
