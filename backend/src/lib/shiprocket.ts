const SHIPROCKET_URL = 'https://apiv2.shiprocket.in/v1/external';

let cachedToken: string | null = null;
let tokenExpiry: number | null = null;

export async function getShiprocketToken(): Promise<string> {
  const email = process.env.SHIPROCKET_EMAIL;
  const password = process.env.SHIPROCKET_PASSWORD;

  if (!email || !password) {
    throw new Error('Shiprocket credentials not found in environment');
  }

  // Reuse token if it hasn't expired (Shiprocket tokens usually last 240 hours, we'll cache for 230 hours)
  if (cachedToken && tokenExpiry && Date.now() < tokenExpiry) {
    return cachedToken;
  }

  try {
    const response = await fetch(`${SHIPROCKET_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      throw new Error('Failed to authenticate with Shiprocket');
    }

    const data = await response.json();
    cachedToken = data.token;
    // Cache for 230 hours (Date.now() + 230 * 60 * 60 * 1000)
    tokenExpiry = Date.now() + 230 * 60 * 60 * 1000;
    
    return data.token;
  } catch (error) {
    console.error('Shiprocket Auth Error:', error);
    throw new Error('Failed to get Shiprocket Token');
  }
}

export async function trackShipment(awb: string) {
  try {
    const token = await getShiprocketToken();
    const response = await fetch(`${SHIPROCKET_URL}/courier/track/awb/${awb}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Shiprocket Tracking API Error: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Shiprocket Tracking Error:', error);
    throw error;
  }
}
