const express = require("express");
const Redis = require("ioredis");
require("dotenv").config();

const app = express();

const redis = new Redis(process.env.REDIS_URL, {
  password: process.env.REDIS_PASSWORD,
  tls: {}
});


app.get("/odds/:matchId", async (req, res) => {
  const matchId = req.params.matchId;
  const odds = await redis.hget(`odds:${matchId}`, "price");

  if (!odds) return res.status(404).json({ error: "No odds found" });

  res.json({ matchId, odds });
});

app.listen(3000, () => console.log("Odds API running on port 3000"));
