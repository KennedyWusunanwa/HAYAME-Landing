// Serverless function to save emails to Supabase
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

function json(res, status, payload) {
  setCors(res);
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(payload));
}

module.exports = async (req, res) => {
  setCors(res);

  if (req.method === 'OPTIONS') {
    res.statusCode = 200;
    res.end();
    return;
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return json(res, 405, { error: 'Method Not Allowed' });
  }

  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    return json(res, 500, { error: 'Server not configured' });
  }

  let body = '';
  for await (const chunk of req) body += chunk;

  let email = '';
  try {
    const parsed = body ? JSON.parse(body) : {};
    email = (parsed.email || '').trim();
  } catch {
    return json(res, 400, { error: 'Invalid JSON' });
  }

  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return json(res, 400, { error: 'Invalid email' });
  }

  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/emails`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
        Prefer: 'return=representation'
      },
      body: JSON.stringify({ email })
    });

    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
      return json(res, response.status, { error: result?.message || 'Failed to save email' });
    }

    return json(res, 200, { ok: true });
  } catch (err) {
    return json(res, 500, { error: 'Unexpected server error' });
  }
};
