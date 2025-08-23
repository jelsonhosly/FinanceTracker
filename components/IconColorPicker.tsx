import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView, Image, Alert } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { X, Check } from 'lucide-react-native';
import { BlurView } from 'expo-blur';
import { Platform } from 'react-native';
import { useState, useEffect, createElement } from 'react';
import * as DocumentPicker from 'expo-document-picker';
import { CustomAlert, AlertButton } from '@/components/CustomAlert';

// Import all Lucide icons used in the ICONS array
import { ShoppingBasket, ShoppingCart, ShoppingBag, Store, Banknote, Gift, UtensilsCrossed, Utensils, Coffee, Pizza, Wine, MapPin, Trash2, PillBottle as Bottle, Beer, Cigarette, Film, Headphones, Palette, Music, Heart, Diamond, Star, Rocket, Globe, Car, Bus, Plane, Ship, Bike, Fuel, Building, Chrome as Home, Key, Wrench, Hammer, Paintbrush, Shirt, Crown, Watch, Glasses, Scissors, Brush, Stethoscope, Pill, Syringe, Thermometer, Bandage, Cross, GraduationCap, Book, BookOpen, Pencil, PenTool, Calculator, Smartphone, Laptop, Monitor, Tv, Camera, Gamepad2, CreditCard, Wallet, Landmark, DollarSign, TrendingUp, TrendingDown, Receipt, Tag, Briefcase, Users, UserCheck, Baby, PawPrint, Gamepad, Dumbbell, Flower, TreePine, Waves, Sun, CloudRain, Zap, Lightbulb, Wifi, Phone, Mail, MessageCircle, Video, Calendar, Clock, Timer, Bell, Volume2, Headphones as HeadphonesIcon, ShieldCheck, Lock, Eye, EyeOff, Settings, PenTool as Tool, Wrench as WrenchIcon, Bitcoin, PiggyBank, Repeat } from 'lucide-react-native';

// Mapping of Lucide icon names to components
export const LucideIconMap: { [key: string]: any } = {
  ShoppingBasket, ShoppingCart, ShoppingBag, Store, Banknote, Gift,
  UtensilsCrossed, Utensils, Coffee, Pizza, Wine, MapPin, Trash2,
  Bottle, Beer, Cigarette, Film, Headphones,
  Palette, Music, Heart, Diamond, Star, Rocket,
  Globe, Car, Bus, Plane, Ship, Bike, Fuel,
  Building, Home, Key, Wrench, Hammer, Paintbrush,
  Shirt, Crown, Watch, Glasses, Scissors, Brush,
  Stethoscope, Pill, Syringe, Thermometer, Bandage, Cross,
  GraduationCap, Book, BookOpen, Pencil, PenTool, Calculator,
  Smartphone, Laptop, Monitor, Tv, Camera, Gamepad2,
  CreditCard, Wallet, Landmark, DollarSign, TrendingUp, TrendingDown,
  Receipt, Tag, Briefcase, Users, UserCheck, Baby, PawPrint,
  Gamepad, Dumbbell, Flower, TreePine, Waves, Sun, CloudRain,
  Zap, Lightbulb, Wifi, Phone, Mail, MessageCircle, Video,
  Calendar, Clock, Timer, Bell, Volume2, HeadphonesIcon,
  ShieldCheck, Lock, Eye, EyeOff, Settings, Tool, WrenchIcon,
  Bitcoin, PiggyBank, Repeat
};

const COLORS = [
  '#FF6B6B', '#FF8E53', '#FF6B35', '#F7931E', '#FFD93D', '#6BCF7F',
  '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8',
  '#F7DC6F', '#BB8FCE', '#85C1E9', '#F8C471', '#82E0AA', '#F1948A',
  '#85929E', '#5DADE2', '#58D68D', '#F4D03F', '#AF7AC5', '#5499C7',
];

