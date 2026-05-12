'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Coins } from 'lucide-react';
import { useCartStore } from '@/stores/cartStore';
import { useAuthStore } from '@/stores/authStore';
import { getMyLoyalty, type LoyaltyMeResponse } from '@/lib/api/loyalty';
import { formatPriceNGN } from '@/lib/format';
import { SafeBoundary } from '@/components/common/SafeBoundary';

interface Props {
  productPriceNgn: number;
  onAdd: () => void;
}

/**
 * "Pay with Afrizone Coin" PDP button (Tracker #44 PR 3, option A).
 *
 * Single tap = (1) add this product to the cart via the same
 * `onAdd` handler the regular Add-to-Cart uses, (2) set the cart
 * store's `coinRedeemRequest` to the max coins applicable to this
 * single-product subtotal, (3) navigate to /cart so the customer
 * sees the discount applied and can adjust before checking out.
 *
 * Visible only when the customer is logged in, enrolled, and has
 * at least minRedeemCoins on this product (≥ minRedeem coins AND
 * the maxOrderRedeemPercent cap allows ≥ minRedeem coins on this
 * single-item subtotal). Hidden otherwise — no point teasing.
 */
export function PayWithCoinButton(props: Props) {
  return (
    <SafeBoundary name="pdp:pay-with-coin" fallback={null}>
      <PayWithCoinButtonInner {...props} />
    </SafeBoundary>
  );
}

function PayWithCoinButtonInner({ productPriceNgn, onAdd }: Props) {
  const accessToken = useAuthStore((s) => s.accessToken);
  const setCoinRedeemRequest = useCartStore((s) => s.setCoinRedeemRequest);
  const router = useRouter();
  const [loyalty, setLoyalty] = useState<LoyaltyMeResponse | null>(null);

  useEffect(() => {
    if (!accessToken) return;
    let cancelled = false;
    void getMyLoyalty()
      .then((r) => {
        if (!cancelled) setLoyalty(r);
      })
      .catch(() => {
        if (!cancelled) setLoyalty(null);
      });
    return () => {
      cancelled = true;
    };
  }, [accessToken]);

  if (!accessToken || !loyalty || !loyalty.enrolled) return null;
  const { account, config } = loyalty;
  if (account.coinBalance < config.minRedeemCoins) return null;

  const maxNgn = Math.floor(
    (productPriceNgn * config.maxOrderRedeemPercent) / 100,
  );
  const maxCoinsByCap = Math.floor(maxNgn / config.coinValueNgn);
  const applicableCoins = Math.min(account.coinBalance, maxCoinsByCap);
  if (applicableCoins < config.minRedeemCoins) return null;

  const ngnOff = applicableCoins * config.coinValueNgn;

  const handleClick = () => {
    onAdd();
    setCoinRedeemRequest(applicableCoins);
    router.push('/cart');
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className="flex w-full items-center justify-center gap-2 rounded-btn border-2 border-amber bg-amber/10 py-3 font-raleway text-sm font-bold uppercase tracking-btn text-navy transition-colors hover:bg-amber"
    >
      <Coins size={16} aria-hidden />
      Pay with Afrizone Coins · save {formatPriceNGN(ngnOff)}
    </button>
  );
}
