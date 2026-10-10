export interface CheckoutConfig {
  apiBaseUrl: string;
  /** Store page to create a Lyel Pay account; the link is hidden when empty. */
  signupUrl: string | null;
}

export function readConfig(env: ImportMetaEnv): CheckoutConfig {
  const apiBaseUrl = env.VITE_API_URL?.trim();
  if (!apiBaseUrl) throw new Error('VITE_API_URL is required');
  return {
    apiBaseUrl: apiBaseUrl.replace(/\/+$/, ''),
    signupUrl: env.VITE_LYEL_PAY_SIGNUP_URL?.trim() || null,
  };
}
