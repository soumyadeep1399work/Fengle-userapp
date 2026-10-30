import { Coupon } from '../types';
import { formatMoney } from './money';

/** "20% off up to ₹100" / "₹50 off". */
export function discountLabel(c: Coupon): string {
  if (c.discountType === 'percent') {
    const cap = c.maxDiscountAmount ? ` up to ${formatMoney(c.maxDiscountAmount)}` : '';
    return `${c.discountValue}% off${cap}`;
  }
  return `${formatMoney(c.discountValue)} off`;
}
