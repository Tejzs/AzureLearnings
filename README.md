# BetWalletOdds

A microservices-based sportsbook platform built to learn cloud-native development on Microsoft Azure. The system simulates core sports betting infrastructure — live odds streaming, bet placement, and wallet management — across three independently deployable services.

## Architecture

```
┌─────────────────┐     Azure Event Hubs      ┌──────────────────┐
│   odds-api      │ ──── odds events ────────► │  bet-service     │
│  (producer)     │                            │  (consumer)      │
└─────────────────┘                            └──────────────────┘
                                                        │
                                               ┌──────────────────┐
                                               │  wallet-service  │
                                               │  (balance/funds) │
                                               └──────────────────┘
                                                        │
                                               ┌──────────────────┐
                                               │   Azure Redis    │
                                               │   (caching)      │
                                               └──────────────────┘
```

Each service is containerized with Docker and deployed to **Azure Container Apps**.

## Services

### `odds-api`
Produces live odds data and publishes events to Azure Event Hubs. Acts as the entry point for odds updates across the platform.

### `bet-service`
Consumes odds events from Event Hubs and handles bet placement logic. Communicates with the wallet service to verify and deduct user balances.

### `wallet-service`
Manages user wallet balances. Handles deposits, withdrawals, and balance checks. Uses **Azure Managed Redis** for fast balance caching.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js / JavaScript |
| Containerization | Docker |
| Cloud Platform | Microsoft Azure |
| Container Hosting | Azure Container Apps |
| Messaging | Azure Event Hubs |
| Caching | Azure Managed Redis |
| Container Registry | Azure Container Registry |
| Infrastructure | Kubernetes manifests (k8s/) |

## What I Learned

- Designing event-driven microservices with Azure Event Hubs (producer/consumer pattern)
- Containerizing Node.js services with Docker
- Deploying and managing services on Azure Container Apps
- Using Azure Managed Redis for distributed caching
- Securing secrets and managing environment configuration in cloud deployments
- Structuring a multi-service project with shared infrastructure (k8s manifests)
