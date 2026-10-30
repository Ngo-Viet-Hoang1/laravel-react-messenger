export type PremiumPaymentStatus =
    | 'CREATED'
    | 'PROCESSING'
    | 'COMPLETED'
    | 'CANCELLED'
    | 'FAILED'
    | 'PAYER_ACTION_REQUIRED'
    | 'APPROVED'
    | string;

export type PremiumPaymentHistoryItem = {
    id: number;
    provider: string;
    provider_order_id: string;
    status: PremiumPaymentStatus;
    months: number;
    amount_cents: number;
    currency: string;
    approval_url: string | null;
    can_continue_payment: boolean;
    checkout_expires_at: string | null;
    captured_at: string | null;
    premium_activated_at: string | null;
    created_at: string;
    updated_at: string;
};
