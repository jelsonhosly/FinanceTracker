import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { useData } from '@/context/DataContext';
import { Coffee, Car, Chrome as Home, Zap, Tv, HeartPulse, Book, ShoppingCart, Plane, MoveHorizontal as MoreHorizontal, Briefcase, Gift, Laptop, TrendingUp, Heart, Tag, UtensilsCrossed, ShoppingBag, Check } from 'lucide-react-native';
import { Category, Subcategory, TransactionType } from '@/types';
import { createElement, useEffect, useRef } from 'react';

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

interface CategoryHorizontalSelectorProps {
  selectedCategory: string | null;
  selectedSubcategory: string | null;
  onSelectCategory: (category: string) => void;
  onSelectSubcategory: (subcategory: string | null) => void;
  transactionType: TransactionType;
  title?: string;
}

export function CategoryHorizontalSelector({ 
  selectedCategory,
  selectedSubcategory,
  onSelectCategory,
  onSelectSubcategory,
  transactionType,
  title = 'Select Category'
}: CategoryHorizontalSelectorProps) {
  const { theme } = useTheme();
  const { categories } = useData();
  const categoryScrollRef = useRef<ScrollView>(null);
  const subcategoryScrollRef = useRef<ScrollView>(null);
  
  // Filter categories based on transaction type
  const filteredCategories = categories.filter(
    category => category.type === transactionType
  );

  // Get subcategories for selected category
  const selectedCategoryData = selectedCategory 
    ? filteredCategories.find(cat => cat.name === selectedCategory)
    : null;
  
  const subcategories = selectedCategoryData?.subcategories || [];

  // Auto-scroll to selected category when editing
  useEffect(() => {
    if (selectedCategory && categoryScrollRef.current) {
      const selectedIndex = filteredCategories.findIndex(cat => cat.name === selectedCategory);
      if (selectedIndex !== -1) {
        const scrollOffset = selectedIndex * 112; // 100 width + 12 gap
        setTimeout(() => {
          categoryScrollRef.current?.scrollTo({ x: scrollOffset, animated: true });
        }, 100);
      }
    }
  }, [selectedCategory, filteredCategories]);

  // Auto-scroll to selected subcategory when editing
  useEffect(() => {
    if (selectedSubcategory && subcategoryScrollRef.current && subcategories.length > 0) {
      const selectedIndex = subcategories.findIndex(sub => sub.name === selectedSubcategory);
      if (selectedIndex !== -1) {
        const scrollOffset = (selectedIndex + 1) * 92; // +1 for "General" option, 80 width + 12 gap
        setTimeout(() => {
          subcategoryScrollRef.current?.scrollTo({ x: scrollOffset, animated: true });
        }, 100);
      }
    }
  }, [selectedSubcategory, subcategories]);
  
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
      return createElement(IconComponent, { size: 18, color: 'white' });
    }
    
    // Fallback to first letter
    return (
      <Text style={styles.iconFallback}>
        {item.name.charAt(0).toUpperCase()}
      </Text>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: theme.colors.textSecondary }]}>{title}</Text>
      
      {/* Main Categories */}
      <ScrollView 
        ref={categoryScrollRef}
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        style={styles.scrollView}
      >
        {filteredCategories.map((category) => {
          const isSelected = selectedCategory === category.name;
          
          return (
            <TouchableOpacity
              key={category.id}
              style={[
                styles.categoryCard,
                { 
                  backgroundColor: isSelected ? theme.colors.primary + '20' : theme.colors.background,
                  borderColor: isSelected ? theme.colors.primary : theme.colors.border,
                }
              ]}
              onPress={() => {
                onSelectCategory(category.name);
                onSelectSubcategory(null); // Reset subcategory when changing category
              }}
            >
              <View style={styles.categoryHeader}>
                <View style={[styles.iconContainer, { backgroundColor: category.color }]}>
                  {renderCategoryIcon(category)}
                </View>
                {isSelected && (
                  <View style={[styles.selectedIndicator, { backgroundColor: theme.colors.primary }]}>
                    <Check size={10} color="white" />
                  </View>
                )}
                {category.subcategories && category.subcategories.length > 0 && (
                  <View style={[styles.subcategoryBadge, { backgroundColor: theme.colors.secondary }]}>
                    <Text style={styles.subcategoryCount}>
                      {category.subcategories.length}
                    </Text>
                  </View>
                )}
              </View>
              
              <Text 
                style={[
                  styles.categoryName, 
                  { color: isSelected ? theme.colors.primary : theme.colors.text }
                ]}
                numberOfLines={2}
              >
                {category.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Subcategories (if any) */}
      {subcategories.length > 0 && (
        <View style={styles.subcategoriesContainer}>
          <Text style={[styles.subcategoriesTitle, { color: theme.colors.textSecondary }]}>
            Subcategories
          </Text>
          <ScrollView 
            ref={subcategoryScrollRef}
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            style={styles.scrollView}
          >
            {/* General option */}
            <TouchableOpacity
              style={[
                styles.subcategoryCard,
                { 
                  backgroundColor: !selectedSubcategory ? theme.colors.primary + '20' : theme.colors.background,
                  borderColor: !selectedSubcategory ? theme.colors.primary : theme.colors.border,
                }
              ]}
              onPress={() => onSelectSubcategory(null)}
            >
              <View style={styles.subcategoryHeader}>
                <View style={[styles.subcategoryIconContainer, { backgroundColor: selectedCategoryData?.color || theme.colors.textSecondary }]}>
                  {selectedCategoryData && renderCategoryIcon(selectedCategoryData)}
                </View>
                {!selectedSubcategory && (
                  <View style={[styles.selectedIndicator, { backgroundColor: theme.colors.primary }]}>
                    <Check size={8} color="white" />
                  </View>
                )}
              </View>
              <Text 
                style={[
                  styles.subcategoryName, 
                  { color: !selectedSubcategory ? theme.colors.primary : theme.colors.text }
                ]}
                numberOfLines={1}
              >
                General
              </Text>
            </TouchableOpacity>

            {/* Specific subcategories */}
            {subcategories.map((subcategory) => {
              const isSelected = selectedSubcategory === subcategory.name;
              
              return (
                <TouchableOpacity
                  key={subcategory.id}
                  style={[
                    styles.subcategoryCard,
                    { 
                      backgroundColor: isSelected ? theme.colors.primary + '20' : theme.colors.background,
                      borderColor: isSelected ? theme.colors.primary : theme.colors.border,
                    }
                  ]}
                  onPress={() => onSelectSubcategory(subcategory.name)}
                >
                  <View style={styles.subcategoryHeader}>
                    <View style={[styles.subcategoryIconContainer, { backgroundColor: subcategory.color }]}>
                      {renderCategoryIcon(subcategory)}
                    </View>
                    {isSelected && (
                      <View style={[styles.selectedIndicator, { backgroundColor: theme.colors.primary }]}>
                        <Check size={8} color="white" />
                      </View>
                    )}
                  </View>
                  <Text 
                    style={[
                      styles.subcategoryName, 
                      { color: isSelected ? theme.colors.primary : theme.colors.text }
                    ]}
                    numberOfLines={1}
                  >
                    {subcategory.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  title: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  scrollView: {
    flexGrow: 0,
  },
  scrollContent: {
    paddingHorizontal: 4,
    gap: 12,
  },
  categoryCard: {
    width: 100,
    padding: 12,
    borderRadius: 16,
    borderWidth: 2,
    alignItems: 'center',
    position: 'relative',
  },
  categoryHeader: {
    position: 'relative',
    marginBottom: 8,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  customIcon: {
    width: 18,
    height: 18,
    borderRadius: 9,
  },
  iconFallback: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
  },
  selectedIndicator: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  subcategoryBadge: {
    position: 'absolute',
    bottom: -6,
    left: -6,
    width: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  subcategoryCount: {
    fontSize: 9,
    fontWeight: '700',
    color: 'white',
  },
  categoryName: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 14,
  },
  subcategoriesContainer: {
    marginTop: 12,
  },
  subcategoriesTitle: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 8,
    paddingHorizontal: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  subcategoryCard: {
    width: 80,
    padding: 10,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    position: 'relative',
  },
  subcategoryHeader: {
    position: 'relative',
    marginBottom: 6,
  },
  subcategoryIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  subcategoryName: {
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 12,
  },
});