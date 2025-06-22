-- Seed data for development and testing

-- Insert sample photographer user
INSERT INTO users (id, email, password_hash, first_name, last_name, role) VALUES
    ('550e8400-e29b-41d4-a716-446655440000', 'photographer@example.com', '$2b$10$example_hash_here', 'John', 'Photographer', 'photographer'),
    ('550e8400-e29b-41d4-a716-446655440001', 'admin@example.com', '$2b$10$example_hash_here', 'Admin', 'User', 'admin');

-- Insert sample clients
INSERT INTO clients (id, first_name, last_name, email, phone, address, notes, created_by) VALUES
    ('660e8400-e29b-41d4-a716-446655440000', 'Jane', 'Smith', 'jane.smith@example.com', '+1234567890', '123 Main St, City, State', 'Wedding photography client', '550e8400-e29b-41d4-a716-446655440000'),
    ('660e8400-e29b-41d4-a716-446655440001', 'Bob', 'Johnson', 'bob.johnson@example.com', '+1234567891', '456 Oak Ave, City, State', 'Corporate headshots', '550e8400-e29b-41d4-a716-446655440000'),
    ('660e8400-e29b-41d4-a716-446655440002', 'Alice', 'Williams', 'alice.williams@example.com', '+1234567892', '789 Pine St, City, State', 'Family portrait session', '550e8400-e29b-41d4-a716-446655440000');

-- Insert sample projects
INSERT INTO projects (id, title, description, project_type, status, shoot_date, delivery_date, client_id, created_by) VALUES
    ('770e8400-e29b-41d4-a716-446655440000', 'Smith Wedding 2024', 'Beautiful outdoor wedding ceremony and reception', 'Wedding', 'active', '2024-07-15', '2024-08-15', '660e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440000'),
    ('770e8400-e29b-41d4-a716-446655440001', 'Corporate Headshots - Johnson', 'Professional headshots for LinkedIn and company website', 'Corporate', 'completed', '2024-06-01', '2024-06-15', '660e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440000'),
    ('770e8400-e29b-41d4-a716-446655440002', 'Williams Family Portrait', 'Annual family portrait session in the park', 'Portrait', 'active', '2024-07-01', '2024-07-20', '660e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440000');

-- Note: Photos will be inserted when actual files are uploaded through the API