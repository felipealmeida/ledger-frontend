import Decimal from 'decimal.js';
import { LedgerAccount, AccWithBig } from '../types/api';

export function assertHasBig(
    acc: AccWithBig
): asserts acc is LedgerAccount & { amountsBigInt: Record<string, Decimal>, clearedAmountsBigInt: Record<string, Decimal> } {
    if (!acc.amountsBigInt || !acc.clearedAmountsBigInt) {
        throw new Error('amountsBigInt is missing');
    }
}

export const getAmountSign = (d: Decimal): 'zero' | 'positive' | 'negative' =>
    d.isZero() ? 'zero' : d.isPositive() ? 'positive' : 'negative';

export const getNonZeroAmounts = (acc: AccWithBig) => {
    assertHasBig(acc);
    return Object.entries(acc.amountsBigInt)
        .filter(([_, d]) => !d.isZero())
        .map(([currency, value]) => ({ currency, value }))
        .sort((a, b) => {
            const cmp = b.value.abs().comparedTo(a.value.abs());
            return cmp !== 0 ? cmp : a.currency.localeCompare(b.currency);
        });
};
