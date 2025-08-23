import { View, Text, StyleSheet, TouchableOpacity, Modal, TextInput, ScrollView, Alert, Image, Switch } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { useData } from '@/context/DataContext';
import { BlurView } from 'expo-blur';
import { Platform } from 'react-native';
import { useState, useEffect, createElement } from 'react';
import { Category, Subcategory } from '@/types';
import { IconColorPicker } from '@/components/IconColorPicker';
import { SubcategoryEditor } from '@/components/SubcategoryEditor';
import { X, Plus, Trash2, CreditCard as Edit3, ChevronRight, Palette, Type, Tag as TagIcon, CircleArrowUp as ArrowUpCircle, CircleArrowDown as ArrowDownCircle } from 'lucide-react-native';
import { CustomAlert, AlertButton } from '@/components/CustomAlert';

// Mapping of Lucide icon names to components
import { 
  Coffee, Car, Chrome as Home, Zap, Tv, HeartPulse, Book, ShoppingCart, Plane, Briefcase, Gift, Laptop, TrendingUp, Heart, Tag, UtensilsCrossed, ShoppingBag, ShoppingBasket, Store, Banknote, Pizza, Wine, MapPin, Trash2 as TrashIcon, PillBottle as Bottle, Beer, Cigarette, Film, Headphones, Palette as PaletteIcon, Music, Diamond, Star, Rocket, Globe, Bus, Ship, Bike, Fuel, Building, Key, Wrench, Hammer, Paintbrush, Shirt, Crown, Watch, Glasses, Scissors, Brush, Stethoscope, Pill, Syringe, Thermometer, Bandage, Cross, GraduationCap, BookOpen, Pencil, PenTool, Calculator, Smartphone, Monitor, Gamepad2, CreditCard, Wallet, Landmark, DollarSign, Receipt, Users, UserCheck, Baby, PawPrint, Gamepad, Dumbbell, Flower, TreePine, Waves, Sun, CloudRain, Lightbulb, Wifi, Phone, Mail, MessageCircle, Video, Calendar, Clock, Timer, Bell, Volume2, ShieldCheck, Lock, Eye, EyeOff, Settings, PenTool as Tool, MoveHorizontal
} from 'lucide-react-native';

const LucideIconMap: { [key: string]: any } = {
  Coffee, Car, Home, Zap, Tv, HeartPulse, Book, ShoppingCart, Plane, Briefcase, Gift, Laptop, TrendingUp, Heart, Tag, UtensilsCrossed, ShoppingBag,
  ShoppingBasket, Store, Banknote, Pizza, Wine, MapPin, TrashIcon,
  Bottle, Beer, Cigarette, Film, Headphones,
  PaletteIcon, Music, Diamond, Star, Rocket,
  Globe, Bus, Ship, Bike, Fuel,
  Building, Key, Wrench, Hammer, Paintbrush,
  Shirt, Crown, Watch, Glasses, Scissors, Brush,
  Stethoscope, Pill, Syringe, Thermometer, Bandage, Cross,
  GraduationCap, BookOpen, Pencil, PenTool, Calculator,
  Smartphone, Monitor, Gamepad2, CreditCard, Wallet, Landmark, DollarSign,
  Receipt, Users, UserCheck, Baby, PawPrint, Gamepad, Dumbbell, Flower, TreePine, Waves, Sun, CloudRain,
  Lightbulb, Wifi, Phone, Mail, MessageCircle, Video, Calendar, Clock, Timer, Bell, Volume2,
  ShieldCheck, Lock, Eye, EyeOff, Settings, Tool, MoveHorizontal
};

interface CategoryEditorProps {
  visible: boolean;
  onClose: () => void;
  categoryId: string | null;
}

