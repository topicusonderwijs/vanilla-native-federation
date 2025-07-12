import { Optional } from './optional'; // Adjust the import path as needed

describe('Optional', () => {
  describe('static of', () => {
    it('should create an Optional with a value', () => {
      const opt = Optional.of('test');
      expect(opt.isPresent()).toBe(true);
      expect(opt.get()).toBe('test');
    });

    it('should create an Optional with undefined', () => {
      const opt = Optional.of(undefined);
      expect(opt.isPresent()).toBe(false);
      expect(opt.get()).toBeUndefined();
    });

    it('should create an Optional with null', () => {
      const opt = Optional.of(null);
      expect(opt.isPresent()).toBe(false);
      expect(opt.get()).toBeNull();
    });
  });

  describe('static empty', () => {
    it('should create an empty Optional', () => {
      const opt = Optional.empty<string>();
      expect(opt.isPresent()).toBe(false);
      expect(opt.get()).toBeUndefined();
    });
  });

  describe('isPresent', () => {
    it('should return true for non-null values', () => {
      expect(Optional.of('test').isPresent()).toBe(true);
      expect(Optional.of(0).isPresent()).toBe(true);
      expect(Optional.of(false).isPresent()).toBe(true);
      expect(Optional.of('').isPresent()).toBe(true);
    });

    it('should return false for null and undefined', () => {
      expect(Optional.of(null).isPresent()).toBe(false);
      expect(Optional.of(undefined).isPresent()).toBe(false);
      expect(Optional.empty().isPresent()).toBe(false);
    });
  });

  describe('set', () => {
    it('should create a new Optional with the given value', () => {
      const opt1 = Optional.of('test');
      const opt2 = opt1.set('new value');

      expect(opt2.get()).toBe('new value');
      expect(opt1.get()).toBe('test'); // Original should be unchanged
    });

    it('should allow setting to null or undefined', () => {
      const opt = Optional.of('test');

      const nullOpt = opt.set(null);
      expect(nullOpt.isPresent()).toBe(false);

      const undefinedOpt = opt.set(undefined);
      expect(undefinedOpt.isPresent()).toBe(false);
    });

    it('should work when chaining from an empty Optional', () => {
      const opt = Optional.empty<string>().set('new value');
      expect(opt.isPresent()).toBe(true);
      expect(opt.get()).toBe('new value');
    });
  });

  describe('ifPresent', () => {
    it('should call the callback if value is present', () => {
      const mockCallback = jest.fn();
      Optional.of('test').ifPresent(mockCallback);

      expect(mockCallback).toHaveBeenCalledTimes(1);
      expect(mockCallback).toHaveBeenCalledWith('test');
    });

    it('should not call the callback if value is not present', () => {
      const mockCallback = jest.fn();
      Optional.empty().ifPresent(mockCallback);
      Optional.of(null).ifPresent(mockCallback);
      Optional.of(undefined).ifPresent(mockCallback);

      expect(mockCallback).not.toHaveBeenCalled();
    });
  });

  describe('map', () => {
    it('should transform the value if present', () => {
      const opt = Optional.of('test');
      const mapped = opt.map(value => value.toUpperCase());

      expect(mapped.isPresent()).toBe(true);
      expect(mapped.get()).toBe('TEST');
    });

    it('should return empty Optional if initial value is not present', () => {
      const opt = Optional.empty<string>();
      const mapped = opt.map(value => value.toUpperCase());

      expect(mapped.isPresent()).toBe(false);
    });

    it('should handle callback returning an Optional', () => {
      const opt = Optional.of('test');
      const mapped = opt.map(value => Optional.of(value.length));

      expect(mapped.isPresent()).toBe(true);
      expect(mapped.get()).toBe(4);
    });

    it('should handle callback returning null or undefined', () => {
      const opt = Optional.of('test');

      const mappedNull = opt.map(() => null);
      expect(mappedNull.isPresent()).toBe(false);

      const mappedUndefined = opt.map(() => undefined);
      expect(mappedUndefined.isPresent()).toBe(false);
    });

    it('should work with complex object transformations', () => {
      interface User {
        name: string;
        age: number;
      }

      const user: User = { name: 'Alice', age: 30 };
      const opt = Optional.of(user);

      const nameOpt = opt.map(u => u.name);
      expect(nameOpt.get()).toBe('Alice');

      const lengthOpt = opt.map(u => u.name.length);
      expect(lengthOpt.get()).toBe(5);
    });
  });

  describe('orElse', () => {
    it('should return the contained value if present', () => {
      const opt = Optional.of('test');
      const result = opt.orElse('default' as any);

      expect(result).toBe('test');
    });

    it('should return the default value if not present', () => {
      const opt = Optional.empty<string>();
      const result = opt.orElse('default' as any);

      expect(result).toBe('default');
    });

    it('should work with null Optional', () => {
      const opt = Optional.of(null);
      const result = opt.orElse('default' as any);

      expect(result).toBe('default');
    });

    it('should handle numeric values', () => {
      const opt = Optional.of(0);
      const emptyOpt = Optional.empty<number>();

      expect(opt.orElse(42 as any)).toBe(0);
      expect(emptyOpt.orElse(42 as any)).toBe(42);
    });
  });

  describe('orThrow', () => {
    it('should return the contained value if present', () => {
      const opt = Optional.of('test');
      const result = opt.orThrow(new Error('Not found'));

      expect(result).toBe('test');
    });

    it('should throw the provided Error object if not present', () => {
      const opt = Optional.empty<string>();
      const error = new Error('Not found');

      expect(() => opt.orThrow(error)).toThrow(error);
    });

    it('should throw an Error with the provided string message if not present', () => {
      const opt = Optional.empty<string>();

      expect(() => opt.orThrow('Not found')).toThrow('Not found');
    });

    it('should work with null Optional', () => {
      const opt = Optional.of(null);

      expect(() => opt.orThrow('Value is null')).toThrow('Value is null');
    });
  });

  describe('get', () => {
    it('should return the contained value if present', () => {
      expect(Optional.of('test').get()).toBe('test');
      expect(Optional.of(42).get()).toBe(42);
      expect(Optional.of(false).get()).toBe(false);
    });

    it('should return undefined if not present', () => {
      expect(Optional.empty().get()).toBeUndefined();
    });

    it('should return null if null was provided', () => {
      expect(Optional.of(null).get()).toBeNull();
    });
  });

  // Additional tests for edge cases and complex scenarios
  describe('edge cases', () => {
    it('should handle complex types', () => {
      const arr = [1, 2, 3];
      const opt = Optional.of(arr);

      expect(opt.isPresent()).toBe(true);
      expect(opt.get()).toBe(arr);

      const mapped = opt.map(a => a.map(n => n * 2));
      expect(mapped.get()).toEqual([2, 4, 6]);
    });

    it('should maintain proper chaining with empty values', () => {
      const result = Optional.of('test')
        .map(s => s.toUpperCase())
        .map(() => null)
        .map(n => `This won't run: ${n}`)
        .orElse('fallback' as any);

      expect(result).toBe('fallback');
    });

    it('should handle nested Optionals properly', () => {
      const nestedOpt = Optional.of(Optional.of('nested'));

      // Map to unwrap the inner Optional
      const unwrapped = nestedOpt.map(inner => inner.get());
      expect(unwrapped.get()).toBe('nested');

      // Handle empty inner Optional
      const emptyInner = Optional.of(Optional.empty<string>());
      const result = emptyInner.map(inner => inner.orElse('default' as any));
      expect(result.get()).toBe('default');
    });

    it('should work with function values', () => {
      const fn = (x: number) => x * 2;
      const opt = Optional.of(fn);

      expect(opt.isPresent()).toBe(true);

      const result = opt.map(f => f(21));
      expect(result.get()).toBe(42);
    });
  });
});
