import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, Image } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { useData } from '@/context/DataContext';
import { X, Check, Coffee, Car, Chrome as Home, Zap, Tv, HeartPulse, Book, ShoppingCart, Plane, MoveHorizontal as MoreHorizontal, Briefcase, Gift, Laptop, TrendingUp, Heart, Tag, UtensilsCrossed, ShoppingBag } from 'lucide-react-native';
import { Category, Subcategory } from '@/types';
import { BlurView } from 'expo-blur';
import { Platform } from 'react-native';
import { useState, useEffect } from 'react';

// Mapping of Lucide icon names to components
const LucideIconMap: { [key: string]: any } = {
  Coffee,
  Car,
  Home,
  Zap,
  Tv,
  HeartPulse,
  Book,
  ShoppingCart,
  ShoppingBag,
  Plane,
  MoreHorizontal,
  Briefcase,
  Gift,
  Laptop,
  TrendingUp,
  Heart,
  Tag,
  UtensilsCrossed,
};

interface CategoryFilterProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (categoryNames: string[]) => void;
  selectedCategories: string[];
}

export function CategoryFilter({ visible, onClose, onSelect, selectedCategories }: CategoryFilterProps) {
  const { theme } = useTheme();
  const { categories } = useData();
  const [localSelectedCategories, setLocalSelectedCategories] = useState<string[]>(selectedCategories);

  useEffect(() => {
    if (visible) {
      setLocalSelectedCategories(selectedCategories);
    }
  }, [visible, selectedCategories]);
  
  const renderCategoryIcon = (item: Category | Subcategory) => {
    // First check for custom image icon
    if (item.icon) {
      return (
        <Image 
          source={{ uri: item.icon }} 
          style={styles.customIcon}
          resizeMode="contain"
        />
      );
    }
    
    // Then check for Lucide icon
    if (item.lucideIconName && LucideIconMap[item.lucideIconName]) {
      const IconComponent = LucideIconMap[item.lucideIconName];
      return <IconComponent size={20} color="white" />;
    }
    
    // Fallback to first letter
    return (
      <Text style={styles.iconFallback}>
        {item.name.charAt(0).toUpperCase()}
      </Text>
    );
  };

  // Create a flat list of all categories and subcategories
  const allCategoryOptions = [
    ...categories.map(category => ({ ...category, type: 'category' as const })),
    ...categories.flatMap(category => 
      (category.subcategories || []).map(subcategory => ({
        ...subcategory,
        type: 'subcategory' as const,
        parentCategory: category.name
      }))
    )
  ];

  const toggleCategory = (categoryName: string) => {
    setLocalSelectedCategories(prev => 
      prev.includes(categoryName) 
        ? prev.filter(name => name !== categoryName)
        : [...prev, categoryName]
    );
  };

  const handleClearAll = () => {
    setLocalSelectedCategories([]);
  };

  const handleApply = () => {
    onSelect(localSelectedCategories);
    onClose();
  };
  
  const renderCategoryOption = ({ item }: { item: any }) => {
    const isSelected = localSelectedCategories.includes(item.name);
    
    return (
      <TouchableOpacity
        style={[
          styles.categoryItem, 
          { 
            backgroundColor: theme.colors.background,
            borderColor: isSelected ? theme.colors.primary : theme.colors.border 
          }
        ]}
        onPress={() => toggleCategory(item.name)}
      >
        <View style={styles.categoryContent}>
          <View style={[styles.iconContainer, { backgroundColor: item.color }]}>
            {renderCategoryIcon(item)}
          </View>
          
          <View style={styles.categoryInfo}>
            <Text style={[styles.categoryName, { color: theme.colors.text }]}>
              {item.name}
            </Text>
            {item.type === 'subcategory' && (
              <Text style={[styles.parentCategory, { color: theme.colors.textSecondary }]}>
                {item.parentCategory}
              </Text>
            )}
            {item.type === 'category' && (
              <Text style={[styles.categoryType, { color: theme.colors.textSecondary }]}>
                {item.type === 'income' ? 'Income' : 'Expense'} Category
              </Text>
            )}
          </View>
        </View>
        
        <View style={[
          styles.checkbox,
          { 
            backgroundColor: isSelected ? theme.colors.primary : 'transparent',
            borderColor: isSelected ? theme.colors.primary : theme.colors.border 
          }
        ]}>
          {isSelected && <Check size={16} color="white" />}
        </View>
      </TouchableOpacity>
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
            <Text style={[styles.title, { color: theme.colors.text }]}>Filter by Categories</Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <X size={24} color={theme.colors.text} />
            </TouchableOpacity>
          </View>

          <View style={styles.headerActions}>
            <TouchableOpacity
              style={[styles.clearAllButton, { backgroundColor: theme.colors.background }]}
              onPress={handleClearAll}
            >
              <Text style={[styles.clearAllText, { color: theme.colors.text }]}>
                Clear All
              </Text>
            </TouchableOpacity>
            <Text style={[styles.selectedCount, { color: theme.colors.textSecondary }]}>
              {localSelectedCategories.length} selected
            </Text>
          </View>
          
          <FlatList
            data={allCategoryOptions}
            keyExtractor={(item) => item.id}
            renderItem={renderCategoryOption}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.categoriesList}
          />

          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.footerButton, styles.cancelButton, { backgroundColor: theme.colors.background }]}
              onPress={onClose}
            >
              <Text style={[styles.footerButtonText, { color: theme.colors.text }]}>
                Cancel
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.footerButton, styles.applyButton, { backgroundColor: theme.colors.primary }]}
              onPress={handleApply}
            >
              <Text style={[styles.footerButtonText, { color: 'white' }]}>
                Apply
              </Text>
            </TouchableOpacity>
          </View>
        </View>
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
    maxHeight: '80%',
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
  headerActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(150, 150, 150, 0.2)',
  },
  clearAllButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(150, 150, 150, 0.3)',
  },
  clearAllText: {
    fontSize: 14,
    fontWeight: '500',
  },
  selectedCount: {
    fontSize: 14,
    fontWeight: '500',
  },
  categoriesList: {
    padding: 8,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    marginVertical: 4,
    borderRadius: 12,
    borderWidth: 2,
  },
  categoryContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  customIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  iconFallback: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  categoryInfo: {
    flex: 1,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '500',
  },
  parentCategory: {
    fontSize: 12,
    marginTop: 2,
  },
  categoryType: {
    fontSize: 12,
    marginTop: 2,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  footer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(150, 150, 150, 0.2)',
  },
  footerButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    borderWidth: 1,
    borderColor: 'rgba(150, 150, 150, 0.3)',
  },
  applyButton: {
    // Primary color background applied inline
  },
  footerButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
});