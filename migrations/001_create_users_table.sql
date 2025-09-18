-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Insert admin user (password: admin123)
INSERT INTO users (email, password, name) 
VALUES ('admin@skillassess.com', '$2a$10$rOzZzJ9ZcG39W2h6VqVZMeO6Vz9q9Q1Xq9Q1Xq9Q1Xq9Q1Xq9Q1Xq9', 'Admin User')
ON CONFLICT (email) DO NOTHING;