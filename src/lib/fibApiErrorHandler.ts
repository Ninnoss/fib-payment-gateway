// src/utils/fibApiUtils.ts

import { FibApiErrorResponse } from "@/types/fib";
import { NextResponse } from "next/server";

/**
 * Handles error responses from the FIB API.
 * Parses the standard FIB error format and returns a structured NextResponse.
 *
 * @param response The raw Response object from the fetch call.
 * @param operationName A descriptive name of the operation for logging (e.g., "API Create Payment").
 * @param context Optional additional context for logging (e.g., { paymentId, url }).
 * @returns A Promise resolving to a NextResponse object containing the structured error.
 */
export async function handleFibApiResponseError(
  response: Response,
  operationName: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  context: Record<string, any> = {} // Accept optional context for logging
): Promise<NextResponse> {
  let errorPayload: FibApiErrorResponse = {
    errors: [{ code: "UNKNOWN_FIB_ERROR", title: "Unknown FIB Error" }],
  };
  let errorMessage = `FIB API Error: ${response.status} ${response.statusText}`;
  const defaultErrorMessage = "Failed to process request via FIB"; // More generic message for client

  try {
    const errorBody = await response.json();
    // Check if the parsed body matches the expected FIB error structure
    if (errorBody && typeof errorBody === "object" && Array.isArray(errorBody.errors) && errorBody.errors.length > 0) {
      errorPayload = errorBody as FibApiErrorResponse;
      // Use details from the first error for the primary message
      const firstError = errorPayload?.errors?.[0];
      // Prioritize detail, then title, then code for the message part
      errorMessage = firstError?.detail || firstError?.title || firstError?.code || "Unknown FIB Error Detail";
    } else {
      // If the structure doesn't match, use the raw body (if possible)
      errorMessage = `Unexpected error response format: ${JSON.stringify(errorBody)}`;
    }
  } catch (parseError) {
    // Handle cases where the error response isn't valid JSON
    errorMessage = `Failed to parse error response body. Status: ${response.status} ${response.statusText}`;
    console.error(`[${operationName}] Failed to parse FIB error response:`, parseError);
  }

  // Log the detailed error information server-side
  console.error(`[${operationName}] FIB API Failure: Status ${response.status}`, {
    statusText: response.statusText,
    traceId: errorPayload.traceId,
    errors: errorPayload.errors,
    ...context, // Include any additional context passed in
  });

  // Return a structured error response to the client
  return NextResponse.json(
    {
      message: `${defaultErrorMessage}: ${errorMessage}`, // Combine generic + specific message
      traceId: errorPayload.traceId, // Include traceId for debugging
      errorCode: errorPayload.errors?.[0]?.code, // Include the specific code
      errorDetails: errorPayload.errors, // Include full error details array
    },
    { status: response.status } // Use the status code from the FIB API response
  );
}
