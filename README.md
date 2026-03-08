# PawSOS – Certificate & ID Card Generation Module

This repository contains the certificate and volunteer ID card generation logic used in the PawSOS project.

## Features
- Generate volunteer certificates as PDF
- Generate ID cards with exact card dimensions
- HTML template-based design
- Secure filename sanitization
- Download generated PDFs via API

## API Endpoints

### Generate Certificate
POST /api/certificates/generate

Body:
```json
{
  "name": "John Doe",
  "certificateId": "CERT123"
}
