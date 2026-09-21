// Server-Sent Events (SSE) Manager for Real-Time Admin Notifications

let clients = [];

/**
 * Handle new SSE connection from admin dashboard
 */
const handleSSEConnection = (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const clientId = Date.now();
  const newClient = { id: clientId, res };

  clients.push(newClient);
  console.log(`[SSE] Admin client connected: ${clientId} (Total: ${clients.length})`);

  // Send initial ping to establish connection
  res.write(`data: ${JSON.stringify({ type: 'CONNECTED', message: 'SSE Connection Established' })}\n\n`);

  req.on('close', () => {
    clients = clients.filter(client => client.id !== clientId);
    console.log(`[SSE] Admin client disconnected: ${clientId} (Remaining: ${clients.length})`);
  });
};

/**
 * Broadcast notification payload to all connected admin clients
 */
const broadcastNotification = (eventData) => {
  const payload = `data: ${JSON.stringify(eventData)}\n\n`;
  clients.forEach(client => {
    try {
      client.res.write(payload);
    } catch (err) {
      console.error(`[SSE] Failed to send to client ${client.id}:`, err);
    }
  });
};

module.exports = {
  handleSSEConnection,
  broadcastNotification
};
