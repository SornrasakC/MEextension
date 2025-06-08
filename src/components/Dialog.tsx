import React from 'react';
import { useFrontState } from '../hooks/useFrontState';
import { PROGRESS_STATUS } from '../types';

export default function Dialog(): JSX.Element {
  const [state] = useFrontState();

  const getStatusMessage = () => {
    switch (state.status) {
      case PROGRESS_STATUS.READING:
        return 'Reading manga pages...';
      case PROGRESS_STATUS.FINALIZING:
        return 'Finalizing download...';
      case PROGRESS_STATUS.FINISHED:
        return 'Download completed!';
      default:
        return 'Ready to extract manga';
    }
  };

  const getStatusColor = () => {
    switch (state.status) {
      case PROGRESS_STATUS.READING:
      case PROGRESS_STATUS.FINALIZING:
        return 'bg-blue-500';
      case PROGRESS_STATUS.FINISHED:
        return 'bg-green-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className="bg-white bg-opacity-90 rounded-lg p-4 shadow-lg max-w-xs">
      <div className={`w-full h-2 rounded-full mb-2 ${getStatusColor()}`} />
      <p className="text-sm text-gray-800">{getStatusMessage()}</p>
    </div>
  );
} 