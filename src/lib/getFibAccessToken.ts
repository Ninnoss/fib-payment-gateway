import { ACCESS_TOKEN_URL } from "./constants";

/**
 * Token is valid for 60 seconds only. We have re-authenticate fo each request.
 */
export const getFibAccessToken = async (): Promise<string> => {
  const clientId = process.env.CLIENT_ID;
  const clientSecret = process.env.CLIENT_SECRET;
  const grantType = process.env.GRANT_TYPE;

  if (!clientId || !clientSecret) {
    throw new Error("Client ID or Client Secret is not defined in environment variables.");
  }

  const response = await fetch(ACCESS_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: grantType || "client_credentials",
      client_id: clientId,
      client_secret: clientSecret,
    }).toString(),
  });

  const responseBody = await response.json();

  if (!response.ok) {
    const errorMessage = responseBody?.error || "Unknown error occurred";
    throw new Error(`${errorMessage} (${response.status} - ${response.statusText})`);
  }

  if (!responseBody.access_token) {
    throw new Error("Access token is missing in the response.");
  }

  return responseBody.access_token;
};
