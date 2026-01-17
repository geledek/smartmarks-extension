import { useState, useEffect } from 'react';

const FIRST_RUN_KEY = 'smartmarks_first_run_completed';

/**
 * Hook to detect if this is the user's first run
 * Returns true on first run, false after onboarding completed
 */
export function useFirstRun() {
  const [isFirstRun, setIsFirstRun] = useState<boolean | null>(null);

  useEffect(() => {
    checkFirstRun();
  }, []);

  async function checkFirstRun() {
    const result = await chrome.storage.local.get(FIRST_RUN_KEY);
    const completed = result[FIRST_RUN_KEY] === true;
    setIsFirstRun(!completed);
  }

  async function completeFirstRun() {
    await chrome.storage.local.set({ [FIRST_RUN_KEY]: true });
    setIsFirstRun(false);
  }

  return {
    isFirstRun,
    completeFirstRun
  };
}
