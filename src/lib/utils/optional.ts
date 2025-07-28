export class Optional<T> {
  private constructor(private item?: T) {}

  public static of<T>(item?: T): Optional<T> {
    return new Optional(item);
  }
  public static empty<U>(): Optional<U> {
    return Optional.of<U>(undefined);
  }

  public isPresent() {
    return typeof this.item !== 'undefined' && this.item !== null;
  }
  public set<U>(other: U) {
    return Optional.of(other);
  }

  public ifPresent(callback: (_: T) => void): void {
    if (this.isPresent()) callback(this.item as T);
  }

  public map<U>(callback: (_: NonNullable<T>) => U | Optional<U>): Optional<U> {
    if (!this.isPresent()) return Optional.empty();

    const result = callback(this.item as NonNullable<T>);
    return result instanceof Optional ? result : Optional.of(result);
  }

  public orElse(other: Required<T>): NonNullable<T> {
    return this.isPresent() ? (this.item as NonNullable<T>) : (other as NonNullable<T>);
  }

  public orThrow(error: Error | string | (() => Error)): NonNullable<T> {
    if (this.isPresent()) return this.item as NonNullable<T>;
    if (typeof error === 'function') throw error();
    throw typeof error === 'string' ? new Error(error) : error;
  }

  public get(): T | undefined {
    return this.item;
  }
}
