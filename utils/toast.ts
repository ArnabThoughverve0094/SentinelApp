import Toast from 'react-native-toast-message';

export const showToast = {
  success: (message: string, title: string = 'Success') => {
    Toast.show({
      type: 'success',
      text1: title,
      text2: message,
      position: 'top',
      visibilityTime: 3000,
      autoHide: true,
      topOffset: 60,
    });
  },
  
  error: (message: string, title: string = 'Error') => {
    Toast.show({
      type: 'error',
      text1: title,
      text2: message,
      position: 'top',
      visibilityTime: 4000,
      autoHide: true,
      topOffset: 60,
    });
  },
  
  warning: (message: string, title: string = 'Warning') => {
    Toast.show({
      type: 'warning',
      text1: title,
      text2: message,
      position: 'top',
      visibilityTime: 4000,
      autoHide: true,
      topOffset: 60,
    });
  },
  
  info: (message: string, title: string = 'Info') => {
    Toast.show({
      type: 'info',
      text1: title,
      text2: message,
      position: 'top',
      visibilityTime: 3000,
      autoHide: true,
      topOffset: 60,
    });
  },

  // Quick methods without custom titles
  quickSuccess: (message: string) => {
    Toast.show({
      type: 'success',
      text1: message,
      position: 'top',
      visibilityTime: 2000,
      topOffset: 60,
    });
  },

  quickError: (message: string) => {
    Toast.show({
      type: 'error',
      text1: message,
      position: 'top',
      visibilityTime: 3000,
      topOffset: 60,
    });
  },

  // Custom positioning and timing
  custom: (type: 'success' | 'error' | 'warning' | 'info', title: string, message: string, options?: any) => {
    Toast.show({
      type,
      text1: title,
      text2: message,
      position: 'top',
      visibilityTime: 3000,
      autoHide: true,
      topOffset: 60,
      ...options,
    });
  },

  // Loading toast that you can update later
  loading: (message: string) => {
    Toast.show({
      type: 'info',
      text1: 'Loading...',
      text2: message,
      visibilityTime: 0, // Won't auto-hide
      autoHide: false,
      topOffset: 60,
    });
  },

  // Hide all toasts
  hide: () => {
    Toast.hide();
  },
};
//Utils/toast