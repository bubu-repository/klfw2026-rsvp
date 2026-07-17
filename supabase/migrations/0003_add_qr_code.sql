-- Add QR code column to store PNG binary
ALTER TABLE guests ADD COLUMN IF NOT EXISTS qr_code BYTEA;
