import { View, Text, StyleSheet, TouchableOpacity, Modal, TextInput, Image } from 'react-native';
import { createElement } from 'react';
import { useTheme } from '@/context/ThemeContext';
import { X } from 'lucide-react-native';
import { BlurView } from 'expo-blur';
import { Platform } from 'react-native';
import { useState, useEffect } from 'react';
import { Subcategory } from '@/types';
import { IconColorPicker } from '@/components/IconColorPicker';
import { CustomAlert, AlertButton } from '@/components/CustomAlert';

// Mapping of Lucide icon names to components (copy from IconColorPicker.tsx)
import { Coffee, Car, Chrome as Home, Zap, Tv, HeartPulse, Book, ShoppingCart, Plane, Briefcase, Gift, Laptop, TrendingUp, Heart, Tag, UtensilsCrossed, ShoppingBag, ShoppingBasket, Store, Banknote, Pizza, Wine, MapPin, Trash2, PillBottle as Bottle, Beer, Cigarette, Film, Headphones, Palette, Music, Diamond, Star, Rocket, Globe, Bus, Ship, Bike, Fuel, Building, Key, Wrench, Hammer, Paintbrush, Shirt, Crown, Watch, Glasses, Scissors, Brush, Stethoscope, Pill, Syringe, Thermometer, Bandage, Cross, GraduationCap, BookOpen, Pencil, PenTool, Calculator, Smartphone, Monitor, Gamepad2, CreditCard, Wallet, Landmark, DollarSign, Receipt, Users, UserCheck, Baby, PawPrint, Gamepad, Dumbbell, Flower, TreePine, Waves, Sun, CloudRain, Lightbulb, Wifi, Phone, Mail, MessageCircle, Video, Calendar, Clock, Timer, Bell, Volume2, ShieldCheck, Lock, Eye, EyeOff, Settings, PenTool as Tool } from 'lucide-react-native';

const LucideIconMap: { [key: string]: any } = {
  Coffee, Car, Home, Zap, Tv, HeartPulse, Book, ShoppingCart, Plane, Briefcase, Gift, Laptop, TrendingUp, Heart, Tag, UtensilsCrossed, ShoppingBag,
  ShoppingBasket, Store, Banknote, Pizza, Wine, MapPin, Trash2,
  Bottle, Beer, Cigarette, Film, Headphones,
  Palette, Music, Diamond, Star, Rocket,
  Globe, Bus, Ship, Bike, Fuel,
  Building, Key, Wrench, Hammer, Paintbrush,
  Shirt, Crown, Watch, Glasses, Scissors, Brush,
  Stethoscope, Pill, Syringe, Thermometer, Bandage, Cross,
  GraduationCap, BookOpen, Pencil, PenTool, Calculator,
  Smartphone, Monitor, Gamepad2, CreditCard, Wallet, Landmark, DollarSign,
  Receipt, Users, UserCheck, Baby, PawPrint, Gamepad, Dumbbell, Flower, TreePine, Waves, Sun, CloudRain,
  Lightbulb, Wifi, Phone, Mail, MessageCircle, Video, Calendar, Clock, Timer, Bell, Volume2,
  ShieldCheck, Lock, Eye, EyeOff, Settings, Tool
};

interface SubcategoryEditorProps {
  visible: boolean;
  onClose: () => void;
  subcategory: Subcategory | null;
  onSave: (subcategory: Omit<Subcategory, 'id'>) => void;
}

