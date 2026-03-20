import { db } from "@/FirebaseConfig";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  arrayRemove,
  doc,
  getDoc,
  updateDoc,
} from "firebase/firestore";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  FlatList,
  Image,
  Modal,
  SafeAreaView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { Toast } from "react-native-toast-message/lib/src/Toast";
import LoadingComponent from "@/components/LoadingComponent";

const dummyAvatar =
  "https://img.freepik.com/premium-vector/person-with-blue-shirt-that-says-name-person_1029948-7040.jpg";

// ✅ Custom Modal — same as Landing Page
interface CustomModalProps {
  visible: boolean;
  type: "success" | "error" | "info" | "warning";
  title: string;
  message: string;
  buttons: Array<{ text: string; onPress: () => void; style?: "default" | "cancel" | "destructive" }>;
  onClose?: () => void;
}

const CustomModal: React.FC<CustomModalProps> = ({
  visible, type, title, message, buttons, onClose,
}) => {
  const scaleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }).start();
    } else {
      scaleAnim.setValue(0);
    }
  }, [visible, scaleAnim]);

  const getModalStyle = () => {
    switch (type) {
      case "success":
        return { iconName: "checkmark-circle" as const, iconColor: "#22C55E", iconBg: "bg-green-100" };
      case "error":
        return { iconName: "close-circle" as const, iconColor: "#EF4444", iconBg: "bg-red-100" };
      case "warning":
        return { iconName: "warning" as const, iconColor: "#F59E0B", iconBg: "bg-yellow-100" };
      default:
        return { iconName: "information-circle" as const, iconColor: "#3B82F6", iconBg: "bg-blue-100" };
    }
  };

  const modalStyle = getModalStyle();
  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/50 items-center justify-center px-6">
        <Animated.View
          style={{ transform: [{ scale: scaleAnim }] }}
          className="bg-white rounded-3xl p-6 items-center w-full max-w-sm shadow-2xl"
        >
          {/* Icon */}
          <View className={`w-16 h-16 ${modalStyle.iconBg} rounded-full items-center justify-center mb-4`}>
            <Ionicons name={modalStyle.iconName} size={32} color={modalStyle.iconColor} />
          </View>

          {/* Title */}
          <Text className="text-xl font-bold text-gray-900 text-center mb-2">{title}</Text>

          {/* Message */}
          <Text className="text-sm text-gray-600 text-center mb-6 leading-5">{message}</Text>

          {/* Buttons */}
          {buttons.length === 1 ? (
            <TouchableOpacity
              className={`py-4 px-8 rounded-xl items-center w-full shadow-lg ${
                buttons[0].style === "cancel"
                  ? "bg-gray-200"
                  : buttons[0].style === "destructive"
                  ? "bg-red-500"
                  : "bg-black"
              }`}
              onPress={buttons[0].onPress}
              activeOpacity={0.8}
            >
              <Text
                className={`text-lg font-semibold ${
                  buttons[0].style === "cancel" ? "text-gray-700" : "text-white"
                }`}
              >
                {buttons[0].text}
              </Text>
            </TouchableOpacity>
          ) : (
            <View className="flex-row w-full" style={{ gap: 12 }}>
              {buttons.map((button, index) => (
                <TouchableOpacity
                  key={index}
                  className={`flex-1 py-4 px-6 rounded-xl items-center shadow-lg ${
                    button.style === "cancel"
                      ? "bg-gray-200"
                      : button.style === "destructive"
                      ? "bg-red-500"
                      : "bg-black"
                  }`}
                  onPress={button.onPress}
                  activeOpacity={0.8}
                >
                  <Text
                    className={`text-lg font-semibold ${
                      button.style === "cancel" ? "text-gray-700" : "text-white"
                    }`}
                  >
                    {button.text}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </Animated.View>
      </View>
    </Modal>
  );
};

export default function BlockedUsersScreen() {
  const router = useRouter();
  const [blockedUsers, setBlockedUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // ✅ Custom modal state — same pattern as Landing page
  const [modalConfig, setModalConfig] = useState<{
    visible: boolean;
    type: "success" | "error" | "info" | "warning";
    title: string;
    message: string;
    buttons: Array<{ text: string; onPress: () => void; style?: "default" | "cancel" | "destructive" }>;
  }>({
    visible: false,
    type: "info",
    title: "",
    message: "",
    buttons: [],
  });

  const showModal = (
    type: "success" | "error" | "info" | "warning",
    title: string,
    message: string,
    buttons: Array<{ text: string; onPress: () => void; style?: "default" | "cancel" | "destructive" }>
  ) => {
    setModalConfig({ visible: true, type, title, message, buttons });
  };

  const hideModal = () => {
    setModalConfig((prev) => ({ ...prev, visible: false }));
  };

  useEffect(() => {
    fetchBlockedUsers();
  }, []);

  const fetchBlockedUsers = async () => {
    try {
      const userId = await AsyncStorage.getItem("userId");
      setCurrentUserId(userId);

      const docRef = doc(db, "UserBlocked", userId!);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        setBlockedUsers([]);
        return;
      }

      const blockedList: any[] = docSnap.data()?.blockedList || [];

      if (blockedList.length === 0) {
        setBlockedUsers([]);
        return;
      }

      // ✅ AuthorName is directly stored in each blocked entry
      const enriched = blockedList.map((entry, index) => ({
        ...entry,
        _key: entry.postauthoruserid || `blocked-${index}`,
        name: entry.AuthorName || "Unknown User",
        avatar: entry.AuthorImageURL || entry.authorAvatar || null,
        email: entry.AuthorEmail || null,
      }));

      setBlockedUsers(enriched);
    } catch (error) {
      console.error("Error fetching blocked users:", error);
      Toast.show({
        type: "error",
        text1: "Failed to Load",
        text2: "Could not load blocked users. Please try again.",
        position: "bottom",
        visibilityTime: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUnblock = (item: any) => {
    // ✅ Custom modal instead of native Alert
    showModal(
      "warning",
      "Unblock User",
      `Are you sure you want to unblock ${item.name}? They will be able to see your posts and interact with you again.`,
      [
        {
          text: "Cancel",
          style: "cancel",
          onPress: hideModal,
        },
        {
          text: "Unblock",
          style: "destructive",
          onPress: async () => {
            hideModal();
            try {
              const docRef = doc(db, "UserBlocked", currentUserId!);
              await updateDoc(docRef, {
                blockedList: arrayRemove({
                  AuthorName: item.AuthorName,
                  AuthorEmail: item.AuthorEmail,
                  postauthoruserid: item.postauthoruserid,
                  blockedat: item.blockedat,
                }),
              });

              setBlockedUsers((prev) =>
                prev.filter((u) => u.postauthoruserid !== item.postauthoruserid)
              );

              // ✅ Toast on success
              Toast.show({
                type: "success",
                text1: "User Unblocked",
                text2: `${item.name} has been unblocked successfully.`,
                position: "bottom",
                visibilityTime: 3000,
              });
            } catch (error) {
              console.error("Unblock failed:", error);
              Toast.show({
                type: "error",
                text1: "Unblock Failed",
                text2: "Something went wrong. Please try again.",
                position: "bottom",
                visibilityTime: 3000,
              });
            }
          },
        },
      ]
    );
  };

  const renderItem = ({ item }: { item: any }) => (
    <View
      className="flex-row items-center bg-white mx-4 mb-3 p-4 rounded-2xl"
      style={{
        shadowColor: "#000",
        shadowOpacity: 0.06,
        shadowRadius: 6,
        elevation: 2,
      }}
    >
      {/* Avatar */}
      <Image
        source={{ uri: item.avatar || dummyAvatar }}
        className="w-12 h-12 rounded-full mr-3"
        resizeMode="cover"
      />

      {/* Name & Info */}
      <View className="flex-1">
        <Text className="text-gray-900 font-semibold text-base" numberOfLines={1}>
          {item.name}
        </Text>
        {item.email ? (
          <Text className="text-gray-400 text-xs" numberOfLines={1}>
            {item.email}
          </Text>
        ) : null}
        <Text className="text-gray-400 text-xs mt-0.5">
          Blocked on{" "}
          {item.blockedat?.toDate
            ? item.blockedat.toDate().toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })
            : ""}
        </Text>
      </View>

      {/* Unblock Button */}
      <TouchableOpacity
        onPress={() => handleUnblock(item)}
        className="bg-red-50 border border-red-200 px-4 py-2 rounded-full"
      >
        <Text className="text-red-500 font-semibold text-sm">Unblock</Text>
      </TouchableOpacity>
    </View>
  );
  const goBack = useCallback(() => router.back(), [router]);
  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <StatusBar barStyle="dark-content" backgroundColor="#F9FAFB" />

      {/* Header */}
      <View className="flex-row items-center px-4 py-4 pt-16 bg-white border-b border-gray-100">
        <TouchableOpacity
          onPress={goBack}
          className="w-9 h-9 rounded-full bg-gray-100 items-center justify-center mr-3"
        >
          <Ionicons name="arrow-back" size={20} color="#111827" />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-gray-900 flex-1">
          Blocked Users
        </Text>
        {blockedUsers.length > 0 && (
          <View className="bg-purple-100 px-3 py-1 rounded-full">
            <Text className="text-purple-600 font-semibold text-xs">
              {blockedUsers.length}{" "}
              {blockedUsers.length === 1 ? "user" : "users"}
            </Text>
          </View>
        )}
      </View>

      {/* ✅ LoadingComponent — same as Landing Page */}
      {loading ? (
        <View className="flex-1 items-center justify-center">
          <LoadingComponent visible={true} size="large" />
        </View>
      ) : blockedUsers.length === 0 ? (
        <View className="flex-1 items-center justify-center px-8">
          <View className="w-20 h-20 bg-gray-100 rounded-full items-center justify-center mb-4">
            <Ionicons name="ban-outline" size={40} color="#D1D5DB" />
          </View>
          <Text className="text-gray-700 text-lg font-semibold">
            No Blocked Users
          </Text>
          <Text className="text-gray-400 text-sm text-center mt-1">
            Users you block will appear here
          </Text>
        </View>
      ) : (
        <FlatList
          data={blockedUsers}
          keyExtractor={(item) => item._key}
          renderItem={renderItem}
          contentContainerStyle={{ paddingTop: 16, paddingBottom: 40 }}
        />
      )}

      {/* ✅ Custom Modal — same as Landing Page */}
      <CustomModal
        visible={modalConfig.visible}
        type={modalConfig.type}
        title={modalConfig.title}
        message={modalConfig.message}
        buttons={modalConfig.buttons}
        onClose={hideModal}
      />
    </SafeAreaView>
  );
}
