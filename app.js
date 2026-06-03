const express = require('express');
const app = express();

const campaignRedirect = require('./analytics/campaign-redirect');
app.use('/go', campaignRedirect);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
