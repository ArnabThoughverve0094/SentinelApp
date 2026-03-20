import Toast from 'react-native-toast-message';

export const showToast = {
<<<<<<< HEAD
  success: (message: string, title: string = 'Bookmark Saved') => {
=======
  success: (message: string, title: string = 'Success') => {
>>>>>>> c8fb6dcefe440265631c69f78a64e9c408f85650
    Toast.show({
      type: 'success',
      text1: title,
      text2: message,
<<<<<<< HEAD
      position: 'bottom',
      visibilityTime: 4000,
      autoHide: true,
      bottomOffset: 90, // Above bottom navigation
=======
      position: 'top',
      visibilityTime: 3000,
      autoHide: true,
      topOffset: 60,
>>>>>>> c8fb6dcefe440265631c69f78a64e9c408f85650
    });
  },
  
  error: (message: string, title: string = 'Error') => {
    Toast.show({
      type: 'error',
      text1: title,
      text2: message,
<<<<<<< HEAD
      position: 'bottom',
      visibilityTime: 4000,
      autoHide: true,
      bottomOffset: 90,
=======
      position: 'top',
      visibilityTime: 4000,
      autoHide: true,
      topOffset: 60,
>>>>>>> c8fb6dcefe440265631c69f78a64e9c408f85650
    });
  },
  
  warning: (message: string, title: string = 'Warning') => {
    Toast.show({
      type: 'warning',
      text1: title,
      text2: message,
<<<<<<< HEAD
      position: 'bottom',
      visibilityTime: 4000,
      autoHide: true,
      bottomOffset: 90,
=======
      position: 'top',
      visibilityTime: 4000,
      autoHide: true,
      topOffset: 60,
>>>>>>> c8fb6dcefe440265631c69f78a64e9c408f85650
    });
  },
  
  info: (message: string, title: string = 'Info') => {
    Toast.show({
      type: 'info',
      text1: title,
      text2: message,
<<<<<<< HEAD
      position: 'bottom',
      visibilityTime: 3000,
      autoHide: true,
      bottomOffset: 90,
=======
      position: 'top',
      visibilityTime: 3000,
      autoHide: true,
      topOffset: 60,
>>>>>>> c8fb6dcefe440265631c69f78a64e9c408f85650
    });
  },

  // Quick methods without custom titles
  quickSuccess: (message: string) => {
    Toast.show({
      type: 'success',
      text1: message,
<<<<<<< HEAD
      position: 'bottom',
      visibilityTime: 2000,
      bottomOffset: 90,
=======
      position: 'top',
      visibilityTime: 2000,
      topOffset: 60,
>>>>>>> c8fb6dcefe440265631c69f78a64e9c408f85650
    });
  },

  quickError: (message: string) => {
    Toast.show({
      type: 'error',
      text1: message,
<<<<<<< HEAD
      position: 'bottom',
      visibilityTime: 3000,
      bottomOffset: 90,
=======
      position: 'top',
      visibilityTime: 3000,
      topOffset: 60,
>>>>>>> c8fb6dcefe440265631c69f78a64e9c408f85650
    });
  },

  // Custom positioning and timing
  custom: (type: 'success' | 'error' | 'warning' | 'info', title: string, message: string, options?: any) => {
    Toast.show({
      type,
      text1: title,
      text2: message,
<<<<<<< HEAD
      position: 'bottom',
      visibilityTime: 3000,
      autoHide: true,
      bottomOffset: 90,
=======
      position: 'top',
      visibilityTime: 3000,
      autoHide: true,
      topOffset: 60,
>>>>>>> c8fb6dcefe440265631c69f78a64e9c408f85650
      ...options,
    });
  },

  // Loading toast that you can update later
  loading: (message: string) => {
    Toast.show({
      type: 'info',
      text1: 'Loading...',
      text2: message,
<<<<<<< HEAD
      visibilityTime: 0,
      autoHide: false,
      bottomOffset: 90,
=======
      visibilityTime: 0, // Won't auto-hide
      autoHide: false,
      topOffset: 60,
>>>>>>> c8fb6dcefe440265631c69f78a64e9c408f85650
    });
  },

  // Hide all toasts
  hide: () => {
    Toast.hide();
  },
};
<<<<<<< HEAD
=======
//Utils/toast
>>>>>>> c8fb6dcefe440265631c69f78a64e9c408f85650
