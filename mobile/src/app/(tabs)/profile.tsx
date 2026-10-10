import { useCallback, useEffect, useState } from "react";
import {
  View,
  Alert,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useRouter } from "expo-router";
import { Image } from "expo-image";
import Loader from "../../components/Loader";
import useAuthStore from "../../../store/auth.store";
import { API_URL } from "../../../services/api";
import styles from "@/assets/styles/profile.styles";
import COLORS from "../../../constants/colors";
import Ionicons from "@react-native-vector-icons/ionicons";
import { sleep } from "@/lib/utils";
import ProfileHeader from "@/components/ProfileHeader";
import LogoutButton from "@/components/LogoutButton";

export default function Profile() {
  const [books, setBooks] = useState<Book[] | []>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [deleteBookId, setDeleteBookId] = useState("");

  const { token } = useAuthStore();

  const router = useRouter();

  const fetchData = async () => {
    try {
      const response = await fetch(`${API_URL}/books/user`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const responseText = await response.text();
      let data;
      try {
        data = JSON.parse(responseText);
      } catch {
        console.error("Profile API returned non-JSON:", {
          url: response.url,
          status: response.status,
          contentType: response.headers.get("content-type"),
        });
        throw new Error(
          `Profile API returned a non-JSON response (HTTP ${response.status})`,
        );
      }
      if (!response.ok)
        throw new Error(data.message || "Failed to fetch user books");

      if (!Array.isArray(data)) {
        throw new Error("Profile API returned an invalid books list");
      }

      setBooks(data);
    } catch (error) {
      console.error("Error fetching data:", error);
      Alert.alert(
        "Error",
        error instanceof Error
          ? error.message
          : "Failed to load profile data. Pull down to refresh.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // State updates follow the asynchronous network request.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData();
  }, []);

  const handleDeleteBook = async (bookId: string) => {
    try {
      setDeleteBookId(bookId);

      const response = await fetch(`${API_URL}/books/${bookId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const responseText = await response.text();
      let data;
      try {
        data = JSON.parse(responseText);
      } catch {
        console.error("Profile API returned non-JSON:", {
          url: response.url,
          status: response.status,
          contentType: response.headers.get("content-type"),
        });
        throw new Error(
          `Profile API returned a non-JSON response (HTTP ${response.status})`,
        );
      }
      if (!response.ok) throw new Error(data.message || "Failed to delet book");

      setBooks(books.filter((book) => book._id !== bookId));
      Alert.alert("Success", "Recommendation deleted successfully");
    } catch (error) {
      Alert.alert(
        "Error",
        (error as Error).message || "Failed to delete recommendation",
      );
    } finally {
      setDeleteBookId("");
    }
  };

  const confirmDelete = (bookId: string) => {
    Alert.alert(
      "Delete Recommendation",
      "Are you sure you want to delete this recommendation?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => handleDeleteBook(bookId),
        },
      ],
    );
  };

  const renderBookItem = ({ item }: { item: Book }) => (
    <View style={styles.bookItem}>
      <Image source={item.image} style={styles.bookImage} />
      <View style={styles.bookInfo}>
        <Text style={styles.bookTitle}>{item.title}</Text>
        <View style={styles.ratingContainer}>
          {renderRatingStars(item.rating)}
        </View>
        <Text style={styles.bookCaption} numberOfLines={2}>
          {item.caption}
        </Text>
        <Text style={styles.bookDate}>
          {new Date(item.createdAt).toLocaleDateString()}
        </Text>
      </View>

      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => confirmDelete(item._id)}
      >
        {deleteBookId === item._id ? (
          <ActivityIndicator size="small" color={COLORS.primary} />
        ) : (
          <Ionicons name="trash-outline" size={20} color={COLORS.primary} />
        )}
      </TouchableOpacity>
    </View>
  );

  const renderRatingStars = (rating: number) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Ionicons
          key={i}
          name={i <= rating ? "star" : "star-outline"}
          size={14}
          color={i <= rating ? "#f4b400" : COLORS.textSecondary}
          style={{ marginRight: 2 }}
        />,
      );
    }
    return stars;
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await sleep(500);
    await fetchData();
    setRefreshing(false);
  };

  if (isLoading && !refreshing) return <Loader />;

  return (
    <View style={styles.container}>
      <ProfileHeader />
      <LogoutButton />

      {/* YOUR RECOMMENDATIONS */}
      <View style={styles.booksHeader}>
        <Text style={styles.booksTitle}>Your Recommendations 📚</Text>
        <Text style={styles.booksCount}>{books.length} books</Text>
      </View>

      <FlatList
        data={books}
        renderItem={renderBookItem}
        keyExtractor={(item) => item._id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.booksList}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons
              name="book-outline"
              size={50}
              color={COLORS.textSecondary}
            />
            <Text style={styles.emptyText}>No recommendations yet</Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => router.push("/create")}
            >
              <Text style={styles.addButtonText}>Add Your First Book</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </View>
  );
}
