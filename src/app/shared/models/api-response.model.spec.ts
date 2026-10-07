import { toList } from './api-response.model';

describe('toList', () => {
  it('reads the list from every response shape the API uses', () => {
    expect(toList([1, 2])).toEqual([1, 2]);
    expect(toList({ data: [1] })).toEqual([1]);
    expect(toList({ items: [2] })).toEqual([2]);
    expect(toList({ result: [3] })).toEqual([3]);
  });

  it('never returns the wrapper object (which *ngFor cannot iterate)', () => {
    expect(toList({ success: true, data: null })).toEqual([]);
    expect(toList({ data: { id: 1 } })).toEqual([]);
    expect(toList(null)).toEqual([]);
    expect(toList(undefined)).toEqual([]);
  });
});
