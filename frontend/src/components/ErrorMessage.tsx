import { AlertCircle, RefreshCw } from 'lucide-react';

interface ErrorMessageProps {
  message: string;
  onRetry?: () => void;
}

export function ErrorMessage({ message, onRetry }: ErrorMessageProps) {
  return (
    <div className="bg-rose-500/5 border border-rose-500/20 rounded-xl p-6 text-center">
      <AlertCircle className="w-12 h-12 text-rose-400 mx-auto mb-3" />
      <h3 className="text-lg font-medium text-rose-300 mb-2">出错了</h3>
      <p className="text-rose-400/80 mb-4">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-2 px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-500 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          重试
        </button>
      )}
    </div>
  );
}
