import React, {useState, useRef} from 'react';
import {View, StyleSheet, Dimensions, TouchableOpacity} from 'react-native';
import {
  Text,
  Button,
  Card,
  IconButton,
  TextInput,
  Portal,
  Modal,
  useTheme,
} from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';

const {width, height} = Dimensions.get('window');

const BPMCounterScreen = ({toggleTheme, isDarkMode}) => {
  const theme = useTheme();
  const [bpm, setBpm] = useState(0);
  const [taps, setTaps] = useState([]);
  const [visible, setVisible] = useState(false);
  const [songName, setSongName] = useState('');
  const tapTimesRef = useRef([]);

  const handleTap = () => {
    const currentTime = Date.now();
    tapTimesRef.current.push(currentTime);

    
    if (tapTimesRef.current.length > 20) {
      tapTimesRef.current.shift();
    }

    
    if (tapTimesRef.current.length >= 2) {
      const tapCount = tapTimesRef.current.length;
      let calculatedBpm;

      if (tapCount <= 4) {
        
        const recentIntervals = [];
        for (let i = Math.max(1, tapCount - 3); i < tapCount; i++) {
          recentIntervals.push(tapTimesRef.current[i] - tapTimesRef.current[i - 1]);
        }
        const avgInterval = recentIntervals.reduce((sum, interval) => sum + interval, 0) / recentIntervals.length;
        calculatedBpm = Math.round(60000 / avgInterval);
      } else {
        
        const intervals = [];
        const weights = [];
        
        
        for (let i = 1; i < tapCount; i++) {
          const interval = tapTimesRef.current[i] - tapTimesRef.current[i - 1];
          intervals.push(interval);
          
          
          const position = i - 1; 
          const weight = Math.pow(1.2, position); 
          weights.push(weight);
        }
        
        
        let weightedSum = 0;
        let totalWeight = 0;
        
        for (let i = 0; i < intervals.length; i++) {
          
          const sortedIntervals = [...intervals].sort((a, b) => a - b);
          const median = sortedIntervals[Math.floor(sortedIntervals.length / 2)];
          
          if (Math.abs(intervals[i] - median) < median * 0.5) {
            weightedSum += intervals[i] * weights[i];
            totalWeight += weights[i];
          }
        }
        
        if (totalWeight > 0) {
          const weightedAvgInterval = weightedSum / totalWeight;
          calculatedBpm = Math.round(60000 / weightedAvgInterval);
        } else {
          
          const avgInterval = intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length;
          calculatedBpm = Math.round(60000 / avgInterval);
        }
      }
      
      
      if (bpm > 0 && tapCount > 5) {
        
        const smoothingFactor = 0.3; 
        calculatedBpm = Math.round(bpm * (1 - smoothingFactor) + calculatedBpm * smoothingFactor);
      }
      
      setBpm(calculatedBpm);
    }

    setTaps(tapTimesRef.current.length);
  };

  const resetCounter = () => {
    setBpm(0);
    setTaps([]);
    tapTimesRef.current = [];
  };

  const saveBPM = async () => {
    if (bpm > 0 && songName.trim()) {
      try {
        const savedBPMs = await AsyncStorage.getItem('savedBPMs');
        const bpmList = savedBPMs ? JSON.parse(savedBPMs) : [];
        
        const newEntry = {
          id: Date.now().toString(),
          name: songName.trim(),
          bpm: bpm,
          date: new Date().toISOString(),
        };
        
        bpmList.push(newEntry);
        await AsyncStorage.setItem('savedBPMs', JSON.stringify(bpmList));
        
        setSongName('');
        setVisible(false);
        
        
      } catch (error) {
        console.log('Error saving BPM:', error);
      }
    }
  };

  const showSaveModal = () => {
    if (bpm > 0) {
      setVisible(true);
    }
  };

  return (
    <View style={[styles.container, {backgroundColor: theme.colors.background}]}>
      {/* Theme toggle button */}
      <View style={styles.headerActions}>
        <IconButton
          icon={isDarkMode ? 'weather-sunny' : 'weather-night'}
          size={24}
          onPress={toggleTheme}
        />
      </View>

      {/* BPM Display */}
      <Card style={[styles.bpmCard, {backgroundColor: theme.colors.surfaceVariant}]}>
        <Card.Content style={styles.bpmContent}>
          <Text variant="headlineLarge" style={[styles.bpmLabel, {color: theme.colors.onSurfaceVariant}]}>
            BPM
          </Text>
          <Text variant="displayLarge" style={[styles.bpmValue, {color: theme.colors.primary}]}>
            {bpm || '---'}
          </Text>
          {taps > 0 && (
            <Text variant="bodyMedium" style={{color: theme.colors.onSurfaceVariant}}>
              {taps} tap{taps !== 1 ? 's' : ''}
            </Text>
          )}
        </Card.Content>
      </Card>

      {/* Tap Button */}
      <View style={styles.tapButtonContainer}>
        <TouchableOpacity
          onPress={handleTap}
          style={[styles.tapButton, {backgroundColor: theme.colors.primary}]}
          activeOpacity={0.8}
        >
          <Text style={[styles.tapButtonLabel, {color: theme.colors.onPrimary}]}>
            TAP
          </Text>
        </TouchableOpacity>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <Button
          mode="outlined"
          onPress={resetCounter}
          style={styles.actionButton}
          disabled={taps === 0}
        >
          Reset
        </Button>
        <Button
          mode="contained"
          onPress={showSaveModal}
          style={styles.actionButton}
          disabled={bpm === 0}
        >
          Save BPM
        </Button>
      </View>

      {/* Save Modal */}
      <Portal>
        <Modal
          visible={visible}
          onDismiss={() => setVisible(false)}
          contentContainerStyle={[
            styles.modalContainer,
            {backgroundColor: theme.colors.surface}
          ]}>
          <Text variant="headlineSmall" style={{marginBottom: 16}}>
            Save BPM: {bpm}
          </Text>
          <TextInput
            label="Song/Track Name"
            value={songName}
            onChangeText={setSongName}
            mode="outlined"
            style={styles.textInput}
          />
          <View style={styles.modalButtons}>
            <Button
              mode="outlined"
              onPress={() => setVisible(false)}
              style={styles.modalButton}
            >
              Cancel
            </Button>
            <Button
              mode="contained"
              onPress={saveBPM}
              style={styles.modalButton}
              disabled={!songName.trim()}
            >
              Save
            </Button>
          </View>
        </Modal>
      </Portal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  headerActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 20,
  },
  bpmCard: {
    marginBottom: 40,
    elevation: 4,
  },
  bpmContent: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  bpmLabel: {
    marginBottom: 10,
  },
  bpmValue: {
    fontWeight: 'bold',
    marginBottom: 10,
  },
  tapButtonContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  tapButton: {
    width: width * 0.6,
    height: width * 0.6,
    borderRadius: width * 0.3,
    elevation: 8,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
  },
  tapButtonLabel: {
    fontSize: 36,
    fontWeight: 'bold',
    textAlign: 'center',
    textAlignVertical: 'center',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 10,
  },
  modalContainer: {
    margin: 20,
    padding: 20,
    borderRadius: 12,
  },
  textInput: {
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  modalButton: {
    marginLeft: 10,
  },
});

export default BPMCounterScreen;
