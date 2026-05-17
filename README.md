<p align="center">
  <img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=node.js&logoColor=white" />
  <img src="https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white" />
  <img src="https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white" />
  <img src="https://img.shields.io/badge/Redis-DC382D?style=for-the-badge&logo=redis&logoColor=white" />
  <img src="https://img.shields.io/badge/Socket.IO-010101?style=for-the-badge&logo=socket.io&logoColor=white" />
  <img src="https://img.shields.io/badge/Twilio-F22F46?style=for-the-badge&logo=twilio&logoColor=white" />
</p>

# 📬 Notification Engine

A **production-ready, queue-driven notification microservice** built with Node.js that delivers **email** and **SMS** notifications asynchronously via BullMQ. Features real-time delivery tracking through WebSockets, automatic retry with exponential backoff, and a live dashboard for monitoring notification events.

---

## ✨ Features

| Feature | Description |
|---|---|
| 📨 **Email Notifications** | Send transactional emails via Gmail SMTP using Nodemailer |
| 📱 **SMS Notifications** | Send text messages via Twilio's programmable SMS API |
| ⚡ **Async Job Queue** | BullMQ-powered queue backed by Upstash Redis for reliable, non-blocking delivery |
| 🔄 **Auto-Retry** | Failed jobs automatically retry up to 3 times with exponential backoff (1s, 2s, 4s) |
| 🔴 **Real-Time Updates** | Socket.IO broadcasts live delivery events to connected clients |
| 📊 **Live Dashboard** | Built-in web-based notification feed at the root URL |
| 🗄️ **Persistent History** | All notifications logged to MongoDB with status tracking (`pending` → `sent` / `failed`) |
| 📜 **Notification History API** | Query past notifications sorted by most recent |

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
2. **Express** saves the notification to MongoDB with `pending` status
3. **BullMQ** enqueues the job to the `notifications` queue via Upstash Redis
4. **Worker** picks up the job and dispatches it to the appropriate service (Email or SMS)
5. On **success**: MongoDB status updated to `sent`, Socket.IO emits a real-time event
6. On **failure**: MongoDB status updated to `failed` with error details, job retries automatically

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

**Response:**

```json
{
  "success": true,
  "message": "Notification queued successfully",
  "id": "665f1a2b3c4d5e6f7a8b9c0d"
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
  }
]
```

---

### Real-Time Events (Socket.IO)

Connect to the server via Socket.IO to receive live delivery updates:

```javascript
const socket = io("http://localhost:3000");

socket.on("notification", (data) => {
  console.log(data);
  // { status: "delivered", type: "email", recipient: "user@example.com", message: "..." }
});
```

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
| `attempts` | `3` | Maximum retry attempts per job |
| `backoff.type` | `exponential` | Backoff strategy |
| `backoff.delay` | `1000ms` | Base delay (doubles each retry: 1s → 2s → 4s) |

- **On success**: Notification status is updated to `sent` in MongoDB
- **On failure**: Status is updated to `failed`, error message and `retryCount` are persisted

---

## 🌐 Live Dashboard

The built-in dashboard at `http://localhost:3000` provides a real-time feed of all dispatched notifications. It connects via Socket.IO and displays:

- Notification type (Email / SMS)
- Recipient
- Message content
- Timestamp

No setup required — just open the root URL after starting the server.

---

## 📄 License

This project is licensed under the [ISC License](https://opensource.org/licenses/ISC).

---

<p align="center">
  Built with ❤️ by <a href="https://github.com/siddharthranka18">Siddharth Ranka</a>
</p>