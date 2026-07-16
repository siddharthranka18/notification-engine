<p align="center">
  <img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=node.js&logoColor=white" />
  <img src="https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white" />
  <img src="https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white" />
  <img src="https://img.shields.io/badge/Redis-DC382D?style=for-the-badge&logo=redis&logoColor=white" />
  <img src="https://img.shields.io/badge/Socket.IO-010101?style=for-the-badge&logo=socket.io&logoColor=white" />
  <img src="https://img.shields.io/badge/Twilio-F22F46?style=for-the-badge&logo=twilio&logoColor=white" />
</p>

# 📬 Notification Engine

A **production-ready, queue-driven notification microservice** built with Node.js that delivers **email** and **SMS** notifications asynchronously via BullMQ. Features real-time delivery tracking through WebSockets, automatic retry with exponential backoff, permanent error detection, and a live dashboard for monitoring notification events.

> **Architecture:** HTTP server, BullMQ worker, and Socket.IO all run in a **single Node.js process**. The worker starts only after MongoDB connects successfully.

---

## ✨ Features

| Feature | Description |
|---|---|
| 📨 **Email Notifications** | Send transactional emails via Gmail SMTP using Nodemailer |
| 📱 **SMS Notifications** | Send text messages via Twilio's programmable SMS API |
| ⚡ **Async Job Queue** | BullMQ-powered queue backed by Upstash Redis for reliable, non-blocking delivery |
| 🔄 **Auto-Retry** | Failed jobs automatically retry up to 5 times with exponential backoff (2s → 4s → 8s → 16s → 32s) |
| 🛑 **Permanent Error Detection** | Skips retries for unrecoverable errors (unverified Twilio numbers, invalid phone/email) |
| 🔴 **Real-Time Updates** | Socket.IO broadcasts live delivery and failure events to connected clients |
| 📊 **Live Dashboard** | Built-in web-based feed showing ✅ Delivered / ❌ Failed status with error details |
| 🗄️ **Persistent History** | All notifications logged to MongoDB with status tracking (`pending` → `sent` / `failed`) |
| 📜 **Notification History API** | Query past notifications sorted by most recent |
| ✅ **Input Validation** | API returns `400` for missing or invalid `recipient`, `message`, or `type` fields |

---

## 🏗️ Architecture

```
┌────────────────┐       ┌──────────────────┐       ┌─────────────────────┐
│   REST Client  │──────▶│  Express Server  │──────▶│   BullMQ Queue      │
│  (POST /send)  │       │  + MongoDB Save  │       │  (Upstash Redis)    │
└────────────────┘       └──────────────────┘       └────────┬────────────┘
                                                             │
                                                             ▼
                                                    ┌─────────────────┐
                                                    │  BullMQ Worker  │
                                                    │  ┌───────────┐  │
                                                    │  │  Email    │  │◀── Nodemailer (Gmail SMTP)
                                                    │  │  Service  │  │
                                                    │  ├───────────┤  │
                                                    │  │  SMS      │  │◀── Twilio API
                                                    │  │  Service  │  │
                                                    │  └───────────┘  │
                                                    └────────┬────────┘
                                                             │
                                              ┌──────────────┼──────────────┐
                                              ▼              ▼              ▼
                                        ┌──────────┐  ┌───────────┐  ┌───────────┐
                                        │ MongoDB  │  │ Socket.IO │  │  Console  │
                                        │ (Update) │  │ (Emit)    │  │  (Log)    │
                                        └──────────┘  └───────────┘  └───────────┘
```

### Request Flow

1. **Client** sends a `POST /api/notifications/send` request with recipient, message, and type
2. **Express** validates input and saves the notification to MongoDB with `pending` status
3. **BullMQ** enqueues the job to the `notifications` queue via Upstash Redis
4. **API responds immediately** with `{ success: true }` — this means **queued**, not delivered
5. **Worker** (starts only after MongoDB connects) picks up the job and dispatches to Email or SMS
6. On **success**: MongoDB status updated to `sent`, Socket.IO emits `{ status: "delivered" }`
7. On **transient failure**: job retries with exponential backoff; status stays `pending` until the final attempt
8. On **permanent failure** (bad phone/email, unverified Twilio number): immediately marked `failed`, Socket.IO emits `{ status: "failed" }`
9. On **final retry failure**: MongoDB status updated to `failed` with error details, Socket.IO emits failure event

---

## 📁 Project Structure

```
notification-engine/
├── index.js                          # Entry point — Express, Socket.IO, MongoDB setup
├── package.json                      # Dependencies and scripts
├── .env                              # Environment variables (not committed)
├── .gitignore
├── public/
│   └── index.html                    # Live notification dashboard (WebSocket client)
└── src/
    ├── models/
    │   └── Notifications.js          # Mongoose schema (recipient, message, type, status)
    ├── queues/
    │   └── notificationQueue.js      # BullMQ queue instance (Upstash Redis connection)
    ├── routes/
    │   └── notificationRoutes.js     # REST API — POST /send, GET /history
    ├── services/
    │   ├── emailServices.js          # Nodemailer transporter (Gmail SMTP)
    │   └── smsService.js             # Twilio SMS client
    └── workers/
        └── notificationWorker.js     # BullMQ worker — processes jobs, handles retries
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** v18+
- **MongoDB** instance (local or [MongoDB Atlas](https://www.mongodb.com/atlas))
- **Upstash Redis** account ([upstash.com](https://upstash.com)) or any Redis instance
- **Gmail App Password** ([Generate here](https://myaccount.google.com/apppasswords))
- **Twilio Account** ([twilio.com](https://www.twilio.com)) with a phone number

### 1. Clone the Repository

```bash
git clone https://github.com/siddharthranka18/notification-engine.git
cd notification-engine
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create a `.env` file in the project root:

