import { z } from "zod";

// --- Reusable Validation Logic ---

const iso8601DurationRegex = /^P(?=\d|T\d)(\d+Y)?(\d+M)?(\d+W)?(\d+D)?(T(\d+H)?(\d+M)?(\d+(\.\d+)?S)?)?$/;

const iso8601DurationSchema = z.string().refine((val) => iso8601DurationRegex.test(val), {
  message: "Must be a valid ISO 8601 duration string (e.g., P1D, PT1H30M)",
});

const paymentCategories = [
  "ERP",
  "POS",
  "ECOMMERCE",
  "UTILITY",
  "PAYROLL",
  "SUPPLIER",
  "LOAN",
  "GOVERNMENT",
  "MISCELLANEOUS",
  "OTHER",
] as const;

// --- Zod Schemas ---

export const monetaryValueSchema = z.object({
  amount: z
    .string()
    .min(1, "Amount cannot be empty")
    // Regex ensures it's digits optionally followed by exactly ".00"
    .regex(/^\d+(\.00)?$/, {
      message:
        'Amount must be a whole number string or end in .00 (e.g., "500", "123.00"). Fractional values (e.g., "500.50") are not allowed.',
    }),
  currency: z.string().length(3, "Currency must be a 3-letter code (e.g., IQD)"),
});

export const createPaymentSchema = z.object({
  monetaryValue: monetaryValueSchema,
  description: z.string().optional(),
  statusCallbackUrl: z.string().url("Invalid Status Callback URL format").optional(),
  redirectUri: z.string().url("Invalid Redirect URI format").optional(),
  expiresIn: iso8601DurationSchema.optional(),
  refundableFor: iso8601DurationSchema.optional(),
  category: z.enum(paymentCategories).optional(),
});

export const paymentIdSchema = z.string().uuid("Invalid paymentId format (must be a UUID)");

// --- Type Inference ---
export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;
export type MonetaryValueInput = z.infer<typeof monetaryValueSchema>;

// --- Utility Function ---
export const isValidPaymentId = (paymentId: string): boolean => {
  return paymentIdSchema.safeParse(paymentId).success;
};
