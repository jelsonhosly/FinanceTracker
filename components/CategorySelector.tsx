import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, Image } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { useData } from '@/context/DataContext';
import { X, Coffee, Car, Chrome as Home, Zap, Tv, HeartPulse, Book, ShoppingCart, Plane, MoveHorizontal as MoreHorizontal, Briefcase, Gift, Laptop, TrendingUp, Heart, Tag, UtensilsCrossed, ShoppingBag } from 'lucide-react-native';
import { Category, Subcategory } from '@/types';
import { BlurView } from 'expo-blur';
import { Platform } from 'react-native';
import { useState } from 'react';

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

interface CategorySelectorProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (category: string, subcategory?: string) => void;
  transactionType: 'income' | 'expense';
}

export function CategorySelector({ visible, onClose, onSelect, transactionType }: CategorySelectorProps) {
  const { theme } = useTheme();
  const { categories } = useData();
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  
  // Filter categories based on transaction type
  const filteredCategories = categories.filter(
    category => category.type === transactionType
  );
  
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
      return <IconComponent size={24} color="white" />;
    }
    
    // Fallback to first letter
    return (
      <Text style={styles.iconFallback}>
        {item.name.charAt(0).toUpperCase()}
      </Text>
    );
  };
  
  const renderCategory = ({ item }: { item: Category }) => (
    <TouchableOpacity
      style={[
        styles.categoryItem, 
        { backgroundColor: theme.colors.card }
      ]}
      onPress={() => {
        if (item.subcategories && item.subcategories.length > 0) {
          setSelectedCategory(item);
        } else {
          onSelect(item.name);
        }
      }}
    >
      <View style={[
        styles.iconContainer,
        { backgroundColor: item.color }
      ]}>
        {renderCategoryIcon(item)}
        {item.subcategories && item.subcategories.length > 0 && (
          <View style={[styles.subcategoryIndicator, { backgroundColor: theme.colors.primary }]}>
            <Text style={styles.subcategoryCount}>
              {item.subcategories.length}
            </Text>
          </View>
        )}
      </View>
      <Text style={[styles.categoryName, { color: theme.colors.text }]}>
        {item.name}
      </Text>
    </TouchableOpacity>
  );

  const renderSubcategory = ({ item }: { item: Subcategory }) => (
    <TouchableOpacity
      style={[
        styles.subcategoryItem, 
        { backgroundColor: theme.colors.card }
      ]}
      onPress={() => {
        if (selectedCategory) {
          onSelect(selectedCategory.name, item.name);
        }
      }}
    >
      <View style={[
        styles.subcategoryIconContainer,
        { backgroundColor: item.color }
      ]}>
        {renderCategoryIcon(item)}
      </View>
      <Text style={[styles.subcategoryName, { color: theme.colors.text }]}>
        {item.name}
      </Text>
    </TouchableOpacity>
  );
  
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
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => {
                if (selectedCategory) {
                  setSelectedCategory(null);
                } else {
                  onClose();
                }
              }}
            >
              <X size={24} color={theme.colors.text} />
            </TouchableOpacity>
            <Text style={[styles.title, { color: theme.colors.text }]}>
              {selectedCategory 
                ? selectedCategory.name 
                : `Select ${transactionType === 'income' ? 'Income' : 'Expense'} Category`
              }
            </Text>
            <View style={styles.placeholder} />
          </View>
          
          {selectedCategory ? (
            // Show subcategories
            <View style={styles.content}>
              <TouchableOpacity
                style={[styles.mainCategoryOption, { backgroundColor: theme.colors.background }]}
                onPress={() => onSelect(selectedCategory.name)}
              >
                <View style={[styles.iconContainer, { backgroundColor: selectedCategory.color }]}>
                  {renderCategoryIcon(selectedCategory)}
                </View>
                <Text style={[styles.categoryName, { color: theme.colors.text }]}>
                  General {selectedCategory.name}
                </Text>
              </TouchableOpacity>
              
              <FlatList
                data={selectedCategory.subcategories || []}
                keyExtractor={(item) => item.id}
                renderItem={renderSubcategory}
                numColumns={2}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.subcategoriesList}
              />
            </View>
          ) : (
            // Show main categories
            <FlatList
              data={filteredCategories}
              keyExtractor={(item) => item.id}
              renderItem={renderCategory}
              numColumns={2}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.categoriesList}
            />
          )}
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
  backButton: {
    padding: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
  placeholder: {
    width: 32,
  },
  content: {
    padding: 16,
  },
  categoriesList: {
    padding: 8,
  },
  subcategoriesList: {
    paddingTop: 16,
  },
  categoryItem: {
    flex: 1,
    margin: 8,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    minHeight: 100,
    borderWidth: 1,
    borderColor: 'rgba(150, 150, 150, 0.1)',
  },
  subcategoryItem: {
    flex: 1,
    margin: 8,
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    minHeight: 80,
    borderWidth: 1,
    borderColor: 'rgba(150, 150, 150, 0.1)',
  },
  mainCategoryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    position: 'relative',
  },
  subcategoryIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  subcategoryIndicator: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  subcategoryCount: {
    fontSize: 10,
    fontWeight: '600',
    color: 'white',
  },
  customIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  iconFallback: {
    fontSize: 20,
    fontWeight: '600',
    color: 'white',
  },
  categoryName: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  subcategoryName: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
});