/** Agregação de vendas/comissão por cupom — usado em /parceiro e /admin/parceiros. */

export type CouponSale = { coupon_id: string; first_payment_value: number | null };
export type CouponStats = { vendas: number; receita: number };

export function aggregateCouponStats(sales: CouponSale[]): Map<string, CouponStats> {
  const statsByCoupon = new Map<string, CouponStats>();
  for (const sale of sales) {
    const prev = statsByCoupon.get(sale.coupon_id) ?? { vendas: 0, receita: 0 };
    prev.vendas += 1;
    prev.receita += sale.first_payment_value ?? 0;
    statsByCoupon.set(sale.coupon_id, prev);
  }
  return statsByCoupon;
}

export function couponCommission(receita: number, commissionPercent: number): number {
  return receita * (commissionPercent / 100);
}
