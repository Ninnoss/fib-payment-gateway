import { PAYMENTS_BASE_URL } from "@/lib/constants";
import { getFibAccessToken } from "@/lib/getFibAccessToken";
import { CreatePaymentInput, createPaymentSchema } from "@/lib/validation/payment";
import { FibApiErrorResponse } from "@/types/fib";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  let rawData;
  try {
    rawData = await request.json();
  } catch (error) {
    console.error("[API Create Payment] Error parsing JSON body:", error);
    return NextResponse.json({ message: "Invalid JSON format in request body" }, { status: 400 });
  }

  // 1. Validate Request Body using Zod
  const validationResult = createPaymentSchema.safeParse(rawData);

  if (!validationResult.success) {
    console.warn("[API Create Payment] Validation failed:", validationResult.error.flatten());
    return NextResponse.json(
      {
        message: "Invalid request body",
        errors: validationResult.error.flatten().fieldErrors,
      },
      { status: 400 }
    );
  }

  const createPaymentData: CreatePaymentInput = validationResult.data;

  // 2. Call the External FIB Service
  try {
    const accessToken = await getFibAccessToken();

    if (!accessToken) {
      console.error("[API Create Payment] Failed to retrieve FIB access token");
      return NextResponse.json({ message: "Authentication setup error" }, { status: 500 });
    }

    const response = await fetch(PAYMENTS_BASE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(createPaymentData),
      cache: "no-store",
    });

    // --- Error Handling for FIB API ---
    if (!response.ok) {
      let errorPayload: FibApiErrorResponse = {
        errors: [{ code: "UNKNOWN_FIB_ERROR" }],
      };
      let errorMessage = `FIB API Error: ${response.status} ${response.statusText}`;

      try {
        const errorBody = await response.json();
        // Check if the parsed body matches the expected FIB error structure
        if (
          errorBody &&
          typeof errorBody === "object" &&
          Array.isArray(errorBody.errors) &&
          errorBody.errors.length > 0
        ) {
          errorPayload = errorBody as FibApiErrorResponse;
          // Use details from the first error for the primary message
          const firstError = errorPayload?.errors?.[0];
          errorMessage = firstError?.title || firstError?.detail || firstError?.code || "Unknown error";
        } else {
          // If the structure doesn't match, use the raw body (if possible)
          errorMessage = `FIB API Error: ${response.status} ${
            response.statusText
          }. Unexpected error response format: ${JSON.stringify(errorBody)}`;
        }
      } catch (parseError) {
        // Handle cases where the error response isn't valid JSON
        errorMessage = `FIB API Error: ${response.status} ${response.statusText}. Failed to parse error response body.`;
        console.error("[API Create Payment] Failed to parse FIB error response:", parseError);
      }

      console.error(`[API Create Payment] FIB API Failure: Status ${response.status}`, {
        url: PAYMENTS_BASE_URL,
        traceId: errorPayload.traceId,
        errors: errorPayload.errors,
      });

      // Return a structured error response to the client
      return NextResponse.json(
        {
          message: `Failed to create payment: ${errorMessage}`,
          traceId: errorPayload.traceId, // Include traceId for debugging
          errorCode: errorPayload.errors?.[0]?.code, // Include the specific code
          errorDetails: errorPayload.errors, // Include full error details
        },
        { status: response.status } // Use the status code from the FIB API response
      );
    }
    // --- End of Error Handling ---

    const paymentResponse: PaymentResponse = await response.json();

    // 3. Return the Success Response
    return NextResponse.json(paymentResponse, { status: 201 });
  } catch (error) {
    console.error("[API Create Payment] Failed to process payment:", error);
    const message = error instanceof Error ? error.message : "An unknown error occurred";
    return NextResponse.json({ message: "Internal Server Error", error: message }, { status: 500 });
  }
}
