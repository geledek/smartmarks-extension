import { useState, useEffect } from 'react';
import { hasPermission, requestPermission, removePermission } from '../utils';

interface PermissionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onGranted?: () => void;
}

/**
 * Dialog for requesting optional history permission
 * Shows on first run and can be accessed from settings
 */
export function PermissionDialog({ isOpen, onClose, onGranted }: PermissionDialogProps) {
  const [hasHistoryPermission, setHasHistoryPermission] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);

  useEffect(() => {
    checkPermission();
  }, [isOpen]);

  async function checkPermission() {
    const granted = await hasPermission('history');
    setHasHistoryPermission(granted);
  }

  async function handleRequestPermission() {
    setIsRequesting(true);
    try {
      const granted = await requestPermission('history');
      setHasHistoryPermission(granted);

      if (granted && onGranted) {
        onGranted();
      }

      if (granted) {
        onClose();
      }
    } catch (error) {
      console.error('Failed to request permission:', error);
    } finally {
      setIsRequesting(false);
    }
  }

  async function handleRemovePermission() {
    setIsRequesting(true);
    try {
      await removePermission('history');
      setHasHistoryPermission(false);
    } catch (error) {
      console.error('Failed to remove permission:', error);
    } finally {
      setIsRequesting(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Enable Smart Archiving
        </h2>

        {hasHistoryPermission ? (
          <>
            <div className="mb-6 space-y-3">
              <div className="flex items-start space-x-3">
                <svg className="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <p className="text-gray-700">
                  History tracking is <strong>enabled</strong>. SmartMarks can track which bookmarks you visit to provide smart archiving suggestions.
                </p>
              </div>
            </div>

            <div className="flex justify-between space-x-3">
              <button
                onClick={handleRemovePermission}
                disabled={isRequesting}
                className="px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 disabled:opacity-50"
              >
                Revoke Permission
              </button>
              <button
                onClick={onClose}
                className="px-6 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg"
              >
                Done
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="mb-6 space-y-3">
              <div className="flex items-start space-x-3">
                <svg className="w-6 h-6 text-blue-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-gray-700">
                  SmartMarks can track which bookmarks you visit to automatically archive inactive ones.
                </p>
              </div>

              <div className="flex items-start space-x-3">
                <svg className="w-6 h-6 text-blue-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <p className="text-gray-700">
                  <strong>Your privacy matters:</strong> All tracking happens locally on your device. No data is sent to external servers.
                </p>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-yellow-800">
                <strong>Optional:</strong> If you decline, SmartMarks will only track visits when you click bookmarks from the extension popup. You can enable this later in settings.
              </p>
            </div>

            <div className="flex justify-between space-x-3">
              <button
                onClick={onClose}
                className="px-6 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
              >
                Skip for Now
              </button>
              <button
                onClick={handleRequestPermission}
                disabled={isRequesting}
                className="px-6 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50"
              >
                {isRequesting ? 'Requesting...' : 'Enable Tracking'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/**
 * Settings toggle for history permission
 * Simpler version for use in settings page
 */
export function HistoryPermissionToggle() {
  const [hasHistoryPermission, setHasHistoryPermission] = useState(false);
  const [isChanging, setIsChanging] = useState(false);

  useEffect(() => {
    checkPermission();
  }, []);

  async function checkPermission() {
    const granted = await hasPermission('history');
    setHasHistoryPermission(granted);
  }

  async function handleToggle() {
    setIsChanging(true);
    try {
      if (hasHistoryPermission) {
        await removePermission('history');
        setHasHistoryPermission(false);
      } else {
        const granted = await requestPermission('history');
        setHasHistoryPermission(granted);
      }
    } catch (error) {
      console.error('Failed to toggle permission:', error);
    } finally {
      setIsChanging(false);
    }
  }

  return (
    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
      <div className="flex-1">
        <h3 className="text-sm font-medium text-gray-900">History Tracking</h3>
        <p className="text-sm text-gray-600 mt-1">
          Track bookmark visits for smart archiving suggestions
        </p>
      </div>
      <button
        onClick={handleToggle}
        disabled={isChanging}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 ${
          hasHistoryPermission ? 'bg-blue-600' : 'bg-gray-200'
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            hasHistoryPermission ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  );
}
