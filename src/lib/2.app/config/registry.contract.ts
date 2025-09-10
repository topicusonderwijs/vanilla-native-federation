export type NFEventRegistryConfig = {
  maxStreams: number;
  maxEvents: number;
  removePercentage: number;
};

export type NFEventRegistryOptions = Partial<NFEventRegistryConfig>;
