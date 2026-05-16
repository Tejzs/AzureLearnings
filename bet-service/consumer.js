const { EventHubConsumerClient } = require("@azure/event-hubs");
require("dotenv").config();

const consumer = new EventHubConsumerClient(
  "$Default",
  process.env.EVENT_HUB_CONNECTION_STRING,
  process.env.EVENT_HUB_NAME
);

async function startConsuming() {
  console.log("Listening for odds events...");

  consumer.subscribe({
    processEvents: async (events) => {
      for (const event of events) {
        const { matchId, price, timestamp } = event.body;
        console.log(`Received odds update — ${matchId}: ${price} at ${timestamp}`);
        // You could write to a local cache here if needed
      }
    },
    processError: async (err) => {
      console.error("Consumer error:", err);
    }
  });
}

startConsuming();
