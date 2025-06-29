import React, { useState, useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import {
  Provider as PaperProvider,
  MD3LightTheme,
  MD3DarkTheme,
} from "react-native-paper";
import { useColorScheme } from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import AsyncStorage from "@react-native-async-storage/async-storage";

import BPMCounterScreen from "./src/screens/BPMCounterScreen";
import SavedBPMsScreen from "./src/screens/SavedBPMsScreen";

const Tab = createBottomTabNavigator();

const App = () => {
  const systemColorScheme = useColorScheme();
  const [isDarkMode, setIsDarkMode] = useState(systemColorScheme === "dark");

  useEffect(() => {
    const loadThemePreference = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem("theme");
        if (savedTheme !== null) {
          setIsDarkMode(savedTheme === "dark");
        }
      } catch (error) {
        console.log("Error loading theme preference:", error);
      }
    };
    loadThemePreference();
  }, []);

  const theme = isDarkMode ? MD3DarkTheme : MD3LightTheme;

  const toggleTheme = async () => {
    const newTheme = !isDarkMode;
    setIsDarkMode(newTheme);
    try {
      await AsyncStorage.setItem("theme", newTheme ? "dark" : "light");
    } catch (error) {
      console.log("Error saving theme preference:", error);
    }
  };

  return (
    <PaperProvider theme={theme}>
      <NavigationContainer>
        <Tab.Navigator
          screenOptions={({ route }) => ({
            tabBarIcon: ({ focused, color, size }) => {
              let iconName;
              if (route.name === "Counter") {
                iconName = focused ? "metronome" : "metronome-tick";
              } else if (route.name === "Saved") {
                iconName = focused ? "music-note" : "music-note-outline";
              }
              return <Icon name={iconName} size={size} color={color} />;
            },
            tabBarActiveTintColor: theme.colors.primary,
            tabBarInactiveTintColor: theme.colors.onSurfaceVariant,
            tabBarStyle: {
              backgroundColor: theme.colors.surface,
            },
            headerStyle: {
              backgroundColor: theme.colors.surface,
            },
            headerTintColor: theme.colors.onSurface,
          })}
        >
          <Tab.Screen name="Counter" options={{ title: "BPM Counter" }}>
            {(props) => (
              <BPMCounterScreen
                {...props}
                toggleTheme={toggleTheme}
                isDarkMode={isDarkMode}
              />
            )}
          </Tab.Screen>
          <Tab.Screen
            name="Saved"
            component={SavedBPMsScreen}
            options={{ title: "Saved BPMs" }}
          />
        </Tab.Navigator>
      </NavigationContainer>
    </PaperProvider>
  );
};

export default App;
