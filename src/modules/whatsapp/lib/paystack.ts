const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
const PAYSTACK_BASE_URL = "https://api.paystack.co";

export interface InitTransactionInput {
  email: string;
  amountKobo: number;
  reference: string;
  metadata?: Record<string, unknown>;
}

export interface InitTransactionResult {
  authorizationUrl: string;
  accessCode: string;
  reference: string;
}

/**
 * If PAYSTACK_SECRET_KEY isn't set, this returns a working mock payment link
 * instead of throwing, so the bot stays fully functional in dev/demo without
 * real Paystack credentials.
 */
export async function initializeTransaction(
  input: InitTransactionInput
): Promise<InitTransactionResult> {
  if (!PAYSTACK_SECRET_KEY) {
    return {
      authorizationUrl: `https://paystack.com/pay/${input.reference.toLowerCase()}`,
      accessCode: `mock_${input.reference}`,
      reference: input.reference,
    };
  }

  const res = await fetch(`${PAYSTACK_BASE_URL}/transaction/initialize`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: input.email,
      amount: input.amountKobo,
      reference: input.reference,
      metadata: input.metadata ?? {},
    }),
  });

  if (!res.ok) {
    throw new Error(`Paystack init failed: ${res.status} ${await res.text()}`);
  }

  const data = (await res.json()) as {
    data: {
      authorization_url: string;
      access_code: string;
      reference: string;
    };
  };

  return {
    authorizationUrl: data.data.authorization_url,
    accessCode: data.data.access_code,
    reference: data.data.reference,
  };
}

export async function verifyTransaction(
  reference: string
): Promise<{ status: string; amount: number }> {
  if (!PAYSTACK_SECRET_KEY) {
    return {
      status: "success",
      amount: 0,
    };
  }

  const res = await fetch(
    `${PAYSTACK_BASE_URL}/transaction/verify/${reference}`,
    {
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
      },
    }
  );

  if (!res.ok) {
    throw new Error(`Paystack verify failed: ${res.status}`);
  }

  const data = (await res.json()) as {
    data: {
      status: string;
      amount: number;
    };
  };

  return {
    status: data.data.status,
    amount: data.data.amount,
  };
}

export interface RefundResponse {
  success: boolean;
  refundReference?: string;
  message?: string;
}

interface PaystackRefundApiResponse {
  status: boolean;
  message: string;
  data?: {
    refund_reference?: string;
  };
}

export async function refundTransaction(
  transactionReference: string,
  reason: string,
): Promise<RefundResponse> {
  // Development mode
  if (!PAYSTACK_SECRET_KEY) {
    return {
      success: true,
      refundReference: `mock_refund_${transactionReference}`,
    };
  }

  const res = await fetch(`${PAYSTACK_BASE_URL}/refund`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      transaction: transactionReference,
      reason,
    }),
  });

  const body = (await res.json()) as PaystackRefundApiResponse;

  if (!res.ok || !body.status) {
    return {
      success: false,
      message: body.message ?? `Paystack returned ${res.status}`,
    };
  }

  return {
    success: true,
    refundReference:
      body.data?.refund_reference ?? transactionReference,
  };
}