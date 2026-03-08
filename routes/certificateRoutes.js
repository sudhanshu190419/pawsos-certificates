const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs/promises'); // Use the promises version for async/await
const puppeteer = require('puppeteer');

// Security fix: Use a dedicated function to sanitize filenames
const getSafeFileName = (input) => {
    // Only allow alphanumeric, hyphens, and underscores to prevent path traversal.
    // This is a simple but effective sanitization.
    const sanitized = input.replace(/[^a-zA-Z0-9-_]/g, '');
    return sanitized;
};

// Route to generate a certificate
router.post('/generate', async (req, res) => {
    try{
        const { name, certificateId } = req.body;

        if(!name || !certificateId) {
            return res.status(400).json({ error: 'Name and ID are required' });
        }

        // SECURITY FIX: Sanitize the certificateId to prevent path traversal
        const safeCertificateId = getSafeFileName(certificateId);

        const templatePath = path.join(__dirname, '../utils/certificateTemplate.html');
        const html = await fs.readFile(templatePath, 'utf8');

        // Replace placeholders in template
        const currentDate = new Date().toLocaleDateString(); 
        const personalizedHtml = html
            .replace('{{name}}', name)
            .replace('{{certificateId}}', safeCertificateId)
            .replace('{{date}}', currentDate);

        // check if certificateId already ends with .pdf — if not, add it
        const finalCertFileName = safeCertificateId.endsWith('.pdf') ? safeCertificateId : `${safeCertificateId}.pdf`;

        const certPath = path.join(__dirname, '../certificates', finalCertFileName);
        
        const browser = await puppeteer.launch({
  headless: true,
  args: ['--no-sandbox', '--disable-setuid-sandbox']
});
        const page = await browser.newPage();

        await page.setContent(personalizedHtml, {
        waitUntil: 'networkidle0'
        });

        await page.pdf({
  path: certPath,
  width: '210mm',
  height: '297mm',
  printBackground: true,
  margin: {
    top: '0mm',
    right: '0mm',
    bottom: '0mm',
    left: '0mm'
  }
});

        await browser.close();


        console.log('✅ Certificate generated successfully at:', certPath);

        res.status(200).json({
            message: 'Certificate generated successfully',
            filePath: `/certificates/${finalCertFileName}`
        });
    }catch (error) {
        console.error('Error generating certificate:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Route to download the generated certificate
router.get('/download/:certificateId', async (req, res) => {
    try{
        const{ certificateId } = req.params;
        
        // SECURITY FIX: Sanitize the input to prevent path traversal
        const safeCertificateId = getSafeFileName(certificateId);
        const finalCertFileName = safeCertificateId.endsWith('.pdf') ? safeCertificateId : `${safeCertificateId}.pdf`;

        const certPath = path.join(__dirname, '../certificates', finalCertFileName);

        console.log('📦 Checking for certificate at:', certPath); 

        // Use promise-based fs.access for a more robust check
        await fs.access(certPath);

        res.download(certPath, finalCertFileName, (err) => {
            if(err) {
                console.error('Download error:', err);
                res.status(500).json({ error: 'Failed to download certificate' });
            }
        });
    }catch (error) {
        // IMPROVEMENT: Handle specific errors
        if(error.code === 'ENOENT') {
            console.error('❌ Certificate not found.');
            return res.status(404).json({ error: 'Certificate not found' });
        }
        console.error('Download error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;