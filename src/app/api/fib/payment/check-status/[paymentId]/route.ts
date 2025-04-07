import { PAYMENTS_BASE_URL } from "@/lib/constants";
import { handleFibApiResponseError } from "@/lib/fibApiErrorHandler";
import { getFibAccessToken } from "@/lib/getFibAccessToken";
import { paymentIdSchema } from "@/lib/validation/payment";
import { CheckPaymentStatusResponse, FibApiErrorResponse } from "@/types/fib";
import { NextRequest, NextResponse } from "next/server";

type RouteContext = { params: { paymentId: string } };
const OPERATION_NAME = "API Check Status"; // Define operation name constant

// TODO: cleanup
export async function GET(request: NextRequest, context: RouteContext) {
  const { paymentId } = context.params;

  const validationResult = paymentIdSchema.safeParse(paymentId);
  if (!validationResult.success) {
    console.warn(`[${OPERATION_NAME}] Invalid paymentId format: ${paymentId}`, validationResult.error.flatten());
    return NextResponse.json(
      {
        message: "Invalid payment ID format",
        errors: validationResult.error.flatten().fieldErrors,
      },
      { status: 400 }
    );
  }

  try {
    const accessToken = await getFibAccessToken();
    if (!accessToken) {
      console.error(`[${OPERATION_NAME}] Failed to retrieve FIB access token for paymentId:`, paymentId);
      return NextResponse.json({ message: "Service configuration error" }, { status: 500 });
    }

    const statusUrl = `${PAYMENTS_BASE_URL}/${paymentId}/status`;

    const response = await fetch(statusUrl, {
      method: "GET",
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    });

    // *** Use the reusable error handler ***
    if (!response.ok) {
      return await handleFibApiResponseError(response, OPERATION_NAME, {
        paymentId,
        url: statusUrl,
      });
    }
    // *************************************

    // Handle Success Response (including defensive check for errors in 200 OK)
    const statusData: CheckPaymentStatusResponse | FibApiErrorResponse = await response.json();

    if ("errors" in statusData && Array.isArray(statusData.errors) && statusData.errors.length > 0) {
      const firstError = statusData.errors[0];
      const errorMessage = firstError.detail || firstError.title || firstError.code;
      console.warn(
        `[${OPERATION_NAME}] FIB returned 200 OK but included errors for paymentId ${paymentId}:`,
        statusData
      );
      // Return a structured error even on 200 OK if FIB reports errors
      return NextResponse.json(
        {
          message: `Payment status check reported an issue: ${errorMessage}`,
          traceId: statusData.traceId,
          errorCode: firstError.code,
          errorDetails: statusData.errors,
        },
        { status: 400 } // Treat as Bad Request if FIB sends errors with 200 OK
      );
    }

    return NextResponse.json(statusData as CheckPaymentStatusResponse, {
      status: 200,
    });
  } catch (error) {
    console.error(`[${OPERATION_NAME}] Failed to process status check for paymentId ${paymentId}:`, error);
    const message = error instanceof Error ? error.message : "An unknown error occurred";
    return NextResponse.json({ message: "Internal Server Error", error: message }, { status: 500 });
  }
}
