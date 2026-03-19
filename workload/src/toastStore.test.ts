import { describe, it, expect, beforeEach } from 'vitest';
import { useToastStore } from './toastStore';

function store() {
  return useToastStore.getState();
}

beforeEach(() => {
  useToastStore.setState({ toasts: [] });
});

describe('toastStore', () => {
  it('add() creates a toast with correct fields', () => {
    store().add('Hello', 'success');
    const { toasts } = store();
    expect(toasts).toHaveLength(1);
    expect(toasts[0].message).toBe('Hello');
    expect(toasts[0].type).toBe('success');
    expect(typeof toasts[0].id).toBe('string');
    expect(toasts[0].id.length).toBeGreaterThan(0);
  });

  it('default durations per type', () => {
    store().add('msg', 'success');
    store().add('msg', 'info');
    store().add('msg', 'warning');
    useToastStore.setState({ toasts: [] });

    store().add('msg', 'success');
    expect(store().toasts[0].duration).toBe(5000);
    useToastStore.setState({ toasts: [] });

    store().add('msg', 'info');
    expect(store().toasts[0].duration).toBe(6000);
    useToastStore.setState({ toasts: [] });

    store().add('msg', 'warning');
    expect(store().toasts[0].duration).toBe(7000);
    useToastStore.setState({ toasts: [] });

    store().add('msg', 'error');
    expect(store().toasts[0].duration).toBe(8000);
  });

  it('explicit duration overrides default', () => {
    store().add('msg', 'success', 9999);
    expect(store().toasts[0].duration).toBe(9999);
  });

  it('duration=0 is stored as-is (persistent)', () => {
    store().add('msg', 'error', 0);
    expect(store().toasts[0].duration).toBe(0);
  });

  it('caps at 3 toasts — 4th drops oldest', () => {
    store().add('A');
    store().add('B');
    store().add('C');
    store().add('D');
    const { toasts } = store();
    expect(toasts).toHaveLength(3);
    expect(toasts.map((t) => t.message)).toEqual(['B', 'C', 'D']);
  });

  it('dismiss(id) removes correct toast, leaves others', () => {
    store().add('X');
    store().add('Y');
    const id = store().toasts[0].id;
    store().dismiss(id);
    const { toasts } = store();
    expect(toasts).toHaveLength(1);
    expect(toasts[0].message).toBe('Y');
  });

  it('dismiss with unknown id does not crash', () => {
    store().add('Z');
    expect(() => store().dismiss('nonexistent-id')).not.toThrow();
    expect(store().toasts).toHaveLength(1);
  });

  it('multiple adds accumulate up to max', () => {
    store().add('1');
    store().add('2');
    expect(store().toasts).toHaveLength(2);
    store().add('3');
    expect(store().toasts).toHaveLength(3);
  });

  it('default type is success when not specified', () => {
    store().add('hello');
    expect(store().toasts[0].type).toBe('success');
  });
});
