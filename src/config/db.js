import mongoose from "mongoose";

const connectDB = async (uri) => {
  if (!uri) throw new Error("Database connection URI is missing");
  if (mongoose.connection.readyState === 1) return;
  await mongoose.connect(uri);
};

export default connectDB;