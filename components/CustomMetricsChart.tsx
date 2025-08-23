import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { Svg, Path, Circle, Text as SvgText, Defs, LinearGradient, Stop, G, Rect } from 'react-native-svg';
import { useTheme } from '@/context/ThemeContext';
import { Transaction, Currency } from '@/types';

interface CustomMetricsChartProps {
  transactions: Transaction[];
  currencies: Currency[];
  mainCurrencyCode: string;
  getExchangeRate: (from: string, to: string) => number;
  selectedMetrics: string[];
  chartType: 'line' | 'bar' | 'pie';
  groupBy: 'day' | 'week' | 'month';
  dateRange: {
    startDate: Date | null;
    endDate: Date | null;
  };
}

const { width: screenWidth } = Dimensions.get('window');

export function CustomMetricsChart({ 
  transactions, 
  currencies, 
  mainCurrencyCode, 
  getExchangeRate,
  selectedMetrics,
  chartType,
  groupBy,
  dateRange
}: CustomMetricsChartProps) {
  const { theme } = useTheme();
  
  // Get main currency
  const mainCurrency = currencies.find(c => c.code === mainCurrencyCode);

  // Generate time periods based on groupBy
  const generateTimePeriods = () => {
    const periods = [];
    const now = new Date();
    const start = dateRange.startDate || new Date(now.getFullYear(), now.getMonth() - 5, 1);
    const end = dateRange.endDate || now;
    
    let current = new Date(start);
    
    while (current <= end) {
      let periodKey = '';
      let periodLabel = '';
      let nextPeriod = new Date(current);
      
      switch (groupBy) {
        case 'day':
          periodKey = current.toISOString().split('T')[0];
          periodLabel = current.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
          nextPeriod.setDate(current.getDate() + 1);
          break;
        case 'week':
          const weekStart = new Date(current);
          weekStart.setDate(current.getDate() - current.getDay());
          periodKey = weekStart.toISOString().split('T')[0];
          periodLabel = `Week ${Math.ceil(current.getDate() / 7)}`;
          nextPeriod.setDate(current.getDate() + 7);
          break;
        case 'month':
          periodKey = `${current.getFullYear()}-${current.getMonth()}`;
          periodLabel = current.toLocaleDateString(undefined, { month: 'short' });
          nextPeriod.setMonth(current.getMonth() + 1);
          break;
      }
      
      periods.push({ key: periodKey, label: periodLabel, date: new Date(current) });
      current = nextPeriod;
    }
    
    return periods;
  };

  const periods = generateTimePeriods();

  // Calculate metrics for each period
  const calculateMetrics = () => {
    return periods.map(period => {
      const periodTransactions = transactions.filter(transaction => {
        const transactionDate = new Date(transaction.date);
        
        switch (groupBy) {
          case 'day':
            return transactionDate.toISOString().split('T')[0] === period.key;
          case 'week':
            const weekStart = new Date(period.date);
            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekStart.getDate() + 6);
            return transactionDate >= weekStart && transactionDate <= weekEnd;
          case 'month':
            return transactionDate.getMonth() === period.date.getMonth() && 
                   transactionDate.getFullYear() === period.date.getFullYear();
          default:
            return false;
        }
      });

      const income = periodTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => {
          const convertedAmount = t.amount * getExchangeRate(t.currency || mainCurrencyCode, mainCurrencyCode);
          return sum + convertedAmount;
        }, 0);
      
      const expenses = periodTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => {
          const convertedAmount = t.amount * getExchangeRate(t.currency || mainCurrencyCode, mainCurrencyCode);
          return sum + convertedAmount;
        }, 0);

      return {
        period: period.label,
        income,
        expenses,
        net: income - expenses,
        transactions: periodTransactions.length,
      };
    });
  };

  const metricsData = calculateMetrics();

  // Get metric colors
  const getMetricColor = (metric: string) => {
    switch (metric) {
      case 'income':
        return theme.colors.success;
      case 'expenses':
        return theme.colors.error;
      case 'net':
        return theme.colors.primary;
      case 'transactions':
        return theme.colors.secondary;
      default:
        return theme.colors.textSecondary;
    }
  };

  // Chart dimensions
  const chartWidth = screenWidth - 72;
  const chartHeight = 200;
  const padding = 20;
  const innerWidth = chartWidth - padding * 2;
  const innerHeight = chartHeight - padding * 2;

  // Render based on chart type
  const renderChart = () => {
    if (chartType === 'pie') {
      // Pie chart showing metric totals
      const totals = selectedMetrics.map(metric => {
        const total = metricsData.reduce((sum, data) => sum + (data as any)[metric], 0);
        return {
          name: metric.charAt(0).toUpperCase() + metric.slice(1),
          value: Math.abs(total),
          color: getMetricColor(metric),
        };
      });

      const totalValue = totals.reduce((sum, item) => sum + item.value, 0);
      let startAngle = -Math.PI / 2;

      return (
        <Svg width={chartWidth} height={chartHeight} viewBox={`0 0 ${chartWidth} ${chartHeight}`}>
          {totals.map((item, index) => {
            const percentage = totalValue > 0 ? item.value / totalValue : 0;
            const endAngle = startAngle + percentage * 2 * Math.PI;
            
            const radius = 80;
            const centerX = chartWidth / 2;
            const centerY = chartHeight / 2;
            
            const x1 = centerX + radius * Math.cos(startAngle);
            const y1 = centerY + radius * Math.sin(startAngle);
            const x2 = centerX + radius * Math.cos(endAngle);
            const y2 = centerY + radius * Math.sin(endAngle);
            
            const largeArcFlag = percentage > 0.5 ? 1 : 0;
            const pathData = `M ${centerX},${centerY} L ${x1},${y1} A ${radius},${radius} 0 ${largeArcFlag} 1 ${x2},${y2} Z`;
            
            const segment = (
              <Path 
                key={index}
                d={pathData} 
                fill={item.color}
                opacity={0.9}
              />
            );
            
            startAngle = endAngle;
            return segment;
          })}
          
          <Circle cx={chartWidth / 2} cy={chartHeight / 2} r="40" fill={theme.colors.card} />
          <SvgText
            x={chartWidth / 2}
            y={chartHeight / 2}
            fontSize="14"
            fontWeight="bold"
            fill={theme.colors.text}
            textAnchor="middle"
          >
            Metrics
          </SvgText>
        </Svg>
      );
    }

    // Line or Bar chart
    const maxValue = Math.max(
      ...selectedMetrics.flatMap(metric => 
        metricsData.map(data => Math.abs((data as any)[metric]))
      ),
      100
    );

    return (
      <Svg width={chartWidth} height={chartHeight} viewBox={`0 0 ${chartWidth} ${chartHeight}`}>
        <Defs>
          {selectedMetrics.map((metric, index) => (
            <LinearGradient key={index} id={`gradient-${metric}`} x1="0%" y1="0%" x2="0%" y2="100%">
              <Stop offset="0%" stopColor={getMetricColor(metric)} stopOpacity="0.3" />
              <Stop offset="100%" stopColor={getMetricColor(metric)} stopOpacity="0.05" />
            </LinearGradient>
          ))}
        </Defs>
        
        {/* Background grid */}
        <G opacity="0.1">
          {[0.25, 0.5, 0.75].map((ratio, index) => (
            <Path
              key={index}
              d={`M ${padding} ${padding + innerHeight * ratio} L ${padding + innerWidth} ${padding + innerHeight * ratio}`}
              stroke={theme.colors.textSecondary}
              strokeWidth="1"
              strokeDasharray="4,4"
            />
          ))}
        </G>
        
        {chartType === 'line' ? (
          // Line chart
          selectedMetrics.map((metric, metricIndex) => {
            const values = metricsData.map(data => (data as any)[metric]);
            const points = values.map((value, index) => ({
              x: padding + (index / (values.length - 1)) * innerWidth,
              y: padding + innerHeight - (Math.abs(value) / maxValue) * innerHeight
            }));

            if (points.length < 2) return null;

            let path = `M ${points[0].x} ${points[0].y}`;
            for (let i = 1; i < points.length; i++) {
              path += ` L ${points[i].x} ${points[i].y}`;
            }

            return (
              <G key={metricIndex}>
                <Path
                  d={`${path} L ${padding + innerWidth} ${padding + innerHeight} L ${padding} ${padding + innerHeight} Z`}
                  fill={`url(#gradient-${metric})`}
                />
                <Path
                  d={path}
                  stroke={getMetricColor(metric)}
                  strokeWidth="3"
                  fill="none"
                  strokeLinecap="round"
                />
                {points.map((point, pointIndex) => (
                  <Circle
                    key={pointIndex}
                    cx={point.x}
                    cy={point.y}
                    r="4"
                    fill={getMetricColor(metric)}
                  />
                ))}
              </G>
            );
          })
        ) : (
          // Bar chart
          metricsData.map((data, dataIndex) => {
            const barWidth = innerWidth / metricsData.length * 0.8;
            const barSpacing = innerWidth / metricsData.length * 0.2;
            const groupWidth = barWidth / selectedMetrics.length;
            
            return selectedMetrics.map((metric, metricIndex) => {
              const value = Math.abs((data as any)[metric]);
              const barHeight = (value / maxValue) * innerHeight;
              const x = padding + dataIndex * (barWidth + barSpacing) + metricIndex * groupWidth;
              const y = padding + innerHeight - barHeight;
              
              return (
                <Rect
                  key={`${dataIndex}-${metricIndex}`}
                  x={x}
                  y={y}
                  width={groupWidth * 0.8}
                  height={barHeight}
                  fill={getMetricColor(metric)}
                  rx="2"
                />
              );
            });
          })
        )}
        
        {/* X-axis labels */}
        {metricsData.map((data, index) => {
          const x = padding + (index / (metricsData.length - 1)) * innerWidth;
          
          return (
            <SvgText
              key={`label-${index}`}
              x={x}
              y={chartHeight - 5}
              fontSize="10"
              fill={theme.colors.textSecondary}
              textAnchor="middle"
              fontWeight="500"
            >
              {data.period}
            </SvgText>
          );
        })}
      </Svg>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.card }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.text }]}>
          Custom Metrics Chart
        </Text>
        <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
          {chartType.charAt(0).toUpperCase() + chartType.slice(1)} chart grouped by {groupBy}
        </Text>
      </View>

      <View style={styles.chartContainer}>
        {renderChart()}
      </View>
      
      {/* Legend */}
      <View style={styles.legendContainer}>
        {selectedMetrics.map((metric, index) => (
          <View key={index} style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: getMetricColor(metric) }]} />
            <Text style={[styles.legendText, { color: theme.colors.text }]}>
              {metric.charAt(0).toUpperCase() + metric.slice(1)}
            </Text>
          </View>
        ))}
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
    marginBottom: 20,
  },
  legendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    fontSize: 14,
    fontWeight: '600',
  },
});