```env
PORT=3000
MONGO_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/notification-engine
UPSTASH_REDIS_URL=rediss://default:<token>@<host>.upstash.io:6379

# Email (Gmail SMTP)
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-gmail-app-password

# Twilio SMS
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1XXXXXXXXXX
```

### 4. Start the Server

```bash
node index.js
```

The server will start on `http://localhost:3000`.  
Visit the root URL to see the **Live Notification Dashboard**.

---

## 📡 API Reference

### Send a Notification

```http
POST /api/notifications/send
Content-Type: application/json
```

**Request Body:**

```json
{
  "recipient": "user@example.com",
  "message": "Your order has been shipped!",
  "type": "email"
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `recipient` | `string` | ✅ | Email address or phone number (E.164 format for SMS) |
| `message` | `string` | ✅ | Notification content |
| `type` | `string` | ✅ | `"email"` or `"sms"` |

**Success Response (HTTP 200):**

```json
{
  "success": true,
  "message": "Notification queued successfully",
  "id": "665f1a2b3c4d5e6f7a8b9c0d"
}
```

> **Note:** This response confirms the notification was **queued**, not delivered. Check `GET /history` or the live dashboard for actual delivery status.

**Validation Error (HTTP 400):**

```json
{
  "error": "recipient, message, and type (email|sms) are required"
}
```

---

### Get Notification History

```http
GET /api/notifications/history
```

**Response:**

```json
[
  {
    "_id": "665f1a2b3c4d5e6f7a8b9c0d",
    "recipient": "user@example.com",
    "message": "Your order has been shipped!",
    "type": "email",
    "status": "sent",
    "retryCount": 0,
    "createdAt": "2025-06-04T10:30:00.000Z"
  },
  {
    "_id": "665f1a2b3c4d5e6f7a8b9c0e",
    "recipient": "+91XXXXXXXXXX",
    "message": "Test SMS",
    "type": "sms",
    "status": "failed",
    "retryCount": 4,
    "error": "The number +91XXXXXXXXXX is unverified...",
    "createdAt": "2025-06-04T10:31:00.000Z"
  }
]
```

| `status` | Meaning |
|---|---|
| `pending` | Queued or retrying |
| `sent` | Delivered successfully |
| `failed` | Permanently failed after all retries or a permanent error |

---

### Real-Time Events (Socket.IO)

Connect to the server via Socket.IO to receive live delivery updates:

```javascript
const socket = io("http://localhost:3000");

socket.on("notification", (data) => {
  console.log(data);
  // Success: { status: "delivered", type: "email", recipient: "user@example.com", message: "..." }
  // Failure: { status: "failed", type: "sms", recipient: "+91...", message: "...", error: "..." }
});
```

| `status` | When emitted |
|---|---|
| `delivered` | Worker successfully sent the notification |
| `failed` | Permanent error or all retry attempts exhausted |

> Events are emitted in real time only — the dashboard does not replay past notifications on connect.

---

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Runtime** | Node.js | JavaScript runtime |
| **Framework** | Express 5 | HTTP server and REST API routing |
| **Database** | MongoDB + Mongoose | Notification persistence and status tracking |
| **Job Queue** | BullMQ + Upstash Redis | Async message processing with retry logic |
| **Email** | Nodemailer | Gmail SMTP transport |
| **SMS** | Twilio | Programmable SMS API |
| **Real-Time** | Socket.IO | WebSocket-based live notification feed |
| **Config** | dotenv | Environment variable management |

---

## 🔄 Retry & Error Handling

The BullMQ worker is configured with automatic retry on failure:

| Parameter | Value | Description |
|---|---|---|
| `attempts` | `5` | Maximum retry attempts per job |
| `backoff.type` | `exponential` | Backoff strategy |
| `backoff.delay` | `2000ms` | Base delay (doubles each retry: 2s → 4s → 8s → 16s → 32s) |
| `concurrency` | `10` | Worker processes up to 10 jobs in parallel |
| `removeOnComplete` | `100` | Keeps last 100 completed jobs in Redis |
| `removeOnFail` | `200` | Keeps last 200 failed jobs in Redis for inspection |

### Failure behavior

- **On success**: Notification status updated to `sent`, live feed emits `delivered`
- **On transient failure** (network timeout, SMTP error): job retries; MongoDB status stays `pending` until the final attempt
- **On permanent failure** (unverified Twilio number, invalid phone/email): immediately marked `failed`, no retries, live feed emits `failed`
- **On final retry failure**: status updated to `failed` with `error` message and `retryCount`, live feed emits `failed`

### Permanent errors (no retry)

| Error pattern | Example |
|---|---|
| `unverified` | Twilio trial account sending to unverified number |
| `Invalid phone` | Malformed phone number |
| `not a valid email` | Malformed email address |

---

## 🌐 Live Dashboard

The built-in dashboard at `http://localhost:3000` provides a real-time feed of dispatched notifications. It connects via Socket.IO and displays:

- **Delivery status** — ✅ Delivered (green) or ❌ Failed (red)
- **Notification type** — Email or SMS
- **Recipient**
- **Message content**
- **Error message** — shown in red when delivery fails
- **Timestamp**

### Usage

1. Start the server with `node index.js`
2. Open `http://localhost:3000` in your browser
3. Wait for **"Connected — waiting for notifications"**
4. Send a notification via Postman or API — the event appears after the worker completes

> The dashboard only shows **new events in real time**. Open it **before** sending notifications to catch all events. Postman does not receive Socket.IO events.

---

## 📄 License

This project is licensed under the [ISC License](https://opensource.org/licenses/ISC).

---

<p align="center">
  Built with ❤️ by <a href="https://github.com/siddharthranka18">Siddharth Ranka</a>
</p>