import { FIBEnvironments } from "@/types/fib";

// Get the environment, defaulting to development if not set
const fibGatewayEnvironment = (process.env.FIB_GATEWAY_ENVIRONMENT || "development") as FIBEnvironments;

// Map environments to their specific domain parts
const environmentDomains: Record<FIBEnvironments, string> = {
  production: "fib.prod.fib.iq",
  staging: "fib.stage.fib.iq",
  development: "fib.dev.fib.iq",
};

// Select the correct domain, falling back to development if somehow invalid
const apiDomain = environmentDomains[fibGatewayEnvironment] || environmentDomains.development;

// Construct the base URL *once*
const API_BASE_URL = `https://${apiDomain}`;

// Authentication
export const ACCESS_TOKEN_URL = `${API_BASE_URL}/auth/realms/fib-online-shop/protocol/openid-connect/token`;
export const AUTH_TOKEN_URL = `${API_BASE_URL}/auth/realms/fib-personal-application/protocol/openid-connect/token`;

// Payments
export const PAYMENTS_BASE_URL = `${API_BASE_URL}/protected/v1/payments`;

// SSO
export const SSO_AUTH_URL = `${API_BASE_URL}/auth/realms/fib-personal-application/protocol/openid-connect/auth`;
export const SSO_USER_DETAILS_URL = `${API_BASE_URL}/protected/v1/sso-user-details`;

console.log(`Using API Base URL for ${fibGatewayEnvironment}: ${API_BASE_URL}`);
