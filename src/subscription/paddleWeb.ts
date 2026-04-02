export type WebCheckoutPlan = "monthly" | "yearly";

export type WebPlanCard = {
  id: WebCheckoutPlan;
  title: string;
  priceLabel: string;
  cadenceLabel: string;
  supportText: string;
  detailText: string;
  badge?: string;
};

type PaddleEvent = {
  name?: string;
  data?: {
    transaction_id?: string;
    [key: string]: unknown;
  };
};

type PaddleCheckoutOptions = {
  items: { priceId: string; quantity: number }[];
  customer?: { email?: string };
  customData?: Record<string, string>;
  settings?: {
    displayMode?: "overlay" | "inline";
    locale?: string;
    theme?: "light" | "dark";
    successUrl?: string;
  };
};

type PaddleInstance = {
  Environment?: {
    set: (environment: "sandbox") => void;
  };
  Initialize: (options: {
    token: string;
    eventCallback?: (event: PaddleEvent) => void;
  }) => void;
  Checkout: {
    open: (options: PaddleCheckoutOptions) => void;
  };
};

declare global {
  interface Window {
    Paddle?: PaddleInstance;
    __keystonePaddleInitialized?: boolean;
  }
}

const PADDLE_SCRIPT_SRC = "https://cdn.paddle.com/paddle/v2/paddle.js";
const PADDLE_CHECKOUT_STORAGE_KEY = "keystone:paddle:last-checkout";

const PUBLIC_PADDLE_CONFIG = {
  environment:
    process.env.EXPO_PUBLIC_PADDLE_ENV?.trim().toLowerCase() === "sandbox"
      ? ("sandbox" as const)
      : ("production" as const),
  clientToken: process.env.EXPO_PUBLIC_PADDLE_CLIENT_TOKEN?.trim() || "",
  monthlyPriceId:
    process.env.EXPO_PUBLIC_PADDLE_MONTHLY_PRICE_ID?.trim() || "",
  yearlyPriceId:
    process.env.EXPO_PUBLIC_PADDLE_YEARLY_PRICE_ID?.trim() || "",
};

export const WEB_CHECKOUT_PLANS: WebPlanCard[] = [
  {
    id: "yearly",
    title: "Yearly",
    priceLabel: "$59.99",
    cadenceLabel: "/ year",
    supportText:
      "Everything in Keystone Access with the lowest long-term cost.",
    detailText: "Save 58% compared with monthly billing",
    badge: "Best value",
  },
  {
    id: "monthly",
    title: "Monthly",
    priceLabel: "$11.99",
    cadenceLabel: "/ month",
    supportText:
      "Full Keystone Access with flexible month-to-month billing.",
    detailText: "Renews monthly",
    badge: "Most flexible",
  },
];

let paddleScriptPromise: Promise<PaddleInstance> | null = null;

function canUseBrowserStorage() {
  return typeof window !== "undefined" && typeof window.sessionStorage !== "undefined";
}

function getWindowPaddle() {
  return typeof window !== "undefined" ? window.Paddle : undefined;
}

function getPlanPriceId(plan: WebCheckoutPlan) {
  return plan === "monthly"
    ? PUBLIC_PADDLE_CONFIG.monthlyPriceId
    : PUBLIC_PADDLE_CONFIG.yearlyPriceId;
}

function rememberCheckoutCompletion(transactionId?: string) {
  if (!canUseBrowserStorage()) {
    return;
  }

  try {
    window.sessionStorage.setItem(
      PADDLE_CHECKOUT_STORAGE_KEY,
      JSON.stringify({
        at: Date.now(),
        transactionId: transactionId || null,
      }),
    );
  } catch {
    // Ignore transient storage failures in private browsing or embedded webviews.
  }
}

function buildPaddleEventCallback() {
  return (event: PaddleEvent) => {
    if (
      event?.name === "checkout.error" ||
      event?.name === "checkout.warning" ||
      event?.name === "checkout.payment.error" ||
      event?.name === "checkout.payment.failed"
    ) {
      console.error("[Paddle checkout event]", event);
    }

    if (event?.name !== "checkout.completed") {
      return;
    }

    rememberCheckoutCompletion(event.data?.transaction_id);
  };
}

