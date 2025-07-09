import { useState } from 'react';
import { keyManager } from '../services/keyManager';
import { getValidator } from '../utils/keyValidation';

interface KeyManagementProps {
  onKeysUpdated?: () => void;
}

export function KeyManagement({ onKeysUpdated }: KeyManagementProps) {
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [keyInputs, setKeyInputs] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showWarning, setShowWarning] = useState(true);

  const providers = [
    { id: 'openai', name: 'OpenAI', placeholder: 'sk-...' },
    { id: 'gemini', name: 'Google Gemini', placeholder: 'AIza...' },
    { id: 'azure', name: 'Azure OpenAI', placeholder: 'Your Azure key' }
  ];

  const handleAddKey = (provider: string) => {
    const key = keyInputs[provider]?.trim();
    if (!key) return;

    const validator = getValidator(provider);
    const result = validator(key);

    if (!result.isValid) {
      setErrors({ ...errors, [provider]: result.error || 'Invalid key' });
      return;
    }

    keyManager.setKey(provider, key);
    setKeyInputs({ ...keyInputs, [provider]: '' });
    setErrors({ ...errors, [provider]: '' });
    onKeysUpdated?.();
  };

  const handleRemoveKey = (provider: string) => {
    keyManager.clearKey(provider);
    onKeysUpdated?.();
  };

  const currentKeys = keyManager.getKeyInfo();

  return (
    <div className="space-y-6">
      {/* Security Warning Banner */}
      {showWarning && (
        <div className="bg-theme-warning/10 border border-theme-warning/30 rounded-md p-4">
          <div className="flex items-start">
            <svg className="w-5 h-5 text-theme-warning mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <div className="flex-1">
              <h4 className="font-medium text-theme-warning mb-1">
                Bring Your Own Keys (BYOK) - WARNING!
              </h4>
              <ul className="text-sm text-theme-warning space-y-1">
                <li>• Use development/test keys only</li>
                <li>• Keys are stored in memory and cleared when you close this browser tab</li>
                <li>• Never share screenshots showing your API keys</li>
                <li>• We recommend using restricted keys with minimal permissions</li>
              </ul>
              <button
                onClick={() => setShowWarning(false)}
                className="text-xs text-theme-warning hover:text-theme-warning/80 mt-2 underline"
              >
                Dismiss warning
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Active Keys Display */}
      {currentKeys.length > 0 && (
        <div className="bg-theme-elevated rounded-md p-4">
          <h4 className="font-medium mb-3 flex items-center">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
            Active Keys
          </h4>
          <div className="space-y-2">
            {currentKeys.map((keyInfo) => (
              <div
                key={keyInfo.provider}
                className="flex items-center justify-between bg-theme-secondary rounded px-3 py-2 border border-theme"
              >
                <div className="flex items-center space-x-3">
                  <svg className="w-4 h-4 text-theme-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="font-medium capitalize">{keyInfo.provider}</span>
                  <code className="text-sm bg-theme-surface px-2 py-0.5 rounded">
                    {keyInfo.maskedKey}
                  </code>
                  <span className="text-xs text-theme-muted">
                    Added {keyInfo.addedAt.toLocaleTimeString()}
                  </span>
                </div>
                <button
                  onClick={() => handleRemoveKey(keyInfo.provider)}
                  className="text-theme-error hover:text-theme-error/80 p-1"
                  title="Remove key"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Key Input Form */}
      <div className="space-y-4">
        <h4 className="font-medium">Add API keys</h4>
        {providers.map((provider) => {
          const hasKey = currentKeys.some(k => k.provider === provider.id);
          if (hasKey) return null;

          return (
            <div key={provider.id} className="space-y-2">
              <label className="block text-sm font-medium">
                {provider.name} API key
              </label>
              <div className="flex space-x-2">
                <div className="flex-1 relative">
                  <input
                    type={showKeys[provider.id] ? 'text' : 'password'}
                    value={keyInputs[provider.id] || ''}
                    onChange={(e) => {
                      setKeyInputs({ ...keyInputs, [provider.id]: e.target.value });
                      setErrors({ ...errors, [provider.id]: '' });
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleAddKey(provider.id);
                      }
                    }}
                    placeholder={provider.placeholder}
                    className={`block w-full px-3 py-2 pr-10 input-theme rounded-md shadow-sm ${
                      errors[provider.id] ? 'border-theme-error' : ''
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowKeys({ ...showKeys, [provider.id]: !showKeys[provider.id] })}
                    className="absolute right-2 top-2.5 text-theme-muted hover:text-theme-secondary"
                  >
                    {showKeys[provider.id] ? (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
                <button
                  onClick={() => handleAddKey(provider.id)}
                  disabled={!keyInputs[provider.id]}
                  className="px-4 py-2 btn-theme-primary text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Add Key
                </button>
              </div>
              {errors[provider.id] && (
                <p className="text-sm text-theme-error flex items-center">
                  <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {errors[provider.id]}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* Clear All Keys Button */}
      {currentKeys.length > 0 && (
        <div className="pt-4 border-t">
          <button
            onClick={() => {
              if (confirm('Remove all API keys? You will need to re-enter them.')) {
                keyManager.clearAll();
                onKeysUpdated?.();
              }
            }}
            className="text-sm text-theme-error hover:text-theme-error/80 flex items-center"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Clear all keys
          </button>
        </div>
      )}
    </div>
  );
}