const express = require('express');
const cors = require('cors');
const app = express();

const bankRoutes = require('../routes/bankRoutes');

app.use(cors());
app.use(express.json());
app.use('/api/bank', bankRoutes);

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
