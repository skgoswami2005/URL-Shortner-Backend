const express = require("express");
const mongoose = require("mongoose");
const { nanoid } = require("nanoid");
const cors = require("cors");
const path = require("path");
const env = require("dotenv");
const { log } = require("console");
const { url } = require("inspector");

env.config();

const app = express();
const port = 3000;

// Middleware
app.use(express.json());
app.use(cors());
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "Views"));

mongoose
  .connect(process.env.MONGO_URI, {})
  .then(() => {
    console.log("MongoDB is connected successfully");
  })
  .catch((err) => {
    console.log(err);
  });

const urlSchema = new mongoose.Schema({
  longUrl: String,
  shortUrl: String,
  visitorCount: Number,
});

const Url = mongoose.model("Url", urlSchema);

app.get("/", (req, res) => {
  res.redirect("http://localhost:5173/");
});

app.post("/api/url/shorten", async (req, res) => {
  const { longUrl } = req.body;

  try {
    let url = await Url.findOne({ longUrl });
    if (url) {
      res.json(url);
    } else {
      const shortUrl = process.env.SERVER_URL + nanoid(10); // Generate a random ID with length 8
      console.log(shortUrl);
      const newUrl = new Url({ longUrl, shortUrl, visitorCount: 0 });
      await newUrl.save();
      res.json(newUrl);
    }
  } catch (error) {
    console.error("Error shortening URL:", error);
    res.status(500).json({ message: "Server error" });
  }
});

app.get("/:shortId", async (req, res) => {
  const { shortId } = req.params;
  console.log(shortId); // Log the short ID to check its value
  const shortUrl = process.env.SERVER_URL + shortId; // Generate the full short URL with the short ID
  try {
    const url = await Url.findOne({ shortUrl: shortUrl });
    console.log(url); // Log the URL object to check its properties and values
    if (url) {
      let newCount = url.visitorCount + 1;
      // update the visitorCount in the database
      await Url.findOneAndUpdate(
        { shortUrl: shortUrl },
        { visitorCount: newCount }
      );
      res.render("index.ejs", { url: url.longUrl });
    } else {
      return res.status(404).json({ message: "URL not found" });
    }
  } catch (error) {
    console.error("Error redirecting:", error);
    res.status(500).json({ message: "Server error" });
  }
});

app.get("/api/getPopular", async (req, res) => {
  try {
    const urls = await Url.find().sort({ visitorCount: -1 }).limit(10);
    // console.log(urls);
    res.json(urls);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

app.listen(port, () => {
  console.log(
    `server is up and running and is currently running on port ${port}`
  );
});
