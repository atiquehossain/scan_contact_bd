import { isProduction } from "./env.js";

export interface OtpProvider {
  sendOtp(phoneNumber: string, otpCode: string): Promise<{ messageId: string; devOtp?: string }>;
  verifyDeliveryStatus(messageId: string): Promise<"sent" | "delivered" | "unknown">;
  getProviderName(): string;
}

export class DevLogOtpProvider implements OtpProvider {
  async sendOtp(phoneNumber: string, otpCode: string) {
    if (!isProduction) {
      console.info(`[DEV OTP] ${phoneNumber}: ${otpCode}`);
      return { messageId: `dev_${Date.now()}`, devOtp: otpCode };
    }
    return { messageId: `production_no_log_${Date.now()}` };
  }

  async verifyDeliveryStatus() {
    return "delivered" as const;
  }

  getProviderName() {
    return "dev-log";
  }
}

export class SmsGatewayOtpProvider implements OtpProvider {
  async sendOtp(_phoneNumber: string, _otpCode: string): Promise<{ messageId: string }> {
    throw new Error("SMS gateway is not configured. Set SMS provider credentials before production use.");
  }

  async verifyDeliveryStatus() {
    return "unknown" as const;
  }

  getProviderName() {
    return "sms-gateway";
  }
}

export interface PaymentProvider {
  createPayment(input: { orderId: string; amountBdt: number }): Promise<{ providerRef: string; status: string }>;
  verifyPayment(providerRef: string): Promise<{ status: string }>;
  handleWebhook(payload: unknown): Promise<{ ok: boolean }>;
  refundPayment(providerRef: string, amountBdt: number): Promise<{ status: string }>;
  getProviderName(): string;
}

export class ManualCodProvider implements PaymentProvider {
  async createPayment(input: { orderId: string }) {
    return { providerRef: `cod_${input.orderId}`, status: "COD_PENDING" };
  }

  async verifyPayment() {
    return { status: "COD_PENDING" };
  }

  async handleWebhook(_payload: unknown) {
    return { ok: true };
  }

  async refundPayment() {
    return { status: "REFUNDED" };
  }

  getProviderName() {
    return "manual-cod";
  }
}

export class PlaceholderPaymentProvider implements PaymentProvider {
  constructor(private readonly name: string) {}

  async createPayment(input: { orderId: string }) {
    return { providerRef: `${this.name}_sandbox_${input.orderId}`, status: "PENDING" };
  }

  async verifyPayment() {
    return { status: "PENDING" };
  }

  async handleWebhook(_payload: unknown) {
    return { ok: true };
  }

  async refundPayment() {
    return { status: "PENDING" };
  }

  getProviderName() {
    return this.name;
  }
}
