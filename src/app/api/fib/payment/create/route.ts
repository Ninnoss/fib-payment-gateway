import { PAYMENTS_BASE_URL } from "@/lib/constants";
import { handleFibApiResponseError } from "@/lib/fibApiErrorHandler";
import { getFibAccessToken } from "@/lib/getFibAccessToken";
import { CreatePaymentInput, createPaymentSchema } from "@/lib/validation/payment";
import { NextRequest, NextResponse } from "next/server";

const OPERATION_NAME = "Create Payment API";

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

    if (!response.ok) {
      return await handleFibApiResponseError(response, OPERATION_NAME, {
        url: PAYMENTS_BASE_URL,
      });
    }

    const paymentResponse: PaymentResponse = await response.json();

    // 3. Return the Success Response
    return NextResponse.json(paymentResponse, { status: 201 });
  } catch (error) {
    console.error("[API Create Payment] Failed to process payment:", error);
    const message = error instanceof Error ? error.message : "An unknown error occurred";
    return NextResponse.json({ message: "Internal Server Error", error: message }, { status: 500 });
  }
}
