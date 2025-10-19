import User from "../models/user.model.js";
import Profile from "../models/profile.model.js";
import bcrypt from "bcrypt";
import crypto from "crypto";

import jwt from "jsonwebtoken";

export const register = async (req, res) => {
  try {
    const { name, email, password, username } = req.body;

    if (!name || !email || !password || !username)
      return res.status(400).json({ message: "All fields are required!" });

    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(400).json({ message: "User already exists!" });

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create JWT token
    const token = jwt.sign(
      { email, username },
      process.env.JWT_SECRET || "yourSecretKey",
      { expiresIn: "7d" } // 7 days validity
    );

    // Create new user
    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      username,
      token,
    });
    await newUser.save();

    // Create empty profile
    const profile = new Profile({ userId: newUser._id });
    await profile.save();

    return res.status(200).json({
      message: "User created successfully! 🎊",
      user: {
        id: newUser._id,
        name: newUser.name,
        username: newUser.username,
        email: newUser.email,
        token: newUser.token,
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: err.message || "Server error" });
  }
};


export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({ message: "Email and password are required!" });

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user)
      return res.status(404).json({ message: "User not found!" });

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(401).json({ message: "Invalid credentials!" });

    // Generate a fresh JWT token
    const token = jwt.sign(
      { id: user._id, email: user.email, username: user.username },
      process.env.JWT_SECRET || "yourSecretKey",
      { expiresIn: "7d" }
    );

    // Save token in DB (optional but matches your schema)
    user.token = token;
    await user.save();

    // Return user info and token
    return res.status(200).json({
      message: "Login successful! ✅",
      user: {
        id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        profilePicture: user.profilePicture,
        token: user.token,
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: err.message || "Server error" });
  }
};