export function CategoryEditor({ visible, onClose, categoryId }: CategoryEditorProps) {
  const { theme } = useTheme();
  const { categories, addCategory, updateCategory } = useData();

  const [name, setName] = useState('');
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [color, setColor] = useState('#FF6B6B');
  const [lucideIconName, setLucideIconName] = useState<string>('Tag');
  const [customIcon, setCustomIcon] = useState<string | null>(null);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [showSubcategoryEditor, setShowSubcategoryEditor] = useState(false);
  const [editingSubcategory, setEditingSubcategory] = useState<Subcategory | null>(null);
  const [isAdvancedMode, setIsAdvancedMode] = useState(false);
  const [showCustomAlert, setShowCustomAlert] = useState(false);
  const [customAlertTitle, setCustomAlertTitle] = useState('');
  const [customAlertMessage, setCustomAlertMessage] = useState('');
  const [customAlertButtons, setCustomAlertButtons] = useState<AlertButton[]>([]);
  const [customAlertType, setCustomAlertType] = useState<'info' | 'warning' | 'error' | 'success'>('info');

  const isEditing = !!categoryId;

  useEffect(() => {
    if (categoryId) {
      const category = categories.find(c => c.id === categoryId);
      if (category) {
        setName(category.name);
        setType(category.type);
        setColor(category.color);
        setLucideIconName(category.lucideIconName || 'Tag');
        setCustomIcon(category.icon || null);
        setSubcategories(category.subcategories || []);
        setIsAdvancedMode((category.subcategories || []).length > 0);
      }
    } else {
      setName('');
      setType('expense');
      setColor('#FF6B6B');
      setLucideIconName('Tag');
      setCustomIcon(null);
      setSubcategories([]);
      setIsAdvancedMode(false);
    }
  }, [categoryId, categories]);

  const handleSave = () => {
    if (!name.trim()) {
      setCustomAlertTitle('Error');
      setCustomAlertMessage('Please enter a category name');
      setCustomAlertType('error');
      setCustomAlertButtons([{ text: 'OK' }]);
      setShowCustomAlert(true);
      return;
    }

    const categoryData: Omit<Category, 'id'> = {
      name: name.trim(),
      type,
      color,
      lucideIconName: customIcon ? undefined : lucideIconName,
      icon: customIcon || undefined,
      subcategories: isAdvancedMode ? subcategories : undefined,
    };

    if (categoryId) {
      updateCategory({ id: categoryId, ...categoryData });
    } else {
      addCategory(categoryData);
    }

    onClose();
  };

  const handleAddSubcategory = () => {
    setEditingSubcategory(null);
    setShowSubcategoryEditor(true);
  };

  const handleEditSubcategory = (subcategory: Subcategory) => {
    setEditingSubcategory(subcategory);
    setShowSubcategoryEditor(true);
  };

  const handleDeleteSubcategory = (subcategoryId: string) => {
    setCustomAlertTitle('Delete Subcategory');
    setCustomAlertMessage('Are you sure you want to delete this subcategory?');
    setCustomAlertType('warning');
    setCustomAlertButtons([
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => setSubcategories(subcategories.filter(sub => sub.id !== subcategoryId))
      }
    ]);
    setShowCustomAlert(true);
  };

  const handleSaveSubcategory = (subcategory: Omit<Subcategory, 'id'>) => {
    if (editingSubcategory) {
      setSubcategories(subcategories.map(sub =>
        sub.id === editingSubcategory.id
          ? { ...subcategory, id: editingSubcategory.id }
          : sub
      ));
    } else {
      const newSubcategory: Subcategory = {
        ...subcategory,
        id: Math.random().toString(),
      };
      setSubcategories([...subcategories, newSubcategory]);
    }
    setShowSubcategoryEditor(false);
    setEditingSubcategory(null);
  };

  const renderCategoryIconPreview = () => {
    if (customIcon) {
      return (
        <Image
          key={customIcon}
          source={{ uri: customIcon }}
          style={styles.iconPreviewImage}
          resizeMode="contain"
        />
      );
    }
    if (lucideIconName && LucideIconMap[lucideIconName]) {
      const IconComponent = LucideIconMap[lucideIconName];
      return createElement(IconComponent, { size: 40, color: 'white' });
    }
    return (
      <Text style={styles.iconPreviewText}>
        {name.charAt(0).toUpperCase() || '?'}
      </Text>
    );
  };

  const renderSubcategoryIcon = (subcategory: Subcategory) => {
    if (subcategory.icon) {
      return (
        <Image
          key={subcategory.icon}
          source={{ uri: subcategory.icon }}
          style={styles.subcategoryIconImage}
          resizeMode="contain"
        />
      );
    }
    if (subcategory.lucideIconName && LucideIconMap[subcategory.lucideIconName]) {
      const IconComponent = LucideIconMap[subcategory.lucideIconName];
      return createElement(IconComponent, { size: 16, color: 'white' });
    }
    return (
      <Text style={styles.subcategoryIconText}>
        {subcategory.name.charAt(0).toUpperCase()}
      </Text>
    );
  };

  return (
    <Modal
      transparent
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <BlurView
          intensity={Platform.OS === 'ios' ? 20 : 15}
          tint={theme.dark ? 'dark' : 'light'}
          style={StyleSheet.absoluteFill}
        />
        <View style={[styles.modalContent, { backgroundColor: theme.colors.background }]}>
          {/* Header */}
          <View style={[styles.header, { backgroundColor: theme.colors.card }]}>
            <View style={styles.headerContent}>
              <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                <X size={24} color={theme.colors.text} />
              </TouchableOpacity>
              <Text style={[styles.title, { color: theme.colors.text }]}>
                {isEditing ? 'Edit Category' : 'New Category'}
              </Text>
              <TouchableOpacity
                style={[styles.saveButton, { backgroundColor: theme.colors.primary }]}
                onPress={handleSave}
              >
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Category Preview */}
            <View style={[styles.previewCard, { backgroundColor: theme.colors.card }]}>
              <View style={[styles.categoryPreview, { backgroundColor: color }]}>
                {renderCategoryIconPreview()}
              </View>
              <View style={styles.previewInfo}>
                <Text style={[styles.previewName, { color: theme.colors.text }]}>
                  {name || 'Category Name'}
                </Text>
                <View style={styles.previewBadge}>
                  {type === 'income' ? (
                    <ArrowDownCircle size={14} color={theme.colors.success} />
                  ) : (
                    <ArrowUpCircle size={14} color={theme.colors.error} />
                  )}
                  <Text style={[
                    styles.previewType,
                    { color: type === 'income' ? theme.colors.success : theme.colors.error }
                  ]}>
                    {type === 'income' ? 'Income' : 'Expense'}
                  </Text>
                </View>
              </View>
            </View>

            {/* Basic Settings */}
            <View style={[styles.section, { backgroundColor: theme.colors.card }]}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Basic Information</Text>
              
              {/* Name Input */}
              <View style={styles.inputGroup}>
                <View style={styles.inputHeader}>
                  <Type size={16} color={theme.colors.textSecondary} />
                  <Text style={[styles.inputLabel, { color: theme.colors.textSecondary }]}>Name</Text>
                </View>
                <TextInput
                  style={[styles.input, { 
                    backgroundColor: theme.colors.background,
                    color: theme.colors.text,
                    borderColor: theme.colors.border 
                  }]}
                  value={name}
                  onChangeText={setName}
                  placeholder="Enter category name"
                  placeholderTextColor={theme.colors.textSecondary}
                />
              </View>

              {/* Type Selector */}
              <View style={styles.inputGroup}>
                <View style={styles.inputHeader}>
                  <TagIcon size={16} color={theme.colors.textSecondary} />
                  <Text style={[styles.inputLabel, { color: theme.colors.textSecondary }]}>Type</Text>
                </View>
                <View style={styles.typeSelector}>
                  <TouchableOpacity
                    style={[
                      styles.typeOption,
                      { backgroundColor: theme.colors.background },
                      type === 'income' && { backgroundColor: theme.colors.success + '20', borderColor: theme.colors.success }
                    ]}
                    onPress={() => setType('income')}
                  >
                    <ArrowDownCircle size={20} color={type === 'income' ? theme.colors.success : theme.colors.textSecondary} />
                    <Text style={[
                      styles.typeOptionText,
                      { color: type === 'income' ? theme.colors.success : theme.colors.text }
                    ]}>
                      Income
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.typeOption,
                      { backgroundColor: theme.colors.background },
                      type === 'expense' && { backgroundColor: theme.colors.error + '20', borderColor: theme.colors.error }
                    ]}
                    onPress={() => setType('expense')}
                  >
                    <ArrowUpCircle size={20} color={type === 'expense' ? theme.colors.error : theme.colors.textSecondary} />
                    <Text style={[
                      styles.typeOptionText,
                      { color: type === 'expense' ? theme.colors.error : theme.colors.text }
                    ]}>
                      Expense
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Icon & Color */}
              <TouchableOpacity
                style={[styles.iconColorButton, { backgroundColor: theme.colors.background }]}
                onPress={() => setShowIconPicker(true)}
              >
                <View style={styles.inputHeader}>
                  <Palette size={16} color={theme.colors.textSecondary} />
                  <Text style={[styles.inputLabel, { color: theme.colors.textSecondary }]}>Icon & Color</Text>
                </View>
                <View style={styles.iconColorPreview}>
                  <View style={[styles.colorPreview, { backgroundColor: color }]} />
                  <Text style={[styles.iconColorText, { color: theme.colors.text }]}>
                    {customIcon ? 'Custom Icon' : lucideIconName}
                  </Text>
                  <ChevronRight size={16} color={theme.colors.textSecondary} />
                </View>
              </TouchableOpacity>
            </View>

            {/* Advanced Settings */}
            <View style={[styles.section, { backgroundColor: theme.colors.card }]}>
              <View style={styles.advancedHeader}>
                <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Advanced</Text>
                <Switch
                  value={isAdvancedMode}
                  onValueChange={setIsAdvancedMode}
                  trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
                  thumbColor={isAdvancedMode ? 'white' : theme.colors.textSecondary}
                />
              </View>
              
              {isAdvancedMode && (
                <View style={styles.subcategoriesSection}>
                  <View style={styles.subcategoriesHeader}>
                    <Text style={[styles.subcategoriesTitle, { color: theme.colors.textSecondary }]}>
                      Subcategories ({subcategories.length})
                    </Text>
                    <TouchableOpacity
                      style={[styles.addSubcategoryButton, { backgroundColor: theme.colors.primary + '15' }]}
                      onPress={handleAddSubcategory}
                    >
                      <Plus size={16} color={theme.colors.primary} />
                      <Text style={[styles.addSubcategoryText, { color: theme.colors.primary }]}>
                        Add Subcategory
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {subcategories.length > 0 ? (
                    <View style={styles.subcategoriesList}>
                      {subcategories.map((subcategory) => (
                        <View key={subcategory.id} style={[styles.subcategoryCard, { backgroundColor: theme.colors.background }]}>
                          <View style={styles.subcategoryMain}>
                            <View style={[styles.subcategoryIcon, { backgroundColor: subcategory.color }]}>
                              {renderSubcategoryIcon(subcategory)}
                            </View>
                            <Text style={[styles.subcategoryName, { color: theme.colors.text }]}>
                              {subcategory.name}
                            </Text>
                          </View>
                          <View style={styles.subcategoryActions}>
                            <TouchableOpacity
                              style={[styles.subcategoryActionButton, { backgroundColor: theme.colors.primary + '15' }]}
                              onPress={() => handleEditSubcategory(subcategory)}
                            >
                              <Edit3 size={12} color={theme.colors.primary} />
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={[styles.subcategoryActionButton, { backgroundColor: theme.colors.error + '15' }]}
                              onPress={() => handleDeleteSubcategory(subcategory.id)}
                            >
                              <Trash2 size={12} color={theme.colors.error} />
                            </TouchableOpacity>
                          </View>
                        </View>
                      ))}
                    </View>
                  ) : (
                    <View style={styles.emptySubcategories}>
                      <Text style={[styles.emptySubcategoriesText, { color: theme.colors.textSecondary }]}>
                        No subcategories yet. Add one to organize your transactions better.
                      </Text>
                    </View>
                  )}
                </View>
              )}
            </View>

            <View style={styles.bottomSpacer} />
          </ScrollView>
        </View>
      </View>

      {/* Modals */}
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
              setLucideIconName('Tag');
            } else {
              setLucideIconName(iconNameOrUri);
              setCustomIcon(null);
            }
            setShowIconPicker(false);
          }}
        />
      )}

      {showSubcategoryEditor && (
        <SubcategoryEditor
          visible={showSubcategoryEditor}
          onClose={() => {
            setShowSubcategoryEditor(false);
            setEditingSubcategory(null);
          }}
          subcategory={editingSubcategory}
          onSave={handleSaveSubcategory}
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
    justifyContent: 'flex-end',
  },
  modalContent: {
    height: '90%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  header: {
    paddingTop: 8,
    paddingBottom: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(150, 150, 150, 0.2)',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
  },
  saveButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  previewCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  categoryPreview: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  iconPreviewImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  iconPreviewText: {
    fontSize: 28,
    fontWeight: '700',
    color: 'white',
  },
  previewInfo: {
    flex: 1,
  },
  previewName: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  previewBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  previewType: {
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  section: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  input: {
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    borderWidth: 1,
  },
  typeSelector: {
    flexDirection: 'row',
    gap: 12,
  },
  typeOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'transparent',
    gap: 8,
  },
  typeOptionText: {
    fontSize: 16,
    fontWeight: '600',
  },
  iconColorButton: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(150, 150, 150, 0.2)',
  },
  iconColorPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 8,
  },
  colorPreview: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  iconColorText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
  },
  advancedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  subcategoriesSection: {
    marginTop: 8,
  },
  subcategoriesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  subcategoriesTitle: {
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  addSubcategoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    gap: 6,
  },
  addSubcategoryText: {
    fontSize: 14,
    fontWeight: '600',
  },
  subcategoriesList: {
    gap: 12,
  },
  subcategoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 16,
  },
  subcategoryMain: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  subcategoryIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  subcategoryIconImage: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  subcategoryIconText: {
    fontSize: 14,
    fontWeight: '700',
    color: 'white',
  },
  subcategoryName: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  subcategoryActions: {
    flexDirection: 'row',
    gap: 8,
  },
  subcategoryActionButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptySubcategories: {
    padding: 24,
    alignItems: 'center',
  },
  emptySubcategoriesText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  bottomSpacer: {
    height: 40,
  },
});