import { tap } from './tap';

describe('tap', () => {
  it('should return the original value', () => {
    const input = 42;
    const tapFn = jest.fn();
    
    const result = tap(tapFn)(input);
    
    expect(result).toBe(input);
  });

  it('should call the tap function with the input value', () => {
    const input = 'test';
    const tapFn = jest.fn();
    
    tap(tapFn)(input);
    
    expect(tapFn).toHaveBeenCalledWith(input);
    expect(tapFn).toHaveBeenCalledTimes(1);
  });

  it('should work with different types', () => {
    const numberTapFn = jest.fn();
    const stringTapFn = jest.fn();
    const objectTapFn = jest.fn();
    const arrayTapFn = jest.fn();

    const number = tap(numberTapFn)(123);
    const string = tap(stringTapFn)('hello');
    const object = tap(objectTapFn)({ key: 'value' });
    const array = tap(arrayTapFn)([1, 2, 3]);

    expect(number).toBe(123);
    expect(string).toBe('hello');
    expect(object).toEqual({ key: 'value' });
    expect(array).toEqual([1, 2, 3]);

    expect(numberTapFn).toHaveBeenCalledWith(123);
    expect(stringTapFn).toHaveBeenCalledWith('hello');
    expect(objectTapFn).toHaveBeenCalledWith({ key: 'value' });
    expect(arrayTapFn).toHaveBeenCalledWith([1, 2, 3]);
  });

  it('should work in a function chain', () => {
    const tapFn1 = jest.fn();
    const tapFn2 = jest.fn();
    
    const result = [1, 2, 3]
      .map(tap(tapFn1))
      .filter(x => x > 1)
      .map(tap(tapFn2));
    
    expect(result).toEqual([2, 3]);
    expect(tapFn1).toHaveBeenCalledTimes(3);
    expect(tapFn2).toHaveBeenCalledTimes(2);
  });

  it('should propagate errors from the tap function', () => {
    const tapFn = () => { throw new Error('Test error'); };
    expect(() => tap(tapFn)(42)).toThrow('Test error');
  });
});