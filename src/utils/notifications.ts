import { toast } from 'react-toastify';

export function extractApiErrorMessage(error: any, fallback = 'Ocorreu um erro inesperado.') {
  const payload = error?.response?.data;

  const nestedMessage = payload?.error?.message;
  const flatMessage = payload?.message;
  const legacyMessage = payload?.error;

  if (nestedMessage && typeof nestedMessage === 'string') return nestedMessage;
  if (flatMessage && typeof flatMessage === 'string') return flatMessage;
  if (legacyMessage && typeof legacyMessage === 'string') return legacyMessage;

  return fallback;
}

export const notify = {
  success: (message: string) => toast.success(message),
  error: (message: string) => toast.error(message),
  warning: (message: string) => toast.warning(message),
  info: (message: string) => toast.info(message),
};
