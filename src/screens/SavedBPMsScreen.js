import React, { useState, useEffect, useCallback } from "react";
import { View, StyleSheet, FlatList, Alert } from "react-native";
import {
  Text,
  Card,
  IconButton,
  useTheme,
  Searchbar,
  FAB,
  Portal,
  Modal,
  Button,
} from "react-native-paper";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";

const SavedBPMsScreen = () => {
  const theme = useTheme();
  const [savedBPMs, setSavedBPMs] = useState([]);
  const [filteredBPMs, setFilteredBPMs] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortModalVisible, setSortModalVisible] = useState(false);
  const [sortBy, setSortBy] = useState("date");
  const [sortOrder, setSortOrder] = useState("desc");

  const loadSavedBPMs = async () => {
    try {
      const saved = await AsyncStorage.getItem("savedBPMs");
      if (saved) {
        const bpmList = JSON.parse(saved);
        setSavedBPMs(bpmList);
        setFilteredBPMs(bpmList);
      }
    } catch (error) {
      console.log("Error loading saved BPMs:", error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadSavedBPMs();
    }, [])
  );

  useEffect(() => {
    let filtered = savedBPMs;
    if (searchQuery) {
      filtered = savedBPMs.filter((item) =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    filtered.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case "name":
          comparison = a.name.localeCompare(b.name);
          break;
        case "bpm":
          comparison = a.bpm - b.bpm;
          break;
        case "date":
        default:
          comparison = new Date(a.date) - new Date(b.date);
          break;
      }
      return sortOrder === "asc" ? comparison : -comparison;
    });

    setFilteredBPMs(filtered);
  }, [savedBPMs, searchQuery, sortBy, sortOrder]);

  const deleteBPM = async (id) => {
    Alert.alert(
      "Delete BPM",
      "Are you sure you want to delete this BPM entry?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const updatedBPMs = savedBPMs.filter((item) => item.id !== id);
              await AsyncStorage.setItem(
                "savedBPMs",
                JSON.stringify(updatedBPMs)
              );
              setSavedBPMs(updatedBPMs);
            } catch (error) {
              console.log("Error deleting BPM:", error);
            }
          },
        },
      ]
    );
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return (
      date.toLocaleDateString() +
      " " +
      date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    );
  };

  const applySorting = (newSortBy, newSortOrder) => {
    setSortBy(newSortBy);
    setSortOrder(newSortOrder);
    setSortModalVisible(false);
  };

  const renderBPMItem = ({ item }) => (
    <Card style={[styles.bpmCard, { backgroundColor: theme.colors.surface }]}>
      <Card.Content>
        <View style={styles.cardHeader}>
          <View style={styles.cardInfo}>
            <Text variant="titleMedium" style={styles.songName}>
              {item.name}
            </Text>
            <Text
              variant="bodySmall"
              style={{ color: theme.colors.onSurfaceVariant }}
            >
              {formatDate(item.date)}
            </Text>
          </View>
          <View style={styles.bpmContainer}>
            <Text
              variant="headlineMedium"
              style={[styles.bpmText, { color: theme.colors.primary }]}
            >
              {item.bpm}
            </Text>
            <Text
              variant="bodySmall"
              style={{ color: theme.colors.onSurfaceVariant }}
            >
              BPM
            </Text>
          </View>
          <IconButton
            icon="delete"
            size={20}
            onPress={() => deleteBPM(item.id)}
            iconColor={theme.colors.error}
          />
        </View>
      </Card.Content>
    </Card>
  );

  const SortOption = ({ title, sortKey, currentSort, currentOrder }) => (
    <View style={styles.sortOption}>
      <Text variant="bodyLarge">{title}</Text>
      <View style={styles.sortButtons}>
        <Button
          mode={
            currentSort === sortKey && currentOrder === "asc"
              ? "contained"
              : "outlined"
          }
          onPress={() => applySorting(sortKey, "asc")}
          compact
        >
          ↑
        </Button>
        <Button
          mode={
            currentSort === sortKey && currentOrder === "desc"
              ? "contained"
              : "outlined"
          }
          onPress={() => applySorting(sortKey, "desc")}
          compact
          style={{ marginLeft: 8 }}
        >
          ↓
        </Button>
      </View>
    </View>
  );

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      {/* Search Bar */}
      <Searchbar
        placeholder="Search songs..."
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={styles.searchBar}
      />

      {/* BPM List */}
      {filteredBPMs.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text
            variant="bodyLarge"
            style={{
              color: theme.colors.onSurfaceVariant,
              textAlign: "center",
            }}
          >
            {searchQuery
              ? "No BPMs found matching your search"
              : "No saved BPMs yet.\nStart tapping to save some BPMs!"}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredBPMs}
          renderItem={renderBPMItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Sort FAB */}
      <FAB
        icon="sort"
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        onPress={() => setSortModalVisible(true)}
      />

      {/* Sort Modal */}
      <Portal>
        <Modal
          visible={sortModalVisible}
          onDismiss={() => setSortModalVisible(false)}
          contentContainerStyle={[
            styles.modalContainer,
            { backgroundColor: theme.colors.surface },
          ]}
        >
          <Text variant="headlineSmall" style={styles.modalTitle}>
            Sort by
          </Text>

          <SortOption
            title="Date Added"
            sortKey="date"
            currentSort={sortBy}
            currentOrder={sortOrder}
          />

          <SortOption
            title="Song Name"
            sortKey="name"
            currentSort={sortBy}
            currentOrder={sortOrder}
          />

          <SortOption
            title="BPM Value"
            sortKey="bpm"
            currentSort={sortBy}
            currentOrder={sortOrder}
          />

          <Button
            mode="outlined"
            onPress={() => setSortModalVisible(false)}
            style={styles.modalCloseButton}
          >
            Close
          </Button>
        </Modal>
      </Portal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchBar: {
    margin: 16,
    marginBottom: 8,
  },
  listContainer: {
    padding: 16,
    paddingTop: 8,
  },
  bpmCard: {
    marginBottom: 12,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cardInfo: {
    flex: 1,
  },
  songName: {
    fontWeight: "bold",
    marginBottom: 4,
  },
  bpmContainer: {
    alignItems: "center",
    marginRight: 8,
  },
  bpmText: {
    fontWeight: "bold",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  fab: {
    position: "absolute",
    margin: 16,
    right: 0,
    bottom: 0,
  },
  modalContainer: {
    margin: 20,
    padding: 20,
    borderRadius: 12,
  },
  modalTitle: {
    marginBottom: 20,
    textAlign: "center",
  },
  sortOption: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sortButtons: {
    flexDirection: "row",
  },
  modalCloseButton: {
    marginTop: 16,
  },
});

export default SavedBPMsScreen;
