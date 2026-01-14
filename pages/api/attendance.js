// API route cho chấm công
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { action, uid, address, latitude, longitude } = req.body;

  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_ERP_URL}/jsonrpc`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'call',
        params: {
          service: 'object',
          method: 'execute_kw',
          args: [
            process.env.NEXT_PUBLIC_ODOO_DB,
            uid,
            '',
            'hr.attendance',
            action, // 'check_in' or 'check_out'
            [],
            { address, latitude, longitude }
          ]
        },
        id: Date.now()
      })
    });

    const data = await response.json();
    res.status(200).json(data.result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}