function loadPaddleScript() {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return Promise.reject(new Error("Paddle checkout is only available on web"));
  }

  const existingPaddle = getWindowPaddle();
  if (existingPaddle) {
    return Promise.resolve(existingPaddle);
  }

  if (paddleScriptPromise) {
    return paddleScriptPromise;
  }

  paddleScriptPromise = new Promise<PaddleInstance>((resolve, reject) => {
    const existingScript = document.querySelector<HTMLScriptElement>(
      `script[src="${PADDLE_SCRIPT_SRC}"]`,
    );

    if (existingScript && getWindowPaddle()) {
      resolve(getWindowPaddle() as PaddleInstance);
      return;
    }

    const script = existingScript || document.createElement("script");
    script.src = PADDLE_SCRIPT_SRC;
    script.async = true;
    script.onload = () => {
      const paddle = getWindowPaddle();
      if (!paddle) {
        reject(new Error("Paddle.js loaded without exposing window.Paddle"));
        return;
      }
      resolve(paddle);
    };
    script.onerror = () => {
      reject(new Error("Failed to load Paddle.js"));
    };

    if (!existingScript) {
      document.head.appendChild(script);
    }
  });

  return paddleScriptPromise;
}

export function getPaddlePublicCheckoutConfig() {
  return {
    ...PUBLIC_PADDLE_CONFIG,
    isReady: Boolean(
      PUBLIC_PADDLE_CONFIG.clientToken &&
        PUBLIC_PADDLE_CONFIG.monthlyPriceId &&
        PUBLIC_PADDLE_CONFIG.yearlyPriceId,
    ),
  };
}

export function isWebCheckoutPlan(value?: string | null): value is WebCheckoutPlan {
  return value === "monthly" || value === "yearly";
}

export function consumeRecentPaddleCheckout(maxAgeMs = 15 * 60 * 1000) {
  if (!canUseBrowserStorage()) {
    return null;
  }

  try {
    const raw = window.sessionStorage.getItem(PADDLE_CHECKOUT_STORAGE_KEY);
    if (!raw) {
      return null;
    }

    window.sessionStorage.removeItem(PADDLE_CHECKOUT_STORAGE_KEY);

    const parsed = JSON.parse(raw) as {
      at?: number;
      transactionId?: string | null;
    };
    if (!parsed?.at || Date.now() - parsed.at > maxAgeMs) {
      return null;
    }

    return {
      at: parsed.at,
      transactionId:
        typeof parsed.transactionId === "string" ? parsed.transactionId : null,
    };
  } catch {
    return null;
  }
}

export async function ensurePaddleInitialized() {
  const config = getPaddlePublicCheckoutConfig();
  if (!config.isReady) {
    throw new Error("Paddle checkout is not configured for web");
  }

  const paddle = await loadPaddleScript();

  if (!window.__keystonePaddleInitialized) {
    if (config.environment === "sandbox") {
      paddle.Environment?.set("sandbox");
    }

    paddle.Initialize({
      token: config.clientToken,
      eventCallback: buildPaddleEventCallback(),
    });
    window.__keystonePaddleInitialized = true;
  }

  return paddle;
}

export async function openPaddleCheckout(options: {
  plan: WebCheckoutPlan;
  email?: string | null;
  userId?: string | null;
  successUrl?: string | null;
}) {
  const priceId = getPlanPriceId(options.plan);
  if (!priceId) {
    throw new Error(`Missing Paddle price ID for the ${options.plan} plan`);
  }

  const paddle = await ensurePaddleInitialized();
  const customData: Record<string, string> = {
    keystone_plan: options.plan,
  };

  if (options.userId) {
    customData.keystone_user_id = options.userId;
  }

  if (options.email) {
    customData.keystone_email = options.email;
  }

  paddle.Checkout.open({
    items: [{ priceId, quantity: 1 }],
    customer: options.email ? { email: options.email } : undefined,
    customData,
    settings: {
      displayMode: "overlay",
      locale: "en",
      theme: "light",
      successUrl: options.successUrl || undefined,
    },
  });
}
