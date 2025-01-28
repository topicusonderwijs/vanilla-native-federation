
export class Optional<T> {
  private constructor(private item: T|undefined) {

  }

  public static of<T>(item?: T): Optional<T>  {  
    return new Optional(item);  
  }

  public static empty<U>(): Optional<U>  {  return Optional.of<U>(undefined);  }

  public isPresent() {  return typeof this.item !== 'undefined' &&  this.item !== null }

  public set<U>(other: U) { return Optional.of(other); }

  public ifPresent(callback: (_:T) => void): void {
    if(this.isPresent()) callback(this.item as T);
  }

  public map<U>(callback: (_: NonNullable<T>) => U | Optional<U>): Optional<NonNullable<U>> {
    if(!this.isPresent()) return Optional.empty<NonNullable<U>>();

    const result = callback(this.item as NonNullable<T>);
    if(!result) return Optional.empty<NonNullable<U>>();
    return result instanceof Optional 
      ? result as Optional<NonNullable<U>> 
      : Optional.of(result!);
  }

  /**
   * Returns the value if present, otherwise returns the provided default value.
   * @param {Required<T>} other The default value to return if no value is present.
   * @returns {NonNullable<T>} The value if present, otherwise the default value.
   */
  public orElse(other: Required<T>): NonNullable<T> {
    return (this.isPresent())
      ? this.item as NonNullable<T>
      : other  as NonNullable<T>;
  }

  /**
   * Returns the value if present, otherwise throws an error.
   * @param {Error|string} error The error to throw if no value is present.
   * @returns {NonNullable<T>} The value if present.
   * @throws {Error} If no value is present.
   */
  public orThrow(error: Error|string): NonNullable<T> {
    if(this.isPresent()) return this.item as NonNullable<T>;
    throw (typeof error === "string") ? new Error(error) : error;
  }

  /**
   * Returns the wrapped value.
   * @returns {T|undefined} The wrapped value, or undefined if no value is present.
   */
  public get(): T|undefined {
    return this.item;
  }
}