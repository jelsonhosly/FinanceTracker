import { View, Text, StyleSheet, TouchableOpacity, Alert, Image } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { Camera, FileImage, FileText, X } from 'lucide-react-native';
import * as DocumentPicker from 'expo-document-picker';
import { useState } from 'react';
import { CustomAlert, AlertButton } from '@/components/CustomAlert';

interface DocumentPickerProps {
  onDocumentPicked: (uri: string, type: 'image' | 'pdf') => void;
  currentDocument?: { uri: string; type: 'image' | 'pdf' } | null;
  onRemoveDocument?: () => void;
  onTakePhoto?: () => void;
}

export function DocumentPickerComponent({
  onDocumentPicked,
  currentDocument,
  onRemoveDocument,
  onTakePhoto
}: DocumentPickerProps) {
  const { theme } = useTheme();
  const [isLoading, setIsLoading] = useState(false);
  const [showCustomAlert, setShowCustomAlert] = useState(false);
  const [customAlertTitle, setCustomAlertTitle] = useState('');
  const [customAlertMessage, setCustomAlertMessage] = useState('');
  const [customAlertButtons, setCustomAlertButtons] = useState<AlertButton[]>([]);
  const [customAlertType, setCustomAlertType] = useState<'info' | 'warning' | 'error' | 'success'>('info');

  const pickDocument = async () => {
    try {
      setIsLoading(true);
      const result = await DocumentPicker.getDocumentAsync({
        type: ['image/*', 'application/pdf'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const documentType = asset.mimeType?.startsWith('image/') ? 'image' : 'pdf';
        onDocumentPicked(asset.uri, documentType);
      }
    } catch (error) {
      console.error('Error picking document:', error);
      setCustomAlertTitle('Error');
      setCustomAlertMessage('Failed to pick document. Please try again.');
      setCustomAlertType('error');
      setCustomAlertButtons([{ text: 'OK' }]);
      setShowCustomAlert(true);
    } finally {
      setIsLoading(false);
    }
  };

  const renderDocumentPreview = () => {
    if (!currentDocument) return null;

    return (
      <View style={[styles.documentPreview, { backgroundColor: theme.colors.background }]}>
        <View style={styles.documentContent}>
          {currentDocument.type === 'image' ? (
            <Image 
              source={{ uri: currentDocument.uri }} 
              style={styles.imagePreview}
              resizeMode="cover"
            />
          ) : (
            <View style={[styles.pdfPreview, { backgroundColor: theme.colors.error + '20' }]}>
              <FileText size={32} color={theme.colors.error} />
              <Text style={[styles.pdfText, { color: theme.colors.text }]}>PDF Document</Text>
            </View>
          )}
        </View>
        
        <View style={styles.documentActions}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: theme.colors.primary + '15' }]}
            onPress={pickDocument}
            disabled={isLoading}
          >
            <FileImage size={16} color={theme.colors.primary} />
          </TouchableOpacity>
          
          {onTakePhoto && (
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: theme.colors.secondary + '15' }]}
              onPress={onTakePhoto}
            >
              <Camera size={16} color={theme.colors.secondary} />
            </TouchableOpacity>
          )}
          
          {onRemoveDocument && (
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: theme.colors.error + '15' }]}
              onPress={onRemoveDocument}
            >
              <X size={16} color={theme.colors.error} />
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  if (currentDocument) {
    return renderDocumentPreview();
  }

  return (
    <>
      <View style={styles.container}>
      <TouchableOpacity
        style={[styles.pickButton, { 
          backgroundColor: theme.colors.background,
          borderColor: theme.colors.border
        }]}
        onPress={pickDocument}
        disabled={isLoading}
      >
        <FileImage size={20} color={theme.colors.primary} />
        <Text style={[styles.pickButtonText, { color: theme.colors.text }]}>
          {isLoading ? 'Loading...' : 'Add Image or PDF'}
        </Text>
      </TouchableOpacity>

      {onTakePhoto && (
        <TouchableOpacity
          style={[styles.cameraButton, { 
            backgroundColor: theme.colors.background,
            borderColor: theme.colors.border
          }]}
          onPress={onTakePhoto}
        >
          <Camera size={20} color={theme.colors.secondary} />
          <Text style={[styles.cameraButtonText, { color: theme.colors.text }]}>
            Take Photo
          </Text>
        </TouchableOpacity>
      )}
      </View>

      {/* Custom Alert */}
      <CustomAlert
        visible={showCustomAlert}
        title={customAlertTitle}
        message={customAlertMessage}
        buttons={customAlertButtons}
        type={customAlertType}
        onClose={() => setShowCustomAlert(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  pickButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
    borderWidth: 1,
  },
  pickButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  cameraButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
    borderWidth: 1,
  },
  cameraButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  documentPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: 'rgba(150, 150, 150, 0.2)',
  },
  documentContent: {
    flex: 1,
    marginRight: 12,
  },
  imagePreview: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  pdfPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    gap: 12,
  },
  pdfText: {
    fontSize: 14,
    fontWeight: '500',
  },
  documentActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
});