const ICONS = [
  // Finance & Money
  'DollarSign', 'CreditCard', 'Wallet', 'Landmark', 'TrendingUp', 'TrendingDown', 'Receipt', 'Banknote', 'Bitcoin', 'PiggyBank',
  // Food & Dining
  'UtensilsCrossed', 'Coffee', 'Pizza', 'Wine', 'Beer', 'ShoppingCart', 'ShoppingBag',
  // Transportation
  'Car', 'Bus', 'Plane', 'Ship', 'Bike', 'Fuel',
  // Home & Living
  'Home', 'Building', 'Key', 'Lightbulb', 'Wifi', 'Phone',
  // Work & Business
  'Briefcase', 'Laptop', 'Calculator', 'Users', 'UserCheck',
  // Health & Medical
  'Stethoscope', 'Pill', 'Cross', 'Dumbbell', 'Heart',
  // Entertainment & Leisure
  'Tv', 'Camera', 'Gamepad2', 'Film', 'Music', 'Headphones',
  // Shopping & Retail
  'Store', 'ShoppingBasket', 'Gift', 'Tag', 'Shirt', 'Watch',
  // Education & Learning
  'GraduationCap', 'Book', 'BookOpen', 'Pencil',
  // Tools & Utilities
  'Wrench', 'Hammer', 'Tool', 'Settings', 'Paintbrush',
  // Nature & Environment
  'TreePine', 'Flower', 'Sun', 'CloudRain', 'Waves',
  // Technology
  'Smartphone', 'Monitor', 'Zap', 'Wifi',
  // Personal & Family
  'Baby', 'PawPrint', 'Crown', 'Glasses',
  // Time & Schedule
  'Calendar', 'Clock', 'Timer', 'Bell',
  // Transfer & Movement
  'Repeat'
];

interface IconColorPickerProps {
  visible: boolean;
  onClose: () => void;
  currentColor: string;
  currentIcon: string; // This can be a Lucide icon name or a URI
  onSave: (color: string, iconNameOrUri: string) => void;
}

