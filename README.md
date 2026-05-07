# TaskFlow — Team Task Manager

A full-stack team task management application with role-based access control, project management, task tracking, and an analytics dashboard.

---

## Features

- **Authentication** — Signup, Login, JWT-based sessions, persistent login
- **Project Management** — Create, edit, delete projects; archive/restore
- **Team Management** — Add/remove members per project; assign project roles
- **Task Tracking** — Create, assign, filter, sort tasks with priorities and due dates
- **RBAC** — Admin vs Member roles at both global and project levels
- **Dashboard** — Overview of projects, task stats, overdue tasks, personal task breakdown
- **Responsive UI** — Sidebar layout, mobile-friendly with Tailwind CSS

---

## Tech Stack

| Layer      | Technology                          |
|------------|--------------------------------------|
| Frontend   | React 18, Vite, Tailwind CSS, Axios  |
| Backend    | Node.js, Express.js                  |
| Database   | MongoDB + Mongoose                   |
| Auth       | JWT + bcryptjs                       |
| Security   | Helmet, express-rate-limit, CORS     |
| Deployment | Railway                              |

---

## Project Structure

```
team-task-manager/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── db.js                  # MongoDB connection
│   │   ├── controllers/
│   │   │   ├── authController.js
│   │   │   ├── projectController.js
│   │   │   ├── taskController.js
│   │   │   ├── dashboardController.js
│   │   │   └── userController.js
│   │   ├── middleware/
│   │   │   ├── auth.js                # JWT protect + role check
│   │   │   ├── errorHandler.js        # Global error handler
│   │   │   └── validators.js          # express-validator rules
│   │   ├── models/
│   │   │   ├── User.js
│   │   │   ├── Project.js
│   │   │   └── Task.js
│   │   ├── routes/
│   │   │   ├── authRoutes.js
│   │   │   ├── projectRoutes.js
│   │   │   ├── taskRoutes.js
│   │   │   ├── userRoutes.js
│   │   │   └── dashboardRoutes.js
│   │   ├── utils/
│   │   │   └── helpers.js             # sendResponse, asyncHandler
│   │   ├── app.js
│   │   └── server.js
│   ├── .env.example
│   ├── package.json
│   └── railway.json
│
└── frontend/
    ├── src/
    │   ├── api/
    │   │   ├── axios.js               # Axios instance + interceptors
    │   │   └── services.js            # All API calls
    │   ├── components/
    │   │   ├── common/
    │   │   │   ├── Badges.jsx
    │   │   │   ├── EmptyState.jsx
    │   │   │   ├── LoadingSpinner.jsx
    │   │   │   ├── Modal.jsx
    │   │   │   └── StatCard.jsx
    │   │   └── layout/
    │   │       ├── Navbar.jsx
    │   │       └── Sidebar.jsx
    │   ├── context/
    │   │   └── AuthContext.jsx
    │   ├── hooks/
    │   │   └── useApi.js
    │   ├── layouts/
    │   │   └── AppLayout.jsx
    │   ├── pages/
    │   │   ├── Login.jsx
    │   │   ├── Signup.jsx
    │   │   ├── Dashboard.jsx
    │   │   ├── Projects.jsx
    │   │   ├── ProjectDetail.jsx
    │   │   ├── Tasks.jsx
    │   │   ├── Profile.jsx
    │   │   └── NotFound.jsx
    │   ├── routes/
    │   │   └── RouteGuards.jsx
    │   ├── App.jsx
    │   ├── main.jsx
    │   └── index.css
    ├── .env.example
    ├── package.json
    ├── vite.config.js
    ├── tailwind.config.js
    └── railway.json
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB (local or MongoDB Atlas)

### 1. Clone the repository

```bash
git clone https://github.com/yourusername/team-task-manager.git
cd team-task-manager
```

### 2. Backend setup

```bash
cd backend
cp .env.example .env
# Edit .env with your values
npm install
npm run dev
```

### 3. Frontend setup

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

### 4. Open the app

- Frontend: http://localhost:5173
- Backend API: http://localhost:5000/api/health

---

## Environment Variables

### Backend (`backend/.env`)

| Variable        | Description                         | Example                              |
|-----------------|-------------------------------------|--------------------------------------|
| `PORT`          | Server port                         | `5000`                               |
| `MONGODB_URI`   | MongoDB connection string           | `mongodb://localhost:27017/taskflow` |
| `JWT_SECRET`    | Secret for signing JWTs             | `a-long-random-secret`               |
| `JWT_EXPIRES_IN`| Token expiry duration               | `7d`                                 |
| `CLIENT_URL`    | Allowed CORS origin                 | `http://localhost:5173`              |
| `NODE_ENV`      | Environment mode                    | `development` / `production`         |

### Frontend (`frontend/.env`)

| Variable       | Description               | Example                        |
|----------------|---------------------------|--------------------------------|
| `VITE_API_URL` | Backend API base URL      | `http://localhost:5000/api`    |

> **Note:** The Vite dev server proxies `/api` to `http://localhost:5000` so no `.env` change is needed locally.

---

## API Overview

### Auth
| Method | Endpoint            | Description         |
|--------|---------------------|---------------------|
| POST   | `/api/auth/signup`  | Register new user   |
| POST   | `/api/auth/login`   | Login user          |
| GET    | `/api/auth/me`      | Get current user    |

### Projects
| Method | Endpoint                          | Description               |
|--------|-----------------------------------|---------------------------|
| GET    | `/api/projects`                   | List user's projects      |
| POST   | `/api/projects`                   | Create project            |
| GET    | `/api/projects/:id`               | Get single project        |
| PUT    | `/api/projects/:id`               | Update project            |
| DELETE | `/api/projects/:id`               | Delete project + tasks    |
| POST   | `/api/projects/:id/members`       | Add member by email       |
| DELETE | `/api/projects/:id/members/:uid`  | Remove member             |

### Tasks
| Method | Endpoint                                       | Description              |
|--------|------------------------------------------------|--------------------------|
| GET    | `/api/projects/:id/tasks`                      | List tasks (filterable)  |
| POST   | `/api/projects/:id/tasks`                      | Create task              |
| GET    | `/api/projects/:id/tasks/:taskId`              | Get single task          |
| PUT    | `/api/projects/:id/tasks/:taskId`              | Update task              |
| DELETE | `/api/projects/:id/tasks/:taskId`              | Delete task              |

**Task filter query params:** `status`, `priority`, `search`, `sortBy`, `order`, `page`, `limit`

### Dashboard
| Method | Endpoint           | Description              |
|--------|--------------------|--------------------------|
| GET    | `/api/dashboard`   | Aggregated stats         |

### Users
| Method | Endpoint              | Description             |
|--------|-----------------------|-------------------------|
| GET    | `/api/users`          | List all users          |
| PUT    | `/api/users/profile`  | Update own name         |
| PUT    | `/api/users/password` | Change own password     |

---

## Role-Based Access Control

### Global Roles
- **Admin** — Full access; can see all projects and all data
- **Member** — Limited to projects they belong to

### Project-Level Roles
- **Project Admin** — Full CRUD on project, tasks, and members
- **Project Member** — Read tasks; update status on assigned tasks only

---

## Railway Deployment

### Deploy Backend

1. Create a new Railway project → **New Service → GitHub Repo** → select `backend/`
2. Add environment variables (see table above)
3. Set root directory to `backend`
4. Railway auto-detects Node.js and runs `node src/server.js`

### Deploy Frontend

1. Add another service → select `frontend/`
2. Set root directory to `frontend`
3. Set `VITE_API_URL` to your deployed backend URL
4. Build command: `npm run build`
5. Start command: `npx serve -s dist -l 3000`

### MongoDB on Railway

1. Add a MongoDB plugin in Railway
2. Copy the `MONGODB_URI` from the plugin to your backend service variables

---

## Screenshots

> _Add screenshots here after deployment_

| Page        | Description              |
|-------------|--------------------------|
| Dashboard   | Overview with stats      |
| Projects    | Project cards + progress |
| Tasks       | Task list with filters   |
| Project     | Members management       |

---




## License

MIT
