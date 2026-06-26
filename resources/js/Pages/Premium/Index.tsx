import PrimaryButton from '@/Components/Breeze/PrimaryButton';
import SecondaryButton from '@/Components/Breeze/SecondaryButton';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { PageProps } from '@/types';
import {
    ArrowPathIcon,
    CheckCircleIcon,
    CreditCardIcon,
    ShieldCheckIcon,
} from '@heroicons/react/24/outline';
import { Head, router, usePage } from '@inertiajs/react';
import axios from 'axios';
import { useCallback, useEffect, useMemo, useState } from 'react';

type PremiumPlan = {
    months: 1 | 3 | 12;
    label: string;
};

type CheckoutResponse = {
    payment_id: number;
    provider_order_id: string;
    approval_url: string | null;
};

type CaptureResponse = {
    status: string;
    premium_expires_at: string | null;
};

type ErrorResponse = {
    message?: string;
};

type PremiumPageProps = PageProps<{
    plans: PremiumPlan[];
    priceCents: number;
    currency: string;
}>;

const formatMoney = (cents: number, currency: string): string =>
    new Intl.NumberFormat(undefined, {
        style: 'currency',
        currency,
    }).format(cents / 100);

const formatDate = (value?: string | null): string => {
    if (!value) {
        return 'Not active';
    }

    return new Intl.DateTimeFormat(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short',
    }).format(new Date(value));
};

export default function Index({
    plans,
    priceCents,
    currency,
}: PremiumPageProps) {
    const { auth } = usePage<PageProps>().props;
    const query = useMemo(
        (): URLSearchParams => new URLSearchParams(window.location.search),
        [],
    );
    const initialToken = query.get('token');
    const initialStatus = query.get('status');
    const [selectedMonths, setSelectedMonths] = useState<1 | 3 | 12>(1);
    const [isCheckingOut, setIsCheckingOut] = useState(false);
    const [isCapturing, setIsCapturing] = useState(false);
    const [notice, setNotice] = useState<string | null>(
        initialStatus === 'cancelled'
            ? 'Payment was cancelled before approval.'
            : null,
    );
    const [error, setError] = useState<string | null>(null);

    const selectedPlan = plans.find(
        (plan: PremiumPlan): boolean => plan.months === selectedMonths,
    );
    const selectedTotal = priceCents * selectedMonths;
    const isPremium = auth.user.is_premium;

    const captureOrder = useCallback(async (orderId: string): Promise<void> => {
        setIsCapturing(true);
        setError(null);

        try {
            const response = await window.axios.post<CaptureResponse>(
                route('premium.paypal.capture', { orderId }),
            );

            if (response.data.status === 'COMPLETED') {
                setNotice('Premium is active on your account.');
                router.reload({ only: ['auth'] });
                window.history.replaceState({}, '', route('premium.index'));

                return;
            }

            setNotice(`PayPal returned status: ${response.data.status}.`);
        } catch (caught: unknown) {
            const message = axios.isAxiosError<ErrorResponse>(caught)
                ? caught.response?.data.message
                : null;

            setError(
                message ??
                    'Could not confirm the PayPal payment. Please try again.',
            );
        } finally {
            setIsCapturing(false);
        }
    }, []);

    useEffect((): void => {
        if (initialStatus === 'approved' && initialToken) {
            void captureOrder(initialToken);
        }
    }, [captureOrder, initialStatus, initialToken]);

    const startCheckout = async (): Promise<void> => {
        setIsCheckingOut(true);
        setError(null);
        setNotice(null);

        try {
            const response = await window.axios.post<CheckoutResponse>(
                route('premium.paypal.checkout'),
                { months: selectedMonths },
            );

            if (!response.data.approval_url) {
                setError('PayPal did not return an approval link.');

                return;
            }

            window.location.assign(response.data.approval_url);
        } catch (caught: unknown) {
            const message = axios.isAxiosError<ErrorResponse>(caught)
                ? caught.response?.data.message
                : null;

            setError(
                message ??
                    'Could not start PayPal checkout. Check your PayPal configuration.',
            );
        } finally {
            setIsCheckingOut(false);
        }
    };

    return (
        <AuthenticatedLayout>
            <Head title="Premium" />

            <div className="w-full flex-1 overflow-y-auto bg-gray-50/50 py-10 dark:bg-gray-900/50">
                <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
                    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
                        <section className="bg-white p-6 shadow-sm ring-1 ring-gray-900/5 dark:bg-gray-800 dark:ring-gray-700/50 sm:rounded-lg sm:p-8">
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <h1 className="text-2xl font-semibold text-gray-950 dark:text-gray-50">
                                        Premium
                                    </h1>
                                    <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-600 dark:text-gray-300">
                                        Keep your message history permanently.
                                        Free accounts keep messages for 90 days.
                                    </p>
                                </div>

                                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 ring-1 ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-400/20">
                                    <ShieldCheckIcon className="h-4 w-4" />
                                    {isPremium ? 'Active' : 'Free'}
                                </span>
                            </div>

                            <div className="mt-8 grid gap-3 sm:grid-cols-3">
                                {plans.map((plan: PremiumPlan) => {
                                    const isSelected =
                                        plan.months === selectedMonths;

                                    return (
                                        <button
                                            key={plan.months}
                                            type="button"
                                            onClick={(): void =>
                                                setSelectedMonths(plan.months)
                                            }
                                            className={`rounded-lg border p-4 text-left transition focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 ${
                                                isSelected
                                                    ? 'border-indigo-500 bg-indigo-50 ring-1 ring-indigo-500 dark:border-indigo-400 dark:bg-indigo-500/10'
                                                    : 'border-gray-200 bg-white hover:border-gray-300 dark:border-gray-700 dark:bg-gray-900/40 dark:hover:border-gray-600'
                                            }`}
                                        >
                                            <span className="block text-sm font-semibold text-gray-950 dark:text-gray-50">
                                                {plan.label}
                                            </span>
                                            <span className="mt-2 block text-xl font-semibold text-gray-950 dark:text-gray-50">
                                                {formatMoney(
                                                    priceCents * plan.months,
                                                    currency,
                                                )}
                                            </span>
                                            <span className="mt-1 block text-xs text-gray-500 dark:text-gray-400">
                                                {formatMoney(
                                                    priceCents,
                                                    currency,
                                                )}{' '}
                                                per month
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>

                            <div className="mt-8 space-y-3">
                                <div className="flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300">
                                    <CheckCircleIcon className="h-5 w-5 text-emerald-500" />
                                    Permanent message retention while premium is active.
                                </div>
                                <div className="flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300">
                                    <CheckCircleIcon className="h-5 w-5 text-emerald-500" />
                                    Existing old premium messages are skipped by the daily cleanup command.
                                </div>
                            </div>

                            {(notice || error || isCapturing) && (
                                <div
                                    className={`mt-6 rounded-lg px-4 py-3 text-sm ${
                                        error
                                            ? 'bg-red-50 text-red-700 ring-1 ring-red-600/20 dark:bg-red-500/10 dark:text-red-300 dark:ring-red-400/20'
                                            : 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-400/20'
                                    }`}
                                >
                                    {isCapturing
                                        ? 'Confirming PayPal payment...'
                                        : error ?? notice}
                                </div>
                            )}
                        </section>

                        <aside className="bg-white p-6 shadow-sm ring-1 ring-gray-900/5 dark:bg-gray-800 dark:ring-gray-700/50 sm:rounded-lg">
                            <h2 className="text-lg font-medium text-gray-950 dark:text-gray-50">
                                Checkout
                            </h2>

                            <dl className="mt-5 space-y-3 text-sm">
                                <div className="flex items-center justify-between gap-4">
                                    <dt className="text-gray-500 dark:text-gray-400">
                                        Plan
                                    </dt>
                                    <dd className="font-medium text-gray-900 dark:text-gray-100">
                                        {selectedPlan?.label ?? '1 month'}
                                    </dd>
                                </div>
                                <div className="flex items-center justify-between gap-4">
                                    <dt className="text-gray-500 dark:text-gray-400">
                                        Total
                                    </dt>
                                    <dd className="font-semibold text-gray-950 dark:text-gray-50">
                                        {formatMoney(selectedTotal, currency)}
                                    </dd>
                                </div>
                                <div className="border-t border-gray-200 pt-3 dark:border-gray-700">
                                    <dt className="text-gray-500 dark:text-gray-400">
                                        Premium expires
                                    </dt>
                                    <dd className="mt-1 font-medium text-gray-900 dark:text-gray-100">
                                        {formatDate(
                                            auth.user.premium_expires_at,
                                        )}
                                    </dd>
                                </div>
                            </dl>

                            <PrimaryButton
                                type="button"
                                disabled={isCheckingOut || isCapturing}
                                onClick={startCheckout}
                                className="mt-6 flex w-full justify-center gap-2"
                            >
                                {isCheckingOut ? (
                                    <ArrowPathIcon className="h-4 w-4 animate-spin" />
                                ) : (
                                    <CreditCardIcon className="h-4 w-4" />
                                )}
                                Pay with PayPal
                            </PrimaryButton>

                            <SecondaryButton
                                type="button"
                                onClick={(): void =>
                                    router.visit(route('profile.edit'))
                                }
                                className="mt-3 flex w-full justify-center"
                            >
                                Back to profile
                            </SecondaryButton>
                        </aside>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
