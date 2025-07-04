export interface KeyInfo {
  provider: 'openai' | 'gemini' | 'azure';
  maskedKey: string;
  addedAt: Date;
}

class KeyManager {
  private keys: Map<string, string> = new Map();
  private keyMetadata: Map<string, KeyInfo> = new Map();

  /**
   * Store a key in memory with metadata
   */
  setKey(provider: string, key: string): void {
    this.keys.set(provider, key);
    this.keyMetadata.set(provider, {
      provider: provider as KeyInfo['provider'],
      maskedKey: this.maskKey(key),
      addedAt: new Date()
    });
  }

  /**
   * Retrieve a key (returns undefined if not set)
   */
  getKey(provider: string): string | undefined {
    return this.keys.get(provider);
  }

  /**
   * Get metadata about stored keys (for UI display)
   */
  getKeyInfo(): KeyInfo[] {
    return Array.from(this.keyMetadata.values());
  }

  /**
   * Check if a specific provider key is set
   */
  hasKey(provider: string): boolean {
    return this.keys.has(provider);
  }

  /**
   * Clear a specific key
   */
  clearKey(provider: string): void {
    this.keys.delete(provider);
    this.keyMetadata.delete(provider);
  }

  /**
   * Clear all keys (useful for "logout" functionality)
   */
  clearAll(): void {
    this.keys.clear();
    this.keyMetadata.clear();
  }

  /**
   * Mask key for display (show only last 4 characters)
   */
  private maskKey(key: string): string {
    if (key.length <= 8) {
      return '••••••••';
    }
    return '••••' + key.slice(-4);
  }
}

// Singleton instance
export const keyManager = new KeyManager();