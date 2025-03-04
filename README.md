# Skill-Tracker
App for setting goals and tracking progress for learning new skills for kids.

## Features

- Simple username-based authentication (no password required)
- Track progress with levels and experience points
- Unlock skills as you gain experience
- Customize your skill tree by dragging and dropping skills
- Admin panel for managing levels and skills

## Getting Started

### Prerequisites

- Node.js 16+ and npm
- PostgreSQL database

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/skill-tracker.git
cd skill-tracker
```

2. Install dependencies:
```bash
npm install
```

3. Set up your environment variables:
   - Copy `.env.example` to `.env` (or create a new `.env` file)
   - Update the `DATABASE_URL` with your PostgreSQL connection string
   - Set a secure `NEXTAUTH_SECRET` for session encryption

4. Set up the database:
```bash
# Generate Prisma client
npm run prisma:generate

# Create database tables
npm run prisma:migrate

# Seed the database with initial data
npm run prisma:seed
```

5. Start the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

### Authentication

- Users can log in by simply entering their username
- If the username doesn't exist, a new account is created automatically
- Sessions persist until the user logs out or closes the browser

### Admin Access

- Log in with the username "admin" to access the admin panel
- Admin can create, edit, and delete levels and skills
- Admin can set experience requirements for levels and skills

### Skill Tree

- Users can customize their skill tree by dragging and dropping skills
- Each level has a limited number of skill slots
- Progress is tracked based on the user's custom skill tree

## License

This project is licensed under the MIT License - see the LICENSE file for details. 
