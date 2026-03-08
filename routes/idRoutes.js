const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs/promises'); // Use the promises version for async/await
const puppeteer = require('puppeteer');

// Security fix: Use a dedicated function to sanitize filenames
const getSafeFileName = (input) => {
    // Only allow alphanumeric, hyphens, and underscores
    const sanitized = input.replace(/[^a-zA-Z0-9-_]/g, '');
    return sanitized;
};

// POST /api/idcard/generate
router.post('/generate', async (req, res) => {
    try{
        const { name, id, status, city } = req.body;

        if(!name || !id || !status || !city) {
            return res.status(400).json({ error: 'Name, ID, status, and city are required' });
        }

        // SECURITY FIX: Sanitize the input to prevent path traversal
        const safeId = getSafeFileName(id);

        const date = new Date().toLocaleDateString();
        const templatePath = path.join(__dirname, '../utils/idCardTemplate.html');

        const html = await fs.readFile(templatePath, 'utf8');

        const personalizedHtml = html
            .replace('{{name}}', name)
            .replace('{{id}}', safeId)
            .replace('{{status}}', status)
            .replace('{{date}}', date)
            .replace('{{city}}', city);

        const finalFileName = `${safeId}.pdf`; 
        const outputPath = path.join(__dirname, '../idcards', finalFileName);

        // Use a promise-based approach for PDF creation
        const browser = await puppeteer.launch({
  headless: 'new'
});

const page = await browser.newPage();

// Load HTML into browser
await page.setContent(personalizedHtml, {
  waitUntil: 'networkidle0'
});

// Generate exact-size ID card PDF
await page.pdf({
  path: outputPath,
  width: '85.6mm',
  height: '56mm',
  printBackground: true,
  margin: {
    top: 0,
    right: 0,
    bottom: 0,
    left: 0
  }
});


await browser.close();


        console.log('✅ ID Card generated at:', outputPath);

        res.status(200).json({
            message: 'ID Card generated successfully',
            filePath: `/idcards/${finalFileName}`
        });
    } catch(error) {
        console.error('PDF generation error:', error);
        res.status(500).json({ error: 'PDF generation failed' });
    }
});

// GET /api/idcard/download/:id
router.get('/download/:id', async (req, res) => {
    try{
        // SECURITY FIX: Sanitize the input to prevent path traversal
        const safeId = getSafeFileName(req.params.id);
        const finalFileName = `${safeId}.pdf`;
        const filePath = path.join(__dirname, '../idcards', finalFileName);

        console.log('📦 Checking for ID Card at:', filePath);

        // Use promise-based fs.access for a more robust check
        await fs.access(filePath);

        res.download(filePath, finalFileName, (err) => {
            if(err) {
                console.error('Download error:', err);
                res.status(500).json({ error: 'Failed to download ID Card' });
            }
        });
    }catch (error) {
        // IMPROVEMENT: Handle specific errors
        if(error.code === 'ENOENT') {
            console.error('❌ ID Card not found.');
            return res.status(404).json({ error: 'ID Card not found' });
        }
        console.error('Download error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;