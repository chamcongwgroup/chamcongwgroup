// API route cho authentication
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { username, password } = req.body;

  try {
    // Gọi ERP API để authenticate, chuyển tiếp meta (vd. tọa độ) nếu có
    const meta = req.body.meta || {};
    const response = await fetch(`${process.env.NEXT_PUBLIC_ERP_URL}/jsonrpc`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'call',
        params: {
          service: 'common',
          method: 'authenticate',
          args: [process.env.NEXT_PUBLIC_ODOO_DB, username, password, meta]
        },
        id: Date.now()
      })
    });

    const data = await response.json();

    if (data.result) {
      // forward full result for client-side handling (may include session_id)
      res.status(200).json({ success: true, result: data.result });
    } else {
      res.status(401).json({ success: false, message: 'Login failed' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}