export function IconColorPicker({ visible, onClose, currentColor, currentIcon, onSave }: IconColorPickerProps) {
  const { theme } = useTheme();
  const [selectedColor, setSelectedColor] = useState(currentColor);
  const [selectedIcon, setSelectedIcon] = useState(''); // Stores Lucide icon name
  const [customIconUri, setCustomIconUri] = useState<string | null>(null); // Stores custom image URI
  const [showCustomAlert, setShowCustomAlert] = useState(false);
  const [customAlertTitle, setCustomAlertTitle] = useState('');
  const [customAlertMessage, setCustomAlertMessage] = useState('');
  const [customAlertButtons, setCustomAlertButtons] = useState<AlertButton[]>([]);
  const [customAlertType, setCustomAlertType] = useState<'info' | 'warning' | 'error' | 'success'>('info');

  useEffect(() => {
    setSelectedColor(currentColor);
    // Determine if currentIcon is a URI or a Lucide name
    if (currentIcon && (currentIcon.startsWith('http') || currentIcon.startsWith('file') || currentIcon.startsWith('data:'))) {
      setCustomIconUri(currentIcon);
      setSelectedIcon(''); // Clear Lucide selection if custom icon is present
    } else {
      setSelectedIcon(currentIcon || 'Tag'); // Default to 'Tag' if no icon or not a URI
      setCustomIconUri(null); // Clear custom icon if Lucide icon is present
    }
  }, [currentColor, currentIcon]);

  const handleImagePick = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['image/jpeg', 'image/png', 'image/svg+xml'],
        copyToCacheDirectory: false,
      });

      if (result.canceled === false && result.assets && result.assets.length > 0) {
        const uri = result.assets[0].uri;
        setCustomIconUri(uri);
        setSelectedIcon(''); // Clear Lucide icon selection when a custom image is picked
      }
    } catch (err) {
      console.error('Error picking document:', err);
      setCustomAlertTitle('Error');
      setCustomAlertMessage('Failed to pick image.');
      setCustomAlertType('error');
      setCustomAlertButtons([{ text: 'OK' }]);
      setShowCustomAlert(true);
    }
  };

  const handleSave = () => {
    if (customIconUri) {
      onSave(selectedColor, customIconUri);
    } else {
      onSave(selectedColor, selectedIcon);
    }
  };

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <BlurView
          intensity={Platform.OS === 'ios' ? 20 : 15}
          tint={theme.dark ? 'dark' : 'light'}
          style={StyleSheet.absoluteFill}
        />
        <View style={[styles.modalContent, { backgroundColor: theme.colors.card }]}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: theme.colors.text }]}>
              Icon & Color
            </Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <X size={24} color={theme.colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Icon Preview */}
            <View style={styles.previewSection}>
              {customIconUri ? (
                <Image source={{ uri: customIconUri }} style={styles.customIconPreview} resizeMode="contain" />
              ) : (
                <View style={[styles.iconPreview, { backgroundColor: selectedColor }]}>
                  {selectedIcon && LucideIconMap[selectedIcon] ? (
                    createElement(LucideIconMap[selectedIcon], { size: 32, color: 'white' })
                  ) : (
                    <Text style={styles.iconPreviewText}>?</Text>
                  )}
                </View>
              )}
            </View>

            {/* Color Selection */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Color</Text>
              <View style={styles.colorGrid}>
                {COLORS.map((color, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.colorButton,
                      { backgroundColor: color },
                      selectedColor === color && styles.selectedColorButton,
                    ]}
                    onPress={() => setSelectedColor(color)}
                  >
                    {selectedColor === color && (
                      <View style={styles.checkmark}>
                        <Text style={styles.checkmarkText}>✓</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Icon Selection */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Icon</Text>
              <View style={styles.iconGrid}>
                {ICONS.map((iconName, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.iconButton,
                      { backgroundColor: theme.colors.background },
                      selectedIcon === iconName && { backgroundColor: selectedColor + '20' },
                    ]}
                    onPress={() => {
                      setSelectedIcon(iconName);
                      setCustomIconUri(null); // Clear custom icon selection
                    }}
                  >
                    {LucideIconMap[iconName] ? (
                      createElement(LucideIconMap[iconName], {
                        size: 24,
                        color: selectedIcon === iconName ? selectedColor : theme.colors.text,
                      })
                    ) : (
                      <Text style={[
                        styles.iconButtonText,
                        { color: selectedIcon === iconName ? selectedColor : theme.colors.text }
                      ]}>
                        {iconName.charAt(0)}
                      </Text>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
              <TouchableOpacity
                style={[styles.uploadButton, { backgroundColor: theme.colors.background, borderColor: theme.colors.border }]}
                onPress={handleImagePick}
              >
                <Text style={[styles.uploadButtonText, { color: theme.colors.text }]}>Upload Custom Icon</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>

          {/* Save Button */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.saveButton, { backgroundColor: selectedColor }]}
              onPress={handleSave}
            >
              <Text style={styles.saveButtonText}>Save</Text>
            </TouchableOpacity>
          </View>
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
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxHeight: '90%',
    borderRadius: 16,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(150, 150, 150, 0.2)',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    padding: 16,
    maxHeight: 500,
  },
  previewSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  iconPreview: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  customIconPreview: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  iconPreviewText: {
    fontSize: 32,
    fontWeight: '600',
    color: 'white',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  colorButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedColorButton: {
    borderWidth: 3,
    borderColor: 'white',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  checkmark: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmarkText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  iconButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconButtonText: {
    fontSize: 20,
    fontWeight: '500',
  },
  uploadButton: {
    marginTop: 16,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
  },
  uploadButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  footer: {
    padding: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(150, 150, 150, 0.2)',
  },
  saveButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});