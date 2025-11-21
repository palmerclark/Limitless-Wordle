import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import Word from "./models/Word.js";
import fs from "fs";

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

mongoose
  .connect(
    "mongodb+srv://readonlyUser:ilovewords@words.ynszfma.mongodb.net/?appName=words"
  )
  .then(() => {
    console.log("MongoDB connected!");
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((err) => console.error(err));

/* Seeding Logic
  .then(async () => {
    console.log("MongoDB connected");
    const count = await Word.countDocuments();
    if (count == 0) {
      const fileData = fs.readFileSync("./valid_guesses.csv", "utf-8");
      const words = fileData.split(/\r?\n/);

      const formatted = words
        .filter((w) => w.trim() != "")
        .map((w) => ({
          word: w.toUpperCase(),
          length: w.length,
        }));

      await Word.insertMany(formatted);
      console.log("Database seeded!");
    }

    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((err) => console.error(err));
  */

app.post("/words", async (req, res) => {
  try {
    const { word } = req.body;
    const newWord = new Word({ word: word.toUpperCase(), length: word.length });
    await newWord.save();
    res.status(201).json({ message: "Word added" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/random-word", async (req, res) => {
  try {
    const count = await Word.countDocuments();
    const randomIndex = Math.floor(Math.random() * count);
    const randomWord = await Word.findOne().skip(randomIndex);
    res.json({ word: randomWord.word });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
