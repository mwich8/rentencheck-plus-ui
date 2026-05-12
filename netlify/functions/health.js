/**
 * Minimal health-check endpoint.
 * Its only purpose is to wake up the Netlify Functions runtime from cold-start / idle.
 */
exports.handler = async () => {
  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: 'ok', timestamp: Date.now() }),
  };
};

