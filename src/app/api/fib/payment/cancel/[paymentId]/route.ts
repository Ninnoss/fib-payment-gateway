import { PAYMENTS_BASE_URL } from "@/lib/constants";
import { handleFibApiResponseError } from "@/lib/fibApiErrorHandler";
import { getFibAccessToken } from "@/lib/getFibAccessToken";
import { paymentIdSchema } from "@/lib/validation/payment";
import { NextRequest, NextResponse } from "next/server";

type RouteContext = { params: { paymentId: string } };

const OPERATION_NAME = "Cancel Payment API";

/**
 * This should be used only if you want to cancel a payment that is not yet paid.
 */
export async function POST(request: NextRequest, context: RouteContext) {
  const { paymentId } = context.params;

  // 1. Validate Payment ID Format
  const validationResult = paymentIdSchema.safeParse(paymentId);
  if (!validationResult.success) {
    console.warn(`[${OPERATION_NAME}] Invalid paymentId format: ${paymentId}`, validationResult.error.flatten());
    return NextResponse.json(
      {
        message: "Invalid payment ID format",
        errors: validationResult.error.flatten().fieldErrors,
      },
      { status: 400 } // Bad Request
    );
  }

  // 2. Call the External FIB Service
  try {
    const accessToken = await getFibAccessToken();

    if (!accessToken) {
      console.error(`[${OPERATION_NAME}] Failed to retrieve FIB access token for paymentId:`, paymentId);
      return NextResponse.json({ message: "Service configuration error" }, { status: 500 });
    }

    const cancelUrl = `${PAYMENTS_BASE_URL}/${paymentId}/cancel`;

    const response = await fetch(cancelUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      cache: "no-store",
    });

    // 3. Handle FIB API Response
    // Check for the specific success status code (204 No Content)
    if (response.status === 204) {
      // Payment successfully cancelled by FIB
      return NextResponse.json({ message: "Payment cancelled successfully" }, { status: 200 });
    }

    // If it's not 204, handle it as an error using the utility
    // This covers non-2xx responses and unexpected 2xx responses (like 200 OK)
    return await handleFibApiResponseError(response, OPERATION_NAME, {
      paymentId,
      url: cancelUrl,
    });
  } catch (error) {
    // Handle errors during fetch, token retrieval, or unexpected issues
    console.error(`[${OPERATION_NAME}] Failed to process cancellation for paymentId ${paymentId}:`, error);
    const message = error instanceof Error ? error.message : "An unknown error occurred";
    return NextResponse.json({ message: "Internal Server Error", error: message }, { status: 500 });
  }
}
