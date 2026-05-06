const express = require("express");
const axios = require("axios");
const Database = require("better-sqlite3");

const app = express();
app.use(express.json());

const db = new Database("/app/data/sportsbook.db");

// Schema
db.exec(`
CREATE TABLE IF NOT EXISTS bets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  player_id INTEGER,
  match_id TEXT NOT NULL,
  stake REAL NOT NULL,
  odds REAL NOT NULL,
  status TEXT NOT NULL DEFAULT 'placed',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
`);

app.post("/wallet/credit", async (req, res) => {
  try {
    const response = await axios.post(
      `${process.env.WALLET_URL}/wallet/credit`,
      req.body
    );
    res.json(response.data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/bet/place", async (req, res) => {
  const { playerId, matchId, stake } = req.body;

  // 1. Get odds
  const oddsResp = await axios.get(`${process.env.ODDS_API_URL}/odds/${matchId}`);
  const odds = oddsResp.data.odds;

  // 2. Debit wallet
  const idempotencyKey = `bet-${playerId}-${matchId}-${stake}`;
  const debitResp = await axios.post(`${process.env.WALLET_URL}/wallet/debit`, {
    playerId,
    amount: stake,
    idempotencyKey
  });

  if (debitResp.data.error) {
    return res.status(400).json(debitResp.data);
  }

  // 3. Insert bet
  const stmt = db.prepare(
    `INSERT INTO bets (player_id, match_id, stake, odds)
     VALUES (?, ?, ?, ?)`
  );
  const result = stmt.run(playerId, matchId, stake, odds);

  res.json({ success: true, betId: result.lastInsertRowid });
});

app.listen(3002, () => console.log("Bet Service running on 3002"));