export function SubcategoryEditor({ visible, onClose, subcategory, onSave }: SubcategoryEditorProps) {
  const { theme } = useTheme();

  const [name, setName] = useState('');
  const [color, setColor] = useState('#FF6B6B');
  const [lucideIconName, setLucideIconName] = useState('Tag');
  const [customIcon, setCustomIcon] = useState<string | null>(null);
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [showCustomAlert, setShowCustomAlert] = useState(false);
  const [customAlertTitle, setCustomAlertTitle] = useState('');
  const [customAlertMessage, setCustomAlertMessage] = useState('');
  const [customAlertButtons, setCustomAlertButtons] = useState<AlertButton[]>([]);
  const [customAlertType, setCustomAlertType] = useState<'info' | 'warning' | 'error' | 'success'>('info');

  useEffect(() => {
    if (subcategory) {
      setName(subcategory.name);
      setColor(subcategory.color);
      setLucideIconName(subcategory.lucideIconName || 'Tag');
      setCustomIcon(subcategory.icon || null);
    } else {
      setName('');
      setColor('#FF6B6B');
      setLucideIconName('Tag');
      setCustomIcon(null);
    }
  }, [subcategory]);

  const handleSave = () => {
    if (!name.trim()) {
      setCustomAlertTitle('Error');
      setCustomAlertMessage('Please enter a subcategory name');
      setCustomAlertType('error');
      setCustomAlertButtons([{ text: 'OK' }]);
      setShowCustomAlert(true);
      return;
    }

    onSave({
      name: name.trim(),
      color,
      lucideIconName: customIcon ? undefined : lucideIconName,
      icon: customIcon || undefined,
    });
  };

  const renderSubcategoryIconPreview = () => {
    if (customIcon) {
      return (
        <Image
          key={customIcon}
          source={{ uri: customIcon }}
          style={styles.customIconPreview}
          resizeMode="contain"
        />
      );
    }
    if (lucideIconName && LucideIconMap[lucideIconName]) {
      const IconComponent = LucideIconMap[lucideIconName];
      return createElement(IconComponent, { size: 24, color: 'white' });
    }
    return (
      <Text style={styles.iconPlaceholder}>
        {name.charAt(0).toUpperCase() || '?'}
      </Text>
    );
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
              {subcategory ? 'Edit Subcategory' : 'New Subcategory'}
            </Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <X size={24} color={theme.colors.text} />
            </TouchableOpacity>
          </View>

          <View style={styles.form}>
            {/* Icon Preview */}
            <View style={styles.iconSection}>
              <TouchableOpacity
                style={[styles.subcategoryIcon, { backgroundColor: color }]}
                onPress={() => setShowIconPicker(true)}
              >
                {renderSubcategoryIconPreview()}
              </TouchableOpacity>
            </View>

            {/* Name Input */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Name</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.colors.background,
                    color: theme.colors.text,
                    borderColor: theme.colors.border,
                  },
                ]}
                value={name}
                onChangeText={setName}
                placeholder="Subcategory name"
                placeholderTextColor={theme.colors.textSecondary}
              />
            </View>
          </View>

          {/* Save Button */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.saveButton, { backgroundColor: theme.colors.primary }]}
              onPress={handleSave}
            >
              <Text style={styles.saveButtonText}>
                {subcategory ? 'Save Changes' : 'Add Subcategory'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Icon & Color Picker Modal */}
      {showIconPicker && (
        <IconColorPicker
          visible={showIconPicker}
          onClose={() => setShowIconPicker(false)}
          currentColor={color}
          currentIcon={customIcon || lucideIconName}
          onSave={(selectedColor, iconNameOrUri) => {
            setColor(selectedColor);
            if (iconNameOrUri.startsWith('http') || iconNameOrUri.startsWith('file') || iconNameOrUri.startsWith('data:')) {
              setCustomIcon(iconNameOrUri);
              setLucideIconName('Tag'); // Reset Lucide icon if custom is selected
            } else {
              setLucideIconName(iconNameOrUri);
              setCustomIcon(null); // Reset custom icon if Lucide is selected
            }
            setShowIconPicker(false);
          }}
        />
      )}

      {/* Custom Alert */}
      <CustomAlert
        visible={showCustomAlert}
        title={customAlertTitle}
        message={customAlertMessage}
        buttons={customAlertButtons}
        type={customAlertType}
        onClose={() => setShowCustomAlert(false)}
      />
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
    maxWidth: 400,
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
  form: {
    padding: 16,
  },
  iconSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  subcategoryIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconPlaceholder: {
    fontSize: 24,
    fontWeight: '600',
    color: 'white',
  },
  customIconPreview: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    marginBottom: 8,
    fontWeight: '500',
  },
  input: {
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    borderWidth: 1,
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