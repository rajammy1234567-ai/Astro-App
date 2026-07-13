/**
 * Pooja / Remedy money flow:
 * 1. User pays full amount (wallet etc.)
 * 2. Full amount is held by admin/platform (fundsHeldByAdmin)
 * 3. Astrologer sees "pending" share (their %)
 * 4. After hold months (default 3), admin can release % to astrologer
 */

const HOLD_MONTHS = Number(process.env.PAYOUT_HOLD_MONTHS || 3);
const DEFAULT_ASTRO_SHARE = Number(process.env.ASTRO_SERVICE_SHARE_PERCENT || 70);

function addMonths(date, months) {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

function buildEscrowFields({ totalAmount, astrologerId, sharePercent }) {
  const pct = Math.min(100, Math.max(0, Number(sharePercent ?? DEFAULT_ASTRO_SHARE)));
  const shareAmount = Math.round((Number(totalAmount) * pct) / 100);
  const now = new Date();

  return {
    fundsHeldByAdmin: true,
    heldAmount: Number(totalAmount),
    astrologer: astrologerId || null,
    astrologerSharePercent: pct,
    astrologerShareAmount: shareAmount,
    releasedToAstrologer: 0,
    payoutStatus: astrologerId ? 'held' : 'n/a',
    payoutEligibleAt: addMonths(now, HOLD_MONTHS),
  };
}

module.exports = {
  HOLD_MONTHS,
  DEFAULT_ASTRO_SHARE,
  addMonths,
  buildEscrowFields,
};
