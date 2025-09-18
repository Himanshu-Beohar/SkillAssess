# SkillAssess - Online Assessment Platform

A comprehensive online assessment platform built with Node.js, Express, PostgreSQL, and vanilla JavaScript. Supports free and premium assessments with Razorpay payment integration.

## Features

- **User Authentication**: Register, login, and profile management
- **Assessment Management**: Create and take assessments
- **Payment Integration**: Razorpay integration for premium assessments
- **Results & Analytics**: Detailed performance tracking
- **Responsive Design**: Mobile-friendly interface
- **PostgreSQL Database**: Scalable data storage

## Tech Stack

- **Backend**: Node.js, Express.js
- **Database**: PostgreSQL
- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **Payment**: Razorpay
- **Deployment**: Railway-ready

## Project Structure

skillassess/
├── public/ # Frontend static files
│ ├── css/
│ ├── js/
│ │ ├── components/
│ │ ├── pages/
│ │ └── *.js
│ └── index.html
├── server/ # Backend source
│ ├── config/
│ ├── controllers/
│ ├── middleware/
│ ├── models/
│ ├── routes/
│ ├── utils/
│ └── server.js
├── migrations/ # Database migrations
├── .env # Environment variables
├── package.json # Root package.json
└── README.md

text

## Setup Instructions

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd skillassess
Install dependencies

bash
npm run install-deps
Set up environment variables

bash
cp .env.example .env
# Edit .env with your configuration
Set up PostgreSQL database

bash
# Create database manually or use Railway
Run database migrations

bash
# Run the SQL files in migrations/ folder
Start the development server

bash
npm run dev
Deployment on Railway
Create Railway account

Sign up at railway.app

Create new project

Connect your GitHub repository

Or use Railway CLI

Set up PostgreSQL

Add PostgreSQL service in Railway

Database URL will be automatically provided

Configure environment variables

Add all variables from .env.example in Railway dashboard

Deploy

Railway will automatically deploy on git push

Or use railway up command

Environment Variables
env
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://username:password@localhost:5432/skillassess
JWT_SECRET=your-jwt-secret
JWT_EXPIRE=7d
RAZORPAY_KEY_ID=your-razorpay-key-id
RAZORPAY_KEY_SECRET=your-razorpay-key-secret
CLIENT_URL=http://localhost:3000

API Endpoints
GET /api/health - Health check

POST /api/auth/register - User registration

POST /api/auth/login - User login

GET /api/assessments - Get all assessments

POST /api/payments/create-order - Create payment order

POST /api/results/submit - Submit assessment results

License
MIT License - see LICENSE file for details.

text

This completes all the essential files for your SkillAssess application. The project is now structured for deployment on Railway with PostgreSQL database support.

## Next Steps:

1. **Set up your PostgreSQL database** (locally or on Railway)
2. **Run the database migrations** (execute the SQL files in order)
3. **Configure your environment variables** in the `.env` file
4. **Install dependencies**: `npm run install-deps`
5. **Start the application**: `npm run dev`
6. **Test the application** locally before deploying to Railway

The application includes all the necessary components for user authentication, assessment management, payment processing, and result tracking. It's ready for production deployment on Railway!