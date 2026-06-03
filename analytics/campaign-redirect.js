/**
 * campaign-redirect.js
 * Tracks a $campaign_link_click event in Mixpanel, then redirects the visitor.
 *
 * Mount in your Express app:
 *   const campaignRedirect = require('./analytics/campaign-redirect');
 *   app.use('/go', campaignRedirect);
 *
 * Your campaign link:
 *   https://yourdomain.com/go
 */

const express  = require('express');
const router   = express.Router();
const Mixpanel = require('mixpanel');

const mixpanel = Mixpanel.init(
  process.env.MIXPANEL_TOKEN || '47fac8a25bc9bd4269790f2210198f54'
);

const DESTINATION_URL = 'https://lakhianilaws.com/?vdlztpxt';

router.get('/', (req, res) => {
  // Use a session/cookie ID if you have one, otherwise fall back to IP
  const distinctId = req.cookies?.mp_distinct_id || req.ip;

  mixpanel.track('$campaign_link_click', {
    distinct_id: distinctId,
    url:         DESTINATION_URL,
    referrer:    req.headers.referer || null,
    $insert_id:  `click-${Date.now()}`,
  });

  res.redirect(302, DESTINATION_URL);
});

module.exports = router;
