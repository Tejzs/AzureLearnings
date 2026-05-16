const express = require("express");
const Redis = require("ioredis");
const { EventHubProducerClient } = require("@azure/event-hubs");
require("dotenv").config();

const app = express();
const redis = new Redis(process.env.REDIS_URL, {
  password: process.env.REDIS_PASSWORD,
  tls: {}
});

const producer = new EventHubProducerClient(
  process.env.EVENT_HUB_CONNECTION_STRING,
  process.env.EVENT_HUB_NAME
);

// Publishes odds to Redis AND sends event to Event Hubs
async function publishOdds(matchId, price) {
  // Write to Redis
  await redis.hset(`odds:${matchId}`, "price", price);

  // Publish event to Event Hubs
  const batch = await producer.createBatch();
  batch.tryAdd({ body: { matchId, price, timestamp: Date.now() } });
  await producer.sendBatch(batch);

  console.log(`Published odds for ${matchId}: ${price}`);
}

// Simulate odds updates every 5 seconds
setInterval(async () => {
  const matches = ["match1", "match2", "match3"];
  for (const matchId of matches) {
    const price = (Math.random() * 3 + 1).toFixed(2); // random odds 1.00–4.00
    await publishOdds(matchId, price);
  }
}, 5000);

// Read endpoint stays the same
app.get("/odds/:matchId", async (req, res) => {
  const matchId = req.params.matchId;
  const odds = await redis.hget(`odds:${matchId}`, "price");
  if (!odds) return res.status(404).json({ error: "No odds found" });
  res.json({ matchId, odds });
});

app.listen(3000, () => console.log("Odds API running on port 3000"));
