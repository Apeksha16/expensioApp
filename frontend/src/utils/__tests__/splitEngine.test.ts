import { splitEngine } from '../splitEngine';
import type { SplitItem } from '../../types';

// Ambient definitions for test runner environments
declare const describe: (name: string, fn: () => void) => void;
declare const it: (name: string, fn: () => void) => void;
declare const expect: (actual: any) => {
  toBe: (expected: any) => void;
  toEqual: (expected: any) => void;
};

// Self-contained runner for CI and standalone execution
export function runSplitEngineTests(): boolean {
  let passed = 0;
  let failed = 0;

  function assert(name: string, condition: boolean) {
    if (condition) {
      passed++;
    } else {
      failed++;
      console.error(`[TEST FAILED] ${name}`);
    }
  }

  // 1. Equal Share
  assert('calculateEqualShare(300, 3) === 100', splitEngine.calculateEqualShare(300, 3) === 100);
  assert('calculateEqualShare(100, 3) === 33.33', splitEngine.calculateEqualShare(100, 3) === 33.33);
  assert('calculateEqualShare(100, 0) === 0', splitEngine.calculateEqualShare(100, 0) === 0);

  // 2. Summary
  const mockItems: SplitItem[] = [
    { id: '1', title: 'Dinner', amount: 1500, date: 'Sep 20', paidBy: 'YOU', status: 'PENDING', youGet: 1000 },
    { id: '2', title: 'Cab', amount: 600, date: 'Sep 21', paidBy: 'Rahul', status: 'PENDING', youOwe: 200 },
    { id: '3', title: 'Movie', amount: 800, date: 'Sep 22', paidBy: 'YOU', status: 'SETTLED', youGet: 400 },
  ];
  const summary = splitEngine.computeSummary(mockItems);
  assert('computeSummary youllGet === 1000', summary.youllGet === 1000);
  assert('computeSummary youOwe === 200', summary.youOwe === 200);
  assert('computeSummary getPeopleCount === 1', summary.getPeopleCount === 1);
  assert('computeSummary owePeopleCount === 1', summary.owePeopleCount === 1);

  // 3. Settle
  const settled = splitEngine.settleItem(mockItems[0]);
  assert('settleItem status === SETTLED', settled.status === 'SETTLED');
  assert('settleItem youGet === 0', settled.youGet === 0);

  // 4. Currency
  assert('formatINR(31169) === ₹31,169', splitEngine.formatINR(31169) === '₹31,169');

  return failed === 0 && passed > 0;
}

if (typeof describe !== 'undefined') {
  describe('splitEngine', () => {
    it('passes all financial arithmetic and settlement checks', () => {
      expect(runSplitEngineTests()).toBe(true);
    });
  });
}
