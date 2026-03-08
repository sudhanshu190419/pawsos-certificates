console.log('🔥 Certificate & ID Card Server Running 🔥');

const express = require('express');
const cors = require('cors');
const path = require('path');

const certificateRoutes = require('./routes/certificateRoutes');
const idCardRoutes = require('./routes/idRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Serve static files
app.use('/certificates', express.static(path.join(__dirname, 'certificates')));
app.use('/idcards', express.static(path.join(__dirname, 'idcards')));

// Routes
app.use('/api/certificates', certificateRoutes);
app.use('/api/idcard', idCardRoutes);

app.get('/', (req, res) => {
  res.send('📄 Certificate & ID Card Service Running');
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
