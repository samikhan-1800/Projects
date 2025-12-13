-- Contact Form Submissions Table
CREATE TABLE IF NOT EXISTS ContactSubmissions (
    contactId INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    subject VARCHAR(50) NOT NULL,
    message TEXT NOT NULL,
    newsletter BOOLEAN DEFAULT FALSE,
    status ENUM('New', 'Read', 'Replied', 'Resolved') DEFAULT 'New',
    adminNotes TEXT,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_status (status),
    INDEX idx_created (createdAt)
);
