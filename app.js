const express = require('express');
const Mixpanel = require('mixpanel');

const app = express();
const mixpanel = Mixpanel.init(
  process.env.MIXPANEL_TOKEN || '47fac8a25bc9bd4269790f2210198f54'
);

app.get('/go', (req, res) => {
  mixpanel.track('$campaign_link_click', {
    distinct_id: req.ip,
    url: 'https://lakhianilaws.com/?vdlztpxt&email=',
    $insert_id: `click-${Date.now()}`,
  });
  res.redirect(302, 'https://lakhianilaws.com/?vdlztpxt&email=');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
