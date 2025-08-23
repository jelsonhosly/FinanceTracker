import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { Svg, G, Path, Circle, Text as SvgText, Defs, LinearGradient, Stop } from 'react-native-svg';
import { useTheme } from '@/context/ThemeContext';
import { Account, Currency } from '@/types';
import { CreditCard, Wallet, Landmark, Banknote, Bitcoin, PiggyBank, Briefcase, Building, DollarSign } from 'lucide-react-native';
import { createElement } from 'react';
import { LucideIconMap } from '@/components/IconColorPicker';

interface AccountBalanceChartProps {
  accounts: Account[];
  currencies: Currency[];
  mainCurrencyCode: string;
  getExchangeRate: (from: string, to: string) => number;
}

const { width: screenWidth } = Dimensions.get('window');

export function AccountBalanceChart({ 
  accounts, 
  currencies, 
  mainCurrencyCode, 
  getExchangeRate 
}: AccountBalanceChartProps) {
  const { theme } = useTheme();
  
  // Get main currency
  const mainCurrency = currencies.find(c => c.code === mainCurrencyCode);

  const renderAccountIcon = (account: Account) => {
    // Check for Lucide icon
    if (account.lucideIconName && LucideIconMap[account.lucideIconName]) {
      const IconComponent = LucideIconMap[account.lucideIconName];
      return createElement(IconComponent, { size: 20, color: 'white' });
    }
    
    // Fallback based on account type
    switch (account.type) {
      case 'bank':
      case 'checking':
        return <Landmark size={20} color="white" />;
      case 'cash':
        return <Wallet size={20} color="white" />;
      case 'credit':
        return <CreditCard size={20} color="white" />;
      case 'investment':
        return <Banknote size={20} color="white" />;
      case 'crypto':
        return <Bitcoin size={20} color="white" />;
      case 'wallet':
        return <Wallet size={20} color="white" />;
      case 'loan':
        return <Building size={20} color="white" />;
      case 'savings':
        return <PiggyBank size={20} color="white" />;
      case 'business':
        return <Briefcase size={20} color="white" />;
      case 'other':
        return <DollarSign size={20} color="white" />;
      default:
        return <CreditCard size={20} color="white" />;
    }
  };

  // Convert all balances to main currency and prepare data
  const accountData = accounts.map(account => {
    const convertedBalance = account.balance * getExchangeRate(account.currency, mainCurrencyCode);
    return {
      ...account,
      convertedBalance,
      absoluteBalance: Math.abs(convertedBalance),
    };
  }).sort((a, b) => b.absoluteBalance - a.absoluteBalance);

  const totalAbsoluteBalance = accountData.reduce((sum, acc) => sum + acc.absoluteBalance, 0);

  // Chart dimensions
  const chartSize = Math.min(screenWidth - 80, 300);
  const radius = chartSize / 2 - 60;
  const centerX = chartSize / 2;
  const centerY = chartSize / 2;

  // Generate pie chart
  const generatePieChart = () => {
    if (totalAbsoluteBalance === 0) return [];
    
    let startAngle = -Math.PI / 2; // Start from top
    
    return accountData.map((account, index) => {
      const percentage = account.absoluteBalance / totalAbsoluteBalance;
      const endAngle = startAngle + percentage * 2 * Math.PI;
      
      const x1 = centerX + radius * Math.cos(startAngle);
      const y1 = centerY + radius * Math.sin(startAngle);
      const x2 = centerX + radius * Math.cos(endAngle);
      const y2 = centerY + radius * Math.sin(endAngle);
      
      const largeArcFlag = percentage > 0.5 ? 1 : 0;
      const pathData = `M ${centerX},${centerY} L ${x1},${y1} A ${radius},${radius} 0 ${largeArcFlag} 1 ${x2},${y2} Z`;
      
      // Calculate label position
      const labelAngle = startAngle + (endAngle - startAngle) / 2;
      const labelRadius = radius * 0.75;
      const labelX = centerX + labelRadius * Math.cos(labelAngle);
      const labelY = centerY + labelRadius * Math.sin(labelAngle);
      
      const segment = (
        <G key={index}>
          <Path 
            d={pathData} 
            fill={account.color}
            opacity={0.9}
          />
          {percentage > 0.08 && (
            <SvgText
              x={labelX}
              y={labelY}
              fontSize="12"
              fontWeight="bold"
              fill="white"
              textAnchor="middle"
              alignmentBaseline="middle"
            >
              {(percentage * 100).toFixed(0)}%
            </SvgText>
          )}
        </G>
      );
      
      startAngle = endAngle;
      return segment;
    });
  };

  const totalNetBalance = accountData.reduce((sum, acc) => sum + acc.convertedBalance, 0);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.card }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.text }]}>
          Account Balances
        </Text>
        <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
          Distribution of account balances
        </Text>
      </View>

      {/* Chart */}
      <View style={styles.chartContainer}>
        <Svg width={chartSize} height={chartSize} viewBox={`0 0 ${chartSize} ${chartSize}`}>
          <Defs>
            <LinearGradient id="centerGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor={theme.colors.primary} stopOpacity="0.1" />
              <Stop offset="100%" stopColor={theme.colors.secondary} stopOpacity="0.1" />
            </LinearGradient>
          </Defs>
          
          {generatePieChart()}
          
          {/* Center circle with total */}
          <Circle cx={centerX} cy={centerY} r="60" fill="url(#centerGradient)" />
          <Circle cx={centerX} cy={centerY} r="60" fill={theme.colors.card} opacity="0.95" />
          
          <SvgText
            x={centerX}
            y={centerY - 10}
            fontSize="18"
            fontWeight="bold"
            fill={totalNetBalance >= 0 ? theme.colors.success : theme.colors.error}
            textAnchor="middle"
          >
            {totalNetBalance >= 0 ? '+' : ''}{mainCurrency?.symbol}{totalNetBalance.toFixed(0)}
          </SvgText>
          <SvgText
            x={centerX}
            y={centerY + 15}
            fontSize="12"
            fill={theme.colors.textSecondary}
            textAnchor="middle"
          >
            Total Balance
          </SvgText>
        </Svg>
      </View>
      
      {/* Account Legend */}
      <View style={styles.legendContainer}>
        {accountData.map((account, index) => {
          const percentage = totalAbsoluteBalance > 0 ? (account.absoluteBalance / totalAbsoluteBalance) * 100 : 0;
          
          return (
            <View key={index} style={[styles.legendItem, { backgroundColor: theme.colors.background }]}>
              <View style={styles.legendLeft}>
                <View style={[styles.accountIcon, { backgroundColor: account.color }]}>
                  {renderAccountIcon(account)}
                </View>
                <View style={styles.legendText}>
                  <Text style={[styles.legendName, { color: theme.colors.text }]}>
                    {account.name}
                  </Text>
                  <Text style={[styles.legendType, { color: theme.colors.textSecondary }]}>
                    {account.type.charAt(0).toUpperCase() + account.type.slice(1)} • {percentage.toFixed(1)}%
                  </Text>
                </View>
              </View>
              <View style={styles.legendRight}>
                <Text style={[
                  styles.legendAmount, 
                  { color: account.convertedBalance >= 0 ? theme.colors.success : theme.colors.error }
                ]}>
                  {account.convertedBalance >= 0 ? '+' : ''}{mainCurrency?.symbol}{account.convertedBalance.toFixed(0)}
                </Text>
                <Text style={[styles.legendCurrency, { color: theme.colors.textSecondary }]}>
                  {account.currency}
                </Text>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    margin: 16,
    borderRadius: 24,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 12,
  },
  header: {
    marginBottom: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '500',
  },
  chartContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  legendContainer: {
    gap: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 12,
  },
  legendLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  accountIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  legendText: {
    flex: 1,
  },
  legendName: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  legendType: {
    fontSize: 12,
    fontWeight: '500',
  },
  legendRight: {
    alignItems: 'flex-end',
  },
  legendAmount: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  legendCurrency: {
    fontSize: 12,
    fontWeight: '500',
  },
});