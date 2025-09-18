-- Create payments table
CREATE TABLE IF NOT EXISTS payments (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    assessment_id INTEGER REFERENCES assessments(id),
    amount DECIMAL(10, 2) NOT NULL,
    razorpay_order_id VARCHAR(255) UNIQUE NOT NULL,
    razorpay_payment_id VARCHAR(255),
    razorpay_signature VARCHAR(255),
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_assessment_id ON payments(assessment_id);
CREATE INDEX IF NOT EXISTS idx_payments_order_id ON payments(razorpay_order_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);

-- Create composite index for common queries
CREATE INDEX IF NOT EXISTS idx_payments_user_assessment ON payments(user_id, assessment_id);

-- Insert sample payment (for demonstration)
INSERT INTO payments (user_id, assessment_id, amount, razorpay_order_id, status) VALUES
(1, 2, 499, 'order_sample_123', 'completed')
ON CONFLICT DO NOTHING;