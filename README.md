# 🩸 RAQT — Blood Donation Management System (Phase 1)

A full-stack MERN application connecting blood donors with hospitals.
Built with **MongoDB, Express.js, React (Vite), and Node.js**.

---

## 📁 Project Structure

```
BloodDonation/
├── server/                   # Node.js + Express backend
│   ├── config/
│   │   └── db.js             # MongoDB connection
│   ├── middleware/
│   │   ├── auth.js           # JWT verification middleware
│   │   └── rbac.js           # Role-Based Access Control guard
│   ├── models/
│   │   ├── User.js           # User schema (name, email, password, role)
│   │   ├── DonorProfile.js   # Donor profile (blood_group, contact, last_donation_date)
│   │   └── DoctorProfile.js  # Doctor profile (hospital_name, contact)
│   ├── routes/
│   │   ├── auth.js           # POST /register, /login, /logout
│   │   └── profile.js        # GET/PUT /profile
│   ├── .env                  # Environment variables
│   ├── index.js              # Express entry point
│   └── package.json
│
└── client/                   # React (Vite) frontend
    ├── src/
    │   ├── context/
    │   │   └── AuthContext.jsx      # Auth state (login/logout/register)
    │   ├── components/
    │   │   ├── Navbar.jsx           # Navigation bar
    │   │   └── ProtectedRoute.jsx   # Route guard with RBAC
    │   ├── pages/
    │   │   ├── Login.jsx            # Login form
    │   │   ├── Register.jsx         # Registration with role selector
    │   │   ├── DonorDashboard.jsx   # Donor portal
    │   │   └── DoctorDashboard.jsx  # Doctor portal
    │   ├── services/
    │   │   └── api.js               # Axios instance with JWT interceptor
    │   ├── App.jsx                  # Router + protected routes
    │   ├── main.jsx                 # React entry
    │   └── index.css                # Premium dark theme CSS
    ├── index.html
    ├── vite.config.js
    └── package.json
```

---

## ⚙️ Setup & Installation

### Prerequisites
- **Node.js** v18+
- **MongoDB** (local or [MongoDB Atlas](https://www.mongodb.com/atlas))
- **npm** v9+

### 1. Clone or navigate to the project

### 2. Backend Setup
```bash
cd server
npm install
```

Edit `.env` and set your MongoDB URI:
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/blooddonation
JWT_SECRET=your_super_secret_key_here
JWT_EXPIRE=7d
NODE_ENV=development
```

Start the server:
```bash
npm run dev      # with nodemon (recommended)
# or
npm start        # with node
```

### 3. Frontend Setup
```bash
cd client
npm install
npm run dev      # starts on http://localhost:5173
```

---

## 🌐 API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | ❌ | Register donor or doctor |
| POST | `/api/auth/login` | ❌ | Login, returns JWT token |
| POST | `/api/auth/logout` | ❌ | Logout (client-side) |
| GET | `/api/users/profile` | ✅ JWT | Fetch current user + profile |
| PUT | `/api/users/profile` | ✅ JWT | Update current user + profile |
| GET | `/api/health` | ❌ | Health check |

### Register Payload Examples

**Donor:**
```json
{
  "name": "Ravi Kumar",
  "email": "ravi@example.com",
  "password": "password123",
  "role": "donor",
  "blood_group": "B+",
  "contact": "9876543210"
}
```

**Doctor:**
```json
{
  "name": "Dr. Priya Sharma",
  "email": "priya@hospital.com",
  "password": "password123",
  "role": "doctor",
  "hospital_name": "Apollo Hospital",
  "contact": "9876543210"
}
```

---

## 🗄️ Database Schema (MongoDB/Mongoose)

### Users
```
_id, name, email, password (hashed), role (donor|doctor), timestamps
```

### DonorProfile
```
_id, user (FK → User), blood_group, contact, photo, last_donation_date, timestamps
```

### DoctorProfile
```
_id, user (FK → User), hospital_name, contact, timestamps
```

> Equivalent SQL for relational reference is documented in the architecture notes.

---

## 🔐 Authentication

- **JWT (JSON Web Tokens)** stored in `localStorage`
- Passwords hashed with **bcryptjs** (salt rounds: 12)
- Token attached to all protected requests via `Authorization: Bearer <token>`
- Auto-logout on token expiry (intercepted by Axios)

---

## 🏗️ System Architecture

```
                    ┌─────────────────────────┐
                    │    React (Vite) :5173    │
                    │  Login | Register | Dash │
                    └──────────┬──────────────┘
                               │ HTTP + JWT
                    ┌──────────▼──────────────┐
                    │  Express.js API  :5000   │
                    │  /api/auth | /api/users  │
                    │  bcrypt | JWT | RBAC     │
                    └──────────┬──────────────┘
                               │ Mongoose ODM
                    ┌──────────▼──────────────┐
                    │  MongoDB                │
                    │  users | donor_profiles  │
                    │  doctor_profiles         │
                    └──────────────────────────┘
```

---

## 🎯 Phase 1 Deliverables — Completion Status

| Feature | Status |
|---------|--------|
| System Architecture (3-tier) | ✅ |
| MongoDB Schema Design | ✅ |
| User registration (Donor/Doctor) | ✅ |
| JWT Authentication | ✅ |
| Password hashing (bcrypt) | ✅ |
| RBAC Middleware | ✅ |
| GET /profile API | ✅ |
| PUT /profile API | ✅ |
| Registration Page (with role selection) | ✅ |
| Login Page | ✅ |
| Donor Dashboard | ✅ |
| Doctor Dashboard | ✅ |
| Form validation | ✅ |
| Secure token storage | ✅ |
| Role-based routing | ✅ |
