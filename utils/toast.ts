import Toast from 'react-native-toast-message';

export const showToast = {
  success: (message: string, title: string = 'Bookmark Saved') => {
    Toast.show({
      type: 'success',
      text1: title,
      text2: message,
      position: 'bottom',
      visibilityTime: 4000,
      autoHide: true,
      bottomOffset: 90, // Above bottom navigation
    });
  },
  
  error: (message: string, title: string = 'Error') => {
    Toast.show({
      type: 'error',
      text1: title,
      text2: message,
      position: 'bottom',
      visibilityTime: 4000,
      autoHide: true,
      bottomOffset: 90,
    });
  },
  
  warning: (message: string, title: string = 'Warning') => {
    Toast.show({
      type: 'warning',
      text1: title,
      text2: message,
      position: 'bottom',
      visibilityTime: 4000,
      autoHide: true,
      bottomOffset: 90,
    });
  },
  
  info: (message: string, title: string = 'Info') => {
    Toast.show({
      type: 'info',
      text1: title,
      text2: message,
      position: 'bottom',
      visibilityTime: 3000,
      autoHide: true,
      bottomOffset: 90,
    });
  },

  // Quick methods without custom titles
  quickSuccess: (message: string) => {
    Toast.show({
      type: 'success',
      text1: message,
      position: 'bottom',
      visibilityTime: 2000,
      bottomOffset: 90,
    });
  },

  quickError: (message: string) => {
    Toast.show({
      type: 'error',
      text1: message,
      position: 'bottom',
      visibilityTime: 3000,
      bottomOffset: 90,
    });
  },

  // Custom positioning and timing
  custom: (type: 'success' | 'error' | 'warning' | 'info', title: string, message: string, options?: any) => {
    Toast.show({
      type,
      text1: title,
      text2: message,
      position: 'bottom',
      visibilityTime: 3000,
      autoHide: true,
      bottomOffset: 90,
      ...options,
    });
  },

  // Loading toast that you can update later
  loading: (message: string) => {
    Toast.show({
      type: 'info',
      text1: 'Loading...',
      text2: message,
      visibilityTime: 0,
      autoHide: false,
      bottomOffset: 90,
    });
  },

  // Hide all toasts
  hide: () => {
    Toast.hide();
  },
};
