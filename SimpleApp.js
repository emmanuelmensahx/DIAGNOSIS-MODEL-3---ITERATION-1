// SimpleApp.js - Simplified version without React Navigation for testing CDN externals
const { useState } = window.React;
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';

const SimpleApp = () => {
  const [count, setCount] = useState(0);
  const [message, setMessage] = useState('Welcome to AfriDiag!');

  const handlePress = () => {
    setCount(count + 1);
    setMessage(`Button pressed ${count + 1} times!`);
  };

  const resetCounter = () => {
    setCount(0);
    setMessage('Counter reset!');
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>AfriDiag - Simple Test</Text>
        <Text style={styles.subtitle}>Testing React Native Web with CDN Externals</Text>
      </View>
      
      <View style={styles.content}>
        <Text style={styles.message}>{message}</Text>
        
        <View style={styles.counterSection}>
          <Text style={styles.counterLabel}>Counter: {count}</Text>
          
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.button} onPress={handlePress}>
              <Text style={styles.buttonText}>Increment</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={[styles.button, styles.resetButton]} onPress={resetCounter}>
              <Text style={styles.buttonText}>Reset</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>React Native Web Components Test:</Text>
          <Text style={styles.infoText}>✅ View component</Text>
          <Text style={styles.infoText}>✅ Text component</Text>
          <Text style={styles.infoText}>✅ TouchableOpacity component</Text>
          <Text style={styles.infoText}>✅ ScrollView component</Text>
          <Text style={styles.infoText}>✅ StyleSheet API</Text>
          <Text style={styles.infoText}>✅ useState Hook</Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#2196F3',
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: '#E3F2FD',
  },
  content: {
    padding: 20,
  },
  message: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 30,
    color: '#333',
    fontWeight: '500',
  },
  counterSection: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  counterLabel: {
    fontSize: 20,
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
    fontWeight: 'bold',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  button: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 100,
  },
  resetButton: {
    backgroundColor: '#FF5722',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  infoSection: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  infoText: {
    fontSize: 16,
    marginBottom: 8,
    color: '#4CAF50',
  },
});

export default SimpleApp;