const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// Submit contact form (public)
router.post('/submit', async (req, res) => {
    try {
        const { name, email, phone, subject, message, newsletter } = req.body;

        // Validation
        if (!name || !email || !subject || !message) {
            return res.status(400).json({ 
                error: 'Name, email, subject, and message are required' 
            });
        }

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ error: 'Invalid email format' });
        }

        const query = `
            INSERT INTO ContactSubmissions 
            (name, email, phone, subject, message, newsletter) 
            VALUES (@name, @email, @phone, @subject, @message, @newsletter);
            SELECT SCOPE_IDENTITY() AS contactId;
        `;

        const result = await db.query(query, {
            name: name.trim(),
            email: email.trim(),
            phone: phone ? phone.trim() : null,
            subject: subject,
            message: message.trim(),
            newsletter: newsletter ? 1 : 0
        });

        res.status(201).json({
            message: 'Contact form submitted successfully',
            contactId: result.recordset[0].contactId
        });
    } catch (error) {
        console.error('Error submitting contact form:', error);
        res.status(500).json({ error: 'Failed to submit contact form' });
    }
});

// Get all contact submissions (admin only)
router.get('/', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { status, limit = 100, offset = 0 } = req.query;

        let query = 'SELECT * FROM ContactSubmissions';
        const params = {};

        if (status) {
            query += ' WHERE status = @status';
            params.status = status;
        }

        query += ' ORDER BY createdAt DESC OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY';
        params.offset = parseInt(offset);
        params.limit = parseInt(limit);

        const result = await db.query(query, params);
        const contacts = result.recordset;

        // Get total count
        let countQuery = 'SELECT COUNT(*) as total FROM ContactSubmissions';
        const countParams = {};
        if (status) {
            countQuery += ' WHERE status = @status';
            countParams.status = status;
        }
        const countResult = await db.query(countQuery, countParams);

        res.json({
            contacts,
            total: countResult.recordset[0].total,
            limit: parseInt(limit),
            offset: parseInt(offset)
        });
    } catch (error) {
        console.error('Error fetching contacts:', error);
        res.status(500).json({ error: 'Failed to fetch contacts' });
    }
});

// Get single contact submission (admin only)
router.get('/:contactId', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { contactId } = req.params;

        const result = await db.query(
            'SELECT * FROM ContactSubmissions WHERE contactId = @contactId',
            { contactId: parseInt(contactId) }
        );

        if (result.recordset.length === 0) {
            return res.status(404).json({ error: 'Contact submission not found' });
        }

        res.json(result.recordset[0]);
    } catch (error) {
        console.error('Error fetching contact:', error);
        res.status(500).json({ error: 'Failed to fetch contact' });
    }
});

// Update contact status (admin only)
router.put('/:contactId', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { contactId } = req.params;
        const { status, adminNotes } = req.body;

        const validStatuses = ['New', 'Read', 'Replied', 'Resolved'];
        if (status && !validStatuses.includes(status)) {
            return res.status(400).json({ error: 'Invalid status' });
        }

        const updates = [];
        const params = { contactId: parseInt(contactId) };

        if (status) {
            updates.push('status = @status');
            params.status = status;
        }

        if (adminNotes !== undefined) {
            updates.push('adminNotes = @adminNotes');
            params.adminNotes = adminNotes;
        }

        if (updates.length === 0) {
            return res.status(400).json({ error: 'No updates provided' });
        }

        const query = `
            UPDATE ContactSubmissions 
            SET ${updates.join(', ')} 
            WHERE contactId = @contactId
        `;

        await db.query(query, params);

        res.json({ message: 'Contact updated successfully' });
    } catch (error) {
        console.error('Error updating contact:', error);
        res.status(500).json({ error: 'Failed to update contact' });
    }
});

// Delete contact submission (admin only)
router.delete('/:contactId', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { contactId } = req.params;

        await db.query(
            'DELETE FROM ContactSubmissions WHERE contactId = @contactId',
            { contactId: parseInt(contactId) }
        );

        res.json({ message: 'Contact deleted successfully' });
    } catch (error) {
        console.error('Error deleting contact:', error);
        res.status(500).json({ error: 'Failed to delete contact' });
    }
});

// Get contact statistics (admin only)
router.get('/stats/summary', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const result = await db.query(`
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN status = 'New' THEN 1 ELSE 0 END) as [new],
                SUM(CASE WHEN status = 'Read' THEN 1 ELSE 0 END) as [read],
                SUM(CASE WHEN status = 'Replied' THEN 1 ELSE 0 END) as replied,
                SUM(CASE WHEN status = 'Resolved' THEN 1 ELSE 0 END) as resolved
            FROM ContactSubmissions
        `);

        res.json(result.recordset[0]);
    } catch (error) {
        console.error('Error fetching contact stats:', error);
        res.status(500).json({ error: 'Failed to fetch statistics' });
    }
});

module.exports = router;
