import mongoose from "mongoose";

const wordSchema = new mongoose.Schema({
  word: { type: String, required: true, unique: true },
  length: Number,
});

export default mongoose.model("Word", wordSchema);
