import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

export async function registerForPushNotificationAsync() {
    if (Platform.OS === "android") {
        await Notifications.setNotificationChannelAsync("default", {
            name: "default",
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: "#FF231F7C",
        });
    }

    if (Device.isDevice){
        console.log('Correct Device');
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        if (existingStatus !== "granted") {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }

        console.log('finalStatus: ', finalStatus);

        if (finalStatus !== "granted") {
            throw new Error("Permission not granted to get push notification!");
        }

        // const projectId = 
        //     Constants?.expoConfig?.extra?.eas?.projectId ?? 
        //     Constants?.easConfig?.projectId; //7929b56b-fdaf-4894-9b78-3e25f380baee
        const projectId = "7929b56b-fdaf-4894-9b78-3e25f380baee"; 
        if (!projectId) {
            throw new Error("Project Id not found");
        }

        console.log('projectId: ', projectId);

        try {
            const pushTokenString = (
                await Notifications.getExpoPushTokenAsync({
                    projectId,
                })
            ).data;
            console.log('PushTokenString: ',pushTokenString);
            
            // ✅ Android channel setup
            if (Platform.OS === 'android') {
                await Notifications.setNotificationChannelAsync('default', {
                    name: 'default',
                    importance: Notifications.AndroidImportance.MAX,
                });
            }

            return pushTokenString;
        } catch (error) {
            console.log('PushTokenString Error: ', error);
            throw new Error("PushTokenString Error", error);
        }
    } else {
        throw new Error("Must use physical device for push notifications");
    }
}