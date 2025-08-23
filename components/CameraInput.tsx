import { View, StyleSheet, TouchableOpacity, Modal, Platform } from 'react-native';
import { CameraView, CameraType } from 'expo-camera';
import { useState, useRef } from 'react';
import { X, Camera as CameraRotate, Camera as CameraIcon } from 'lucide-react-native';
import { useTheme } from '@/context/ThemeContext';
import * as ImageManipulator from 'expo-image-manipulator';
import * as Haptics from 'expo-haptics';

interface CameraInputProps {
  onClose: () => void;
  onCapture: (uri: string) => void;
}

export function CameraInput({ onClose, onCapture }: CameraInputProps) {
  const { theme } = useTheme();
  const [type, setType] = useState<CameraType>('back');
  const cameraRef = useRef<any>(null);

  const toggleCameraType = () => {
    setType(current => (current === 'back' ? 'front' : 'back'));
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const takePhoto = async () => {
    if (cameraRef.current) {
      try {
        if (Platform.OS !== 'web') {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        }

        const photo = await cameraRef.current.takePictureAsync();
        
        // Resize the image to reduce storage size
        const manipResult = await ImageManipulator.manipulateAsync(
          photo.uri,
          [{ resize: { width: 800 } }],
          { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
        );
        
        onCapture(manipResult.uri);
      } catch (error) {
        console.error('Error taking photo:', error);
      }
    }
  };

  return (
    <Modal
      animationType="slide"
      transparent={false}
      visible={true}
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <CameraView
          ref={cameraRef}
          style={styles.camera}
          facing={type}
          ratio="16:9"
        >
          <View style={styles.controlsContainer}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={onClose}
            >
              <X size={24} color="white" />
            </TouchableOpacity>

            <View style={styles.bottomControls}>
              <TouchableOpacity
                style={styles.flipButton}
                onPress={toggleCameraType}
              >
                <CameraRotate size={24} color="white" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.captureButton}
                onPress={takePhoto}
              >
                <CameraIcon size={32} color="white" />
              </TouchableOpacity>

              <View style={styles.placeholder} />
            </View>
          </View>
        </CameraView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  camera: {
    flex: 1,
  },
  controlsContainer: {
    flex: 1,
    backgroundColor: 'transparent',
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  closeButton: {
    position: 'absolute',
    top: 40,
    left: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomControls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginBottom: 30,
    paddingHorizontal: 20,
  },
  flipButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderWidth: 4,
    borderColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholder: {
    width: 60,
  },
});