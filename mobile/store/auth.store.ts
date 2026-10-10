import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_URL } from "../services/api";

interface RegisterResponse {
  token: string;
  user: User;
}

interface AuthStore {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  register: (
    username: User["username"],
    email: User["email"],
    password: string,
  ) => Promise<{ success: boolean; error?: string } | null>;
  logIn: (
    email: User["email"],
    password: string,
  ) => Promise<{ success: boolean; error?: string } | null>;
  checkAuth: () => Promise<void>;
  logout: () => Promise<void>;
}

const useAuthStore = create<AuthStore>()((set) => ({
  user: null,
  token: null,
  isLoading: false,
  register: async (username, email, password) => {
    set({ isLoading: true });
    try {
      if (!API_URL) {
        throw new Error("EXPO_PUBLIC_API_URL is not configured in mobile/.env");
      }
      const response = await fetch(`${API_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password }),
      });

      if (!response.ok) {
        const error: { message?: string } = await response.json();
        throw new Error(error.message || "Registration failed");
      }

      const data: RegisterResponse = await response.json();
      if (!data || !data.user || !data.token) {
        throw new Error("Invalid response from server");
      }
      await AsyncStorage.setItem("user", JSON.stringify(data.user));
      await AsyncStorage.setItem("token", data.token);

      set({ user: data.user, token: data.token, isLoading: false });
      return { success: true };
    } catch (error) {
      set({ isLoading: false });
      return {
        success: false,
        error: (error as Error).message || "Registration failed",
      };
    }
  },

  checkAuth: async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      const userJson = await AsyncStorage.getItem("user");
      const user = userJson ? JSON.parse(userJson) : null;
      set({ user, token });
    } catch (error) {
      console.log("auth check failed", error);
    }
  },

  logIn: async (email: string, password: string) => {
    try {
      set({ isLoading: true });
      const response = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data: RegisterResponse = await response.json();
      if (!response.ok) {
        throw new Error(
          response instanceof Error ? response.message : "Something went wrong",
        );
      }

      const { user, token } = data;
      await AsyncStorage.setItem("token", token);
      await AsyncStorage.setItem("user", JSON.stringify(user));
      set({ user, token });
      return { success: true };
    } catch (error) {
      console.log("login failed", error);
      return {
        success: false,
        error: (error as Error).message || "Login failed",
      };
    } finally {
      set({ isLoading: false });
    }
  },

  logout: async () => {
    try {
      await AsyncStorage.removeItem("token");
      await AsyncStorage.removeItem("user");
      set({ user: null, token: null });
    } catch (error) {
      console.log("logout failed", error);
    }
  },
}));

export default useAuthStore;
