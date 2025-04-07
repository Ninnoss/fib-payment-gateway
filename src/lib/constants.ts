// Define the possible environment names used in the env variable

import { FIBEnvironment } from "@/types/fib";

// Map environment names to their specific domain parts
// This also serves as the single source of truth for valid environments
const environmentDomains: Record<FIBEnvironment, string> = {
  prod: "fib.prod.fib.iq",
  stage: "fib.stage.fib.iq",
  dev: "fib.dev.fib.iq",
};

// Get the raw environment variable value (convert to lowercase for consistency)
const rawEnv = process.env.FIB_GATEWAY_ENVIRONMENT?.toLowerCase();

// Determine the effective environment:
// 1. Check if rawEnv is one of the valid keys ('dev', 'stage', 'prod').
// 2. If yes, use it.
// 3. If no (or if rawEnv is undefined/empty), default to 'stage'.
const fibEnv: FIBEnvironment =
  rawEnv && rawEnv in environmentDomains
    ? (rawEnv as FIBEnvironment) // Type assertion is safe here due to the check
    : "stage"; // Default to staging

// Select the correct domain based on the determined environment
const apiDomain = environmentDomains[fibEnv];

// Construct the base URL *once*
const API_BASE_URL = `https://${apiDomain}`;

// --- Define specific endpoints using the base URL ---

// Authentication
export const ACCESS_TOKEN_URL = `${API_BASE_URL}/auth/realms/fib-online-shop/protocol/openid-connect/token`;
export const AUTH_TOKEN_URL = `${API_BASE_URL}/auth/realms/fib-personal-application/protocol/openid-connect/token`;

// Payments
export const PAYMENTS_BASE_URL = `${API_BASE_URL}/protected/v1/payments`;

// SSO
export const SSO_AUTH_URL = `${API_BASE_URL}/auth/realms/fib-personal-application/protocol/openid-connect/auth`;
export const SSO_USER_DETAILS_URL = `${API_BASE_URL}/protected/v1/sso-user-details`;

// Log the environment being used for clarity during startup/build
console.log(`Using FIB API environment: ${fibEnv}, Base URL: ${API_BASE_URL}`);
