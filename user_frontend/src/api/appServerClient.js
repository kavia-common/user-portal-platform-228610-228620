import { requestWithAuth } from './requestWithAuth';

const APP_SERVER_BASE_URL = process.env.REACT_APP_APP_SERVER_BASE_URL;

function requireEnv(name, value) {
  if (!value) {
    throw new Error(`${name} is not set. Please configure it in your environment.`);
  }
}

// PUBLIC_INTERFACE
export async function appMe({ accessToken, setAccessToken }) {
  /** Fetch current user from the App Server (requires Authorization Bearer). */
  requireEnv('REACT_APP_APP_SERVER_BASE_URL', APP_SERVER_BASE_URL);
  return requestWithAuth({
    baseUrl: APP_SERVER_BASE_URL,
    path: '/me',
    method: 'GET',
    accessToken,
    setAccessToken,
  });
}

// PUBLIC_INTERFACE
export async function appHome({ accessToken, setAccessToken }) {
  /** Fetch personalized home content from the App Server (requires Authorization Bearer). */
  requireEnv('REACT_APP_APP_SERVER_BASE_URL', APP_SERVER_BASE_URL);
  return requestWithAuth({
    baseUrl: APP_SERVER_BASE_URL,
    path: '/home',
    method: 'GET',
    accessToken,
    setAccessToken,
  });
}
