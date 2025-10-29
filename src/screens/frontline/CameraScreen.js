import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Image,
} from 'react-native';
import { Camera } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { uploadImages, makePrediction } from '../../services/diagnosisService';
import { useOffline } from '../../context/OfflineContext';

export default function CameraScreen({ navigation, route }) {
  const [hasPermission, setHasPermission] = useState(null);
  const [type, setType] = useState(Camera.Constants.Type.back);
  const [capturedImage, setCapturedImage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const cameraRef = useRef(null);
  const { patientId, diagnosisType } = route.params || {};
  const { isOffline } = useOffline();

  React.useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  const takePicture = async () => {
    if (cameraRef.current) {
      try {
        setIsLoading(true);
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.8,
          base64: false,
        });
        setCapturedImage(photo.uri);
      } catch (error) {
        Alert.alert('Error', 'Failed to take picture');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled) {
        setCapturedImage(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const retakePhoto = () => {
    setCapturedImage(null);
  };

  const usePhoto = async () => {
    if (capturedImage) {
      try {
        setIsLoading(true);
        
        let imageData = {
          uri: capturedImage,
          uploaded: false,
          imageIds: []
        };

        // Try to upload image to backend if online
        if (!isOffline) {
          try {
            console.log('Uploading image to backend...');
            const imageIds = await uploadImages([capturedImage]);
            imageData = {
              ...imageData,
              uploaded: true,
              imageIds: imageIds
            };
            
            // Show success message for upload
            Alert.alert(
              'Image Uploaded', 
              'Image has been successfully uploaded and is ready for AI analysis.',
              [{ text: 'Continue', onPress: () => navigateToNextScreen(imageData) }]
            );
            return;
          } catch (uploadError) {
            console.error('Failed to upload image:', uploadError);
            Alert.alert(
              'Upload Failed',
              'Failed to upload image to server. The image will be saved locally and uploaded when connection is restored.',
              [{ text: 'Continue Offline', onPress: () => navigateToNextScreen(imageData) }]
            );
            return;
          }
        } else {
          // Offline mode - save locally
          Alert.alert(
            'Offline Mode',
            'Image saved locally. It will be uploaded and processed when internet connection is restored.',
            [{ text: 'Continue', onPress: () => navigateToNextScreen(imageData) }]
          );
          return;
        }
      } catch (error) {
        console.error('Error processing image:', error);
        Alert.alert('Error', 'Failed to process image. Please try again.');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const navigateToNextScreen = (imageData) => {
    // Navigate back with the image data
    navigation.navigate('DiagnosisScreen', {
      patientId,
      imageUri: imageData.uri,
      imageIds: imageData.imageIds,
      imageUploaded: imageData.uploaded,
      diagnosisType,
    });
  };

  if (hasPermission === null) {
    return (
      <View style={styles.container}>
        <Text>Requesting camera permission...</Text>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>No access to camera</Text>
        <TouchableOpacity style={styles.button} onPress={pickImage}>
          <Text style={styles.buttonText}>Choose from Gallery</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (capturedImage) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Review Image</Text>
        <Image source={{ uri: capturedImage }} style={styles.previewImage} />
        
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.secondaryButton} onPress={retakePhoto}>
            <MaterialCommunityIcons name="camera-retake" size={24} color="#1E88E5" />
            <Text style={styles.secondaryButtonText}>Retake</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.primaryButton, isLoading && styles.disabledButton]} 
            onPress={usePhoto}
            disabled={isLoading}
          >
            <MaterialCommunityIcons name="check" size={24} color="#FFFFFF" />
            <Text style={styles.primaryButtonText}>
              {isLoading ? 'Processing...' : 'Use Photo'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Camera style={styles.camera} type={type} ref={cameraRef}>
        <View style={styles.cameraOverlay}>
          <Text style={styles.instructionText}>
            Position the {diagnosisType || 'medical'} image in the frame
          </Text>
          
          <View style={styles.cameraControls}>
            <TouchableOpacity style={styles.galleryButton} onPress={pickImage}>
              <MaterialCommunityIcons name="image" size={30} color="#FFFFFF" />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.captureButton, isLoading && styles.disabledButton]} 
              onPress={takePicture}
              disabled={isLoading}
            >
              <MaterialCommunityIcons name="camera" size={40} color="#FFFFFF" />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.flipButton} 
              onPress={() => {
                setType(
                  type === Camera.Constants.Type.back
                    ? Camera.Constants.Type.front
                    : Camera.Constants.Type.back
                );
              }}
            >
              <MaterialCommunityIcons name="camera-flip" size={30} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>
      </Camera>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  camera: {
    flex: 1,
  },
  cameraOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'space-between',
    padding: 20,
  },
  instructionText: {
    color: '#FFFFFF',
    fontSize: 18,
    textAlign: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 15,
    borderRadius: 10,
    marginTop: 50,
  },
  cameraControls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingBottom: 50,
  },
  captureButton: {
    backgroundColor: '#1E88E5',
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#FFFFFF',
  },
  galleryButton: {
    backgroundColor: 'rgba(255,255,255,0.3)',
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  flipButton: {
    backgroundColor: 'rgba(255,255,255,0.3)',
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginTop: 50,
    marginBottom: 20,
  },
  previewImage: {
    flex: 1,
    margin: 20,
    borderRadius: 10,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 20,
    paddingBottom: 50,
  },
  primaryButton: {
    backgroundColor: '#1E88E5',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 10,
    minWidth: 120,
    justifyContent: 'center',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#1E88E5',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 10,
    minWidth: 120,
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  secondaryButtonText: {
    color: '#1E88E5',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  disabledButton: {
    backgroundColor: '#CCCCCC',
  },
  errorText: {
    color: '#E53E3E',
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#1E88E5',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    margin: 20,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
