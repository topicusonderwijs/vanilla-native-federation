import { cloneEntry } from './clone-entry';

describe('cloneEntry', () => {
  test('should clone primitive values', () => {
    expect(cloneEntry('test',42)).toBe(42);
    expect(cloneEntry('test','hello')).toBe('hello');
    expect(cloneEntry('test',true)).toBe(true);
    expect(cloneEntry('test',null)).toBe(null);
  });

  test('should deep clone objects', () => {
    const original = { a: 1, b: { c: 2 } };
    const cloned = cloneEntry('test',original);
    
    expect(cloned).toEqual(original);
    expect(cloned).not.toBe(original);
    expect(cloned.b).not.toBe(original.b);
  });

  test('should deep clone arrays', () => {
    const original = [1, [2, 3], { a: 4 }];
    const cloned = cloneEntry('test',original);
    
    expect(cloned).toEqual(original);
    expect(cloned).not.toBe(original);
    expect(cloned[1]).not.toBe(original[1]);
    expect(cloned[2]).not.toBe(original[2]);
  });
  
  test('should clone complex nested structures', () => {
    const original = {
      numbers: [1, 2, 3],
      nested: {
        a: [{ b: 1 }],
      }
    };
    
    const cloned = cloneEntry('test',original);
    
    expect(cloned).toEqual(original);
    expect(cloned).not.toBe(original);
    expect(cloned.nested).not.toBe(original.nested);
    expect(cloned.nested.a).not.toBe(original.nested.a);
  });

  test('should handle environments where structuredClone is not defined', () => {
    const originalStructuredClone = globalThis.structuredClone;
    delete (globalThis as any).structuredClone;

    try {
        const obj = { a: 1, b: { c: 2 } };
        const cloned = cloneEntry('test',obj);
        
        expect(cloned).toEqual(obj);
        expect(cloned).not.toBe(obj);
    } finally {
        (globalThis as any).structuredClone = originalStructuredClone;
    }
});

describe('FALLBACK Json parse', () => {
  let originalStructuredClone: any;

  beforeEach(() => {
    originalStructuredClone = global.structuredClone;
    delete (global as any).structuredClone;
  });

  afterEach(() => {
    (global as any).structuredClone = originalStructuredClone;
  });

  it('should handle JSON-safe values in fallback mode', () => {
    const original = {
      string: 'hello',
      number: 42,
      boolean: true,
      null: null,
      array: [1, 2, 3],
      nested: { a: 1 }
    };
    
    const cloned = cloneEntry('test',original);
    expect(cloned).toEqual(original);
    expect(cloned).not.toBe(original);
  });

  it('should throw an error if the entry is not parse-able', () => {
    const original: any = { a: 1 };
    original.self = original;

    const actual = () => cloneEntry("test",original);

    expect(actual).toThrow(`Could not parse storage entry 'test'`);
  })
})

  
});