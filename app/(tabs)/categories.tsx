import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/context/ThemeContext';
import { StatusBar } from 'expo-status-bar';
import { ScreenHeader } from '@/components/ScreenHeader';
import { useData } from '@/context/DataContext';
import { Plus, Trash2, ChevronDown, ChevronUp, Coffee, Car, Chrome as Home, Zap, Tv, HeartPulse, Book, ShoppingCart, Plane, MoveHorizontal as MoreHorizontal, Briefcase, Gift, Laptop, TrendingUp, Heart, Tag, UtensilsCrossed, ShoppingBag, CreditCard as Edit3, Settings } from 'lucide-react-native';
import { useState, useRef } from 'react';
import { CategoryEditor } from '@/components/CategoryEditor';
import { SubcategoryEditor } from '@/components/SubcategoryEditor';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import { useSharedValue, useAnimatedStyle, withSpring, runOnJS } from 'react-native-reanimated';
import { CustomAlert, AlertButton } from '@/components/CustomAlert';

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

// Separate component for category list item
function CategoryListItem({ 
  category, 
  theme, 
  expandedCategoryId, 
  toggleExpanded, 
  handleEditCategory, 
  handleDeleteCategory, 
  handleEditSubcategory, 
  renderCategoryIcon, 
  renderSubcategoryIcon 
}: {
  category: any;
  theme: any;
  expandedCategoryId: string | null;
  toggleExpanded: (categoryId: string) => void;
  handleEditCategory: (categoryId: string) => void;
  handleDeleteCategory: (categoryId: string) => void;
  handleEditSubcategory: (categoryId: string, subcategory: any) => void;
  renderCategoryIcon: (category: any) => React.ReactNode;
  renderSubcategoryIcon: (subcategory: any) => React.ReactNode;
}) {
  const x = useSharedValue(0);
  const isExpanded = expandedCategoryId === category.id;
  const hasSubcategories = category.subcategories && category.subcategories.length > 0;
  const [showActions, setShowActions] = useState(false);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: x.value }],
    };
  });

  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      x.value = Math.max(-120, Math.min(0, event.translationX));
    })
    .onEnd((event) => {
      if (event.translationX < -60) {
        x.value = withSpring(-120);
        runOnJS(setShowActions)(true);
      } else {
        x.value = withSpring(0);
        runOnJS(setShowActions)(false);
      }
    });

  return (
    <View style={styles.categoryWrapper}>
      <View style={styles.categoryContainer}>
        {/* Action buttons revealed by swipe */}
        <View style={[styles.actionButtons, { backgroundColor: theme.colors.error }]}>
          <TouchableOpacity 
            style={styles.deleteButton}
            onPress={() => handleDeleteCategory(category.id)}
          >
            <Trash2 size={16} color="white" />
            <Text style={styles.deleteButtonText}>Delete</Text>
          </TouchableOpacity>
        </View>

        <GestureDetector gesture={panGesture}>
          <Animated.View style={[animatedStyle]}>
            <TouchableOpacity
              style={[styles.categoryItem, { backgroundColor: theme.colors.card }]}
              onPress={() => handleEditCategory(category.id)}
              activeOpacity={0.7}
            >
              <View style={styles.categoryContent}>
                <View style={styles.categoryMainInfo}>
                  <View style={[styles.categoryIcon, { backgroundColor: category.color }]}>
                    {renderCategoryIcon(category)}
                  </View>
                  
                  <View style={styles.categoryTextInfo}>
                    <Text style={[styles.categoryName, { color: theme.colors.text }]}>
                      {category.name}
                    </Text>
                    {hasSubcategories && (
                      <Text style={[styles.subcategoryCount, { color: theme.colors.textSecondary }]}>
                        {category.subcategories.length} subcategories
                      </Text>
                    )}
                  </View>
                </View>

                <View style={styles.categoryActions}>
                  <TouchableOpacity 
                    style={[styles.editButton, { backgroundColor: theme.colors.primary + '15' }]}
                    onPress={() => handleEditCategory(category.id)}
                  >
                    <Edit3 size={16} color={theme.colors.primary} />
                  </TouchableOpacity>
                  
                  {hasSubcategories && (
                    <TouchableOpacity 
                      style={[styles.expandButton, { backgroundColor: theme.colors.background }]}
                      onPress={() => toggleExpanded(category.id)}
                    >
                      {isExpanded ? (
                        <ChevronUp size={16} color={theme.colors.textSecondary} />
                      ) : (
                        <ChevronDown size={16} color={theme.colors.textSecondary} />
                      )}
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </TouchableOpacity>
          </Animated.View>
        </GestureDetector>
      </View>

      {/* Expanded subcategories */}
      {isExpanded && hasSubcategories && (
        <View style={[styles.subcategoriesContainer, { backgroundColor: theme.colors.background }]}>
          <View style={styles.subcategoriesHeader}>
            <Text style={[styles.subcategoriesTitle, { color: theme.colors.textSecondary }]}>
              Subcategories
            </Text>
            <TouchableOpacity 
              style={[styles.addSubcategoryButton, { backgroundColor: theme.colors.primary + '15' }]}
              onPress={() => handleEditSubcategory(category.id, null)}
            >
              <Plus size={14} color={theme.colors.primary} />
              <Text style={[styles.addSubcategoryText, { color: theme.colors.primary }]}>Add</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.subcategoriesList}>
            {category.subcategories.map((subcategory: any) => (
              <SubcategoryListItem
                key={subcategory.id}
                subcategory={subcategory}
                categoryId={category.id}
                theme={theme}
                handleEditSubcategory={handleEditSubcategory}
                renderSubcategoryIcon={renderSubcategoryIcon}
              />
            ))}
          </View>
        </View>
      )}

    </View>
  );
}

// Separate component for subcategory list item
function SubcategoryListItem({
  subcategory,
  categoryId,
  theme,
  handleEditSubcategory,
  renderSubcategoryIcon
}: {
  subcategory: any;
  categoryId: string;
  theme: any;
  handleEditSubcategory: (categoryId: string, subcategory: any) => void;
  renderSubcategoryIcon: (subcategory: any) => React.ReactNode;
}) {
  return (
    <TouchableOpacity
      style={[styles.subcategoryItem, { backgroundColor: theme.colors.card }]}
      onPress={() => handleEditSubcategory(categoryId, subcategory)}
      activeOpacity={0.7}
    >
      <View style={styles.subcategoryContent}>
        <View style={[styles.subcategoryIcon, { backgroundColor: subcategory.color }]}>
          {renderSubcategoryIcon(subcategory)}
        </View>
        <Text style={[styles.subcategoryName, { color: theme.colors.text }]}>
          {subcategory.name}
        </Text>
      </View>
      <View style={[styles.subcategoryEditButton, { backgroundColor: theme.colors.background }]}>
        <Edit3 size={12} color={theme.colors.textSecondary} />
      </View>
    </TouchableOpacity>
  );
}

export default function Categories() {
  const { theme } = useTheme();
  const { categories, deleteCategory, updateCategory } = useData();
  const [showEditor, setShowEditor] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showSubcategoryEditor, setShowSubcategoryEditor] = useState(false);
  const [selectedSubcategory, setSelectedSubcategory] = useState<any>(null);
  const [selectedCategoryForSubcategory, setSelectedCategoryForSubcategory] = useState<string | null>(null);
  const [expandedCategoryId, setExpandedCategoryId] = useState<string | null>(null);
  const [showCustomAlert, setShowCustomAlert] = useState(false);
  const [customAlertTitle, setCustomAlertTitle] = useState('');
  const [customAlertMessage, setCustomAlertMessage] = useState('');
  const [customAlertButtons, setCustomAlertButtons] = useState<AlertButton[]>([]);
  const [customAlertType, setCustomAlertType] = useState<'info' | 'warning' | 'error' | 'success'>('info');

  const incomeCategories = categories.filter(c => c.type === 'income');
  const expenseCategories = categories.filter(c => c.type === 'expense');

  const handleEditCategory = (categoryId: string) => {
    setSelectedCategory(categoryId);
    setShowEditor(true);
  };

  const handleEditSubcategory = (categoryId: string, subcategory: any) => {
    setSelectedCategoryForSubcategory(categoryId);
    setSelectedSubcategory(subcategory);
    setShowSubcategoryEditor(true);
  };

  const handleDeleteCategory = (categoryId: string) => {
    const categoryToDelete = categories.find(c => c.id === categoryId);
    setCustomAlertTitle('Delete Category');
    setCustomAlertMessage(`Are you sure you want to delete "${categoryToDelete?.name || 'this category'}"? This action cannot be undone.`);
    setCustomAlertType('warning');
    setCustomAlertButtons([
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => deleteCategory(categoryId)
      }
    ]);
    setShowCustomAlert(true);
  };

  const handleSaveSubcategory = (subcategoryData: any) => {
    if (!selectedCategoryForSubcategory) return;

    const category = categories.find(c => c.id === selectedCategoryForSubcategory);
    if (!category) return;

    let updatedSubcategories = [...(category.subcategories || [])];

    if (selectedSubcategory) {
      // Update existing subcategory
      updatedSubcategories = updatedSubcategories.map(sub =>
        sub.id === selectedSubcategory.id
          ? { ...subcategoryData, id: selectedSubcategory.id }
          : sub
      );
    } else {
      // Add new subcategory
      const newSubcategory = {
        ...subcategoryData,
        id: Math.random().toString(),
      };
      updatedSubcategories.push(newSubcategory);
    }

    // Update the category with new subcategories
    updateCategory({
      ...category,
      subcategories: updatedSubcategories,
    });

    setShowSubcategoryEditor(false);
    setSelectedSubcategory(null);
    setSelectedCategoryForSubcategory(null);
  };

  const toggleExpanded = (categoryId: string) => {
    setExpandedCategoryId(expandedCategoryId === categoryId ? null : categoryId);
  };

  const renderCategoryIcon = (category: any) => {
    // First check for custom image icon
    if (category.icon) {
      return (
        <Image 
          key={category.icon}
          source={{ uri: category.icon }} 
          style={styles.customIcon}
          resizeMode="contain"
        />
      );
    }
    
    // Then check for Lucide icon
    if (category.lucideIconName && LucideIconMap[category.lucideIconName]) {
      const IconComponent = LucideIconMap[category.lucideIconName];
      return <IconComponent size={20} color="white" />;
    }
    
    // Fallback to first letter
    return (
      <Text style={styles.iconFallback}>
        {category.name.charAt(0).toUpperCase()}
      </Text>
    );
  };

  const renderSubcategoryIcon = (subcategory: any) => {
    // First check for custom image icon
    if (subcategory.icon) {
      return (
        <Image 
          key={subcategory.icon}
          source={{ uri: subcategory.icon }} 
          style={styles.subcategoryCustomIcon}
          resizeMode="contain"
        />
      );
    }
    
    // Then check for Lucide icon
    if (subcategory.lucideIconName && LucideIconMap[subcategory.lucideIconName]) {
      const IconComponent = LucideIconMap[subcategory.lucideIconName];
      return <IconComponent size={14} color="white" />;
    }
    
    // Fallback to first letter
    return (
      <Text style={styles.subcategoryIconFallback}>
        {subcategory.name.charAt(0).toUpperCase()}
      </Text>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar style={theme.dark ? 'light' : 'dark'} />
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <ScreenHeader title="Categories" />

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {/* Income Categories Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleContainer}>
                <View style={[styles.sectionIndicator, { backgroundColor: theme.colors.success }]} />
                <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Income Categories</Text>
                <Text style={[styles.sectionCount, { color: theme.colors.textSecondary }]}>
                  {incomeCategories.length}
                </Text>
              </View>
              <TouchableOpacity 
                style={[styles.addButton, { backgroundColor: theme.colors.success + '15' }]}
                onPress={() => {
                  setSelectedCategory(null);
                  setShowEditor(true);
                }}
              >
                <Plus size={16} color={theme.colors.success} />
                <Text style={[styles.addButtonText, { color: theme.colors.success }]}>Add</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.categoriesList}>
              {incomeCategories.map(category => (
                <CategoryListItem
                  key={category.id}
                  category={category}
                  theme={theme}
                  expandedCategoryId={expandedCategoryId}
                  toggleExpanded={toggleExpanded}
                  handleEditCategory={handleEditCategory}
                  handleDeleteCategory={handleDeleteCategory}
                  handleEditSubcategory={handleEditSubcategory}
                  renderCategoryIcon={renderCategoryIcon}
                  renderSubcategoryIcon={renderSubcategoryIcon}
                />
              ))}
            </View>
          </View>

          {/* Expense Categories Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleContainer}>
                <View style={[styles.sectionIndicator, { backgroundColor: theme.colors.error }]} />
                <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Expense Categories</Text>
                <Text style={[styles.sectionCount, { color: theme.colors.textSecondary }]}>
                  {expenseCategories.length}
                </Text>
              </View>
              <TouchableOpacity 
                style={[styles.addButton, { backgroundColor: theme.colors.error + '15' }]}
                onPress={() => {
                  setSelectedCategory(null);
                  setShowEditor(true);
                }}
              >
                <Plus size={16} color={theme.colors.error} />
                <Text style={[styles.addButtonText, { color: theme.colors.error }]}>Add</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.categoriesList}>
              {expenseCategories.map(category => (
                <CategoryListItem
                  key={category.id}
                  category={category}
                  theme={theme}
                  expandedCategoryId={expandedCategoryId}
                  toggleExpanded={toggleExpanded}
                  handleEditCategory={handleEditCategory}
                  handleDeleteCategory={handleDeleteCategory}
                  handleEditSubcategory={handleEditSubcategory}
                  renderCategoryIcon={renderCategoryIcon}
                  renderSubcategoryIcon={renderSubcategoryIcon}
                />
              ))}
            </View>
          </View>
        </ScrollView>

        {showEditor && (
          <CategoryEditor
            visible={showEditor}
            onClose={() => {
              setShowEditor(false);
              setSelectedCategory(null);
            }}
            categoryId={selectedCategory}
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
        {showSubcategoryEditor && (
          <SubcategoryEditor
            visible={showSubcategoryEditor}
            onClose={() => {
              setShowSubcategoryEditor(false);
              setSelectedSubcategory(null);
              setSelectedCategoryForSubcategory(null);
            }}
            subcategory={selectedSubcategory}
            onSave={handleSaveSubcategory}
          />
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sectionIndicator: {
    width: 4,
    height: 20,
    borderRadius: 2,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  sectionCount: {
    fontSize: 14,
    fontWeight: '500',
    backgroundColor: 'rgba(150, 150, 150, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  categoriesList: {
    paddingHorizontal: 16,
    gap: 12,
  },
  categoryWrapper: {
    marginBottom: 4,
  },
  categoryContainer: {
    position: 'relative',
    overflow: 'hidden',
    borderRadius: 16,
  },
  actionButtons: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 120,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  deleteButton: {
    alignItems: 'center',
    gap: 2,
    padding: 8,
  },
  deleteButtonText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
  },
  categoryItem: {
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  categoryContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  categoryMainInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    flex: 1,
  },
  categoryIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryTextInfo: {
    flex: 1,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  subcategoryCount: {
    fontSize: 12,
    fontWeight: '500',
  },
  categoryActions: {
    flexDirection: 'row',
    gap: 8,
  },
  editButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  expandButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  customIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  iconFallback: {
    fontSize: 16,
    fontWeight: '700',
    color: 'white',
  },
  subcategoriesContainer: {
    marginTop: 8,
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 16,
  },
  subcategoriesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
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
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  addSubcategoryText: {
    fontSize: 12,
    fontWeight: '600',
  },
  subcategoriesList: {
    gap: 8,
  },
  subcategoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 12,
  },
  subcategoryContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  subcategoryIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  subcategoryName: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  subcategoryEditButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  subcategoryCustomIcon: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  subcategoryIconFallback: {
    fontSize: 12,
    fontWeight: '700',
    color: 'white',
  },
});