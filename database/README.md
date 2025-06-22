# Database Schema

This directory contains the database schema and seed data for the Photo Portfolio application.

## Files

- `schema.sql` - Main database schema with all tables, indexes, and triggers
- `seed.sql` - Sample data for development and testing

## Tables

### users
- Stores photographer/admin user accounts
- Used for authentication and authorization

### clients
- Stores client information for photographers
- Each client can have multiple projects

### projects
- Represents photography projects (weddings, portraits, etc.)
- Links clients to their photo collections

### photos
- Stores photo metadata and Cloudinary references
- Actual image files are stored in Cloudinary
- Contains metadata like dimensions, file size, and tags

## Setup Instructions

1. Create a new Supabase project
2. Run the `schema.sql` file to create the database structure
3. Optionally run `seed.sql` to populate with sample data
4. Update your application's environment variables with Supabase credentials

## Security Notes

- All sensitive data (like passwords) should be properly hashed
- Row Level Security (RLS) policies should be implemented in Supabase
- API keys and database credentials should be stored securely