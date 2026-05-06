const express = require("express");
const Database = require("better-sqlite3");

const app = express();
app.use(express.json());

const db = new Database("/app/data/sportsbook.db");

// Schema
db.exec(`
CREATE TABLE IF NOT EXISTS wallets (
  player_id INTEGER PRIMARY KEY,
  balance REAL NOT NULL DEFAULT 0
);
`);

db.exec(`
CREATE TABLE IF NOT EXISTS wallet_transactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  player_id INTEGER,
  amount REAL NOT NULL,
  type TEXT NOT NULL,
  idempotency_key TEXT UNIQUE NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
`);

//Credit endpoint
app.post("/wallet/credit", (req, res) => {
  const { playerId, amount } = req.body;

  db.prepare(`
    INSERT INTO wallets (player_id, balance)
    VALUES (?, ?)
    ON CONFLICT(player_id) DO UPDATE SET balance = balance + excluded.balance
  `).run(playerId, amount);

  // Insert transaction record
  db.prepare(`
    INSERT INTO wallet_transactions (player_id, amount, type, idempotency_key)
    VALUES (?, ?, 'credit', ?)
  `).run(playerId, amount, `credit-${playerId}-${Date.now()}`);

  res.json({ success: true });
});


// Debit endpoint
app.post("/wallet/debit", (req, res) => {
  const { playerId, amount, idempotencyKey } = req.body;

  console.log("Debit request:", { playerId, amount, idempotencyKey });

  const tx = db.transaction(() => {
    const existing = db.prepare(
      "SELECT 1 FROM wallet_transactions WHERE idempotency_key = ?"
    ).get(idempotencyKey);

    if (existing) {
      console.log("Idempotency reused:", idempotencyKey);
      return { reused: true };
    }

    const wallet = db.prepare(
      "SELECT balance FROM wallets WHERE player_id = ?"
    ).get(playerId);

    if (!wallet || wallet.balance < amount) {
      console.log("INSUFFICIENT_FUNDS:", { playerId, balance: wallet?.balance });
      return { error: "INSUFFICIENT_FUNDS" };
    }

    db.prepare(
      "UPDATE wallets SET balance = balance - ? WHERE player_id = ?"
    ).run(amount, playerId);

    db.prepare(
      `INSERT INTO wallet_transactions (player_id, amount, type, idempotency_key)
       VALUES (?, ?, 'debit', ?)`
    ).run(playerId, amount, idempotencyKey);

    console.log("Debit success:", { playerId, newBalance: wallet.balance - amount });

    return { success: true };
  });

  const result = tx();
  res.json(result);
});


app.listen(3001, () => console.log("Wallet Service running on 3001"));
