import { EventSubscription } from 'expo-modules-core';
import * as Notifications from "expo-notifications";
import React, {
  ReactNode,
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { registerForPushNotificationAsync } from "../utils/registerForPushNotificationAsync";
  
  interface NotificationContextType {
    expoPushToken: string | null;
    notification: Notifications.Notification | null;
    error: Error | null;
  }
  
  Notifications.setNotificationHandler({
    handleNotification:async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    })
  })

  const NotificationContext = createContext<NotificationContextType | undefined>(
    undefined
  );
  
  export const useNotification = () => {
    const context = useContext(NotificationContext);
    if (context === undefined) {
      throw new Error(
        "useNotification must be used within a NotificationProvider"
      );
    }
    return context;
  };
  
  interface NotificationProviderProps {
    children: ReactNode;
  }
  
  export const NotificationProvider: React.FC<NotificationProviderProps> = ({
    children,
  }) => {
    const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
    const [notification, setNotification] =
      useState<Notifications.Notification | null>(null);
    const [error, setError] = useState<Error | null>(null);
  
    const notificationListener = useRef<EventSubscription | null>(null);
    const responseListener = useRef<EventSubscription | null>(null);
  
    useEffect(() => {
      registerForPushNotificationAsync().then(
        (token) => setExpoPushToken(token),
        (error) => setError(error)
      );
  
      notificationListener.current =
        Notifications.addNotificationReceivedListener((notification) => {
          console.log("🔔 Notification Received: ", notification);
          setNotification(notification);
        });
  
      responseListener.current =
        Notifications.addNotificationResponseReceivedListener((response) => {
          console.log(
            "🔔 Notification Response: ",
            JSON.stringify(response, null, 2),
            JSON.stringify(response.notification.request.content.data, null, 2)
          );
          // Handle the notification response here
        });
  
        return () => {
            // Check if the current value exists, then call .remove()
            notificationListener.current?.remove();
            responseListener.current?.remove();
          };
    }, []);

    useEffect(() => {
      const subscription = Notifications.addNotificationReceivedListener(notification => {
        console.log("📩 Notification received:", notification);
      });
    
      const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
        console.log("👉 User tapped notification:", response);
      });
    
      return () => {
        subscription.remove();
        responseListener.remove();
      };
    }, []);
  
    return (
      <NotificationContext.Provider
        value={{ expoPushToken, notification, error }}
      >
        {children}
      </NotificationContext.Provider>
    );
  };

  export async function sendPushNotification(token: string, notiTitle: string, notiBody: string) {
    const message = {
      to: token,
      sound: 'default',
      title: notiTitle,
      body: notiBody,
      // data: { someData: 'goes here' },
    };
  
    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });
  
    const data = await response.json();
    console.log("📨 Expo Response:", data);
  }