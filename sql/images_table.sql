-- Drop the images table if it exists
DROP TABLE IF EXISTS images;

-- Recreate the images table
CREATE TABLE images (
    id INTEGER PRIMARY KEY,
    filename TEXT,
    url TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
