import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import Svg, {
  Path,
  Defs,
  LinearGradient as SvgGradient,
  Stop,
  Circle,
  Line,
} from 'react-native-svg';
import { haptics } from '../../services/haptics';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CHART_WIDTH = SCREEN_WIDTH - 44 - 36; // container padding
const CHART_HEIGHT = 140;

type PeriodType = 'Week' | 'Month' | 'Year';

interface ExpenseSplineChartProps {
  currencySymbol?: string;
}

export const ExpenseSplineChart: React.FC<ExpenseSplineChartProps> = ({
  currencySymbol = '$',
}) => {
  const [period, setPeriod] = useState<PeriodType>('Month');

  // Smooth spline curves for different periods
  const chartConfigs: Record<
    PeriodType,
    {
      curvePath: string;
      areaPath: string;
      activePoint: { x: number; y: number; label: string; amount: string };
      labels: string[];
    }
  > = {
    Week: {
      curvePath: `M 10 110 C 50 120, 80 50, 130 65 C 180 80, 220 25, 270 35 C 310 45, 330 90, 360 85`,
      areaPath: `M 10 110 C 50 120, 80 50, 130 65 C 180 80, 220 25, 270 35 C 310 45, 330 90, 360 85 L 360 140 L 10 140 Z`,
      activePoint: { x: 270, y: 35, label: 'Thu', amount: `${currencySymbol}190.00` },
      labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    },
    Month: {
      curvePath: `M 10 95 C 45 110, 75 70, 115 85 C 160 100, 195 20, 245 42 C 285 60, 320 80, 360 70`,
      areaPath: `M 10 95 C 45 110, 75 70, 115 85 C 160 100, 195 20, 245 42 C 285 60, 320 80, 360 70 L 360 140 L 10 140 Z`,
      activePoint: { x: 195, y: 20, label: 'Sep', amount: `${currencySymbol}268.04` },
      labels: ['Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov'],
    },
    Year: {
      curvePath: `M 10 105 C 55 90, 100 125, 150 70 C 200 15, 260 55, 310 30 C 335 18, 350 40, 360 45`,
      areaPath: `M 10 105 C 55 90, 100 125, 150 70 C 200 15, 260 55, 310 30 C 335 18, 350 40, 360 45 L 360 140 L 10 140 Z`,
      activePoint: { x: 200, y: 15, label: 'Q3', amount: `${currencySymbol}1,450.00` },
      labels: ['2023', '2024', '2025', '2026'],
    },
  };

  const current = chartConfigs[period];

  return (
    <View style={styles.container}>
      {/* Header with Title and Segmented Period Selector */}
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.chartTitle}>Expense Chart</Text>
          <Text style={styles.chartSubtitle}>Spending trend analysis</Text>
        </View>

        {/* Segmented Pill Selector */}
        <View style={styles.periodTabs}>
          {(['Week', 'Month', 'Year'] as PeriodType[]).map((tab) => {
            const isActive = tab === period;
            return (
              <TouchableOpacity
                key={tab}
                style={[styles.tabBtn, isActive && styles.tabBtnActive]}
                onPress={() => {
                  try { haptics.selection(); } catch {}
                  setPeriod(tab);
                }}
                activeOpacity={0.7}
              >
                <Text style={[styles.tabBtnText, isActive && styles.tabBtnTextActive]}>
                  {tab}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Interactive Tooltip Callout */}
      <View style={[styles.tooltipContainer, { left: Math.min(CHART_WIDTH - 60, Math.max(10, current.activePoint.x - 30)) }]}>
        <View style={styles.tooltipBadge}>
          <Text style={styles.tooltipAmount}>{current.activePoint.amount}</Text>
        </View>
      </View>

      {/* Svg Spline Curve with Gradient Fill */}
      <View style={styles.svgContainer}>
        <Svg width="100%" height={CHART_HEIGHT} viewBox="0 0 370 140">
          <Defs>
            <SvgGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor="#2563EB" stopOpacity="0.28" />
              <Stop offset="80%" stopColor="#2563EB" stopOpacity="0.02" />
              <Stop offset="100%" stopColor="#2563EB" stopOpacity="0" />
            </SvgGradient>
          </Defs>

          {/* Subtle grid guidelines */}
          <Line x1="10" y1="40" x2="360" y2="40" stroke="#F1F5F9" strokeWidth="1" strokeDasharray="4,4" />
          <Line x1="10" y1="90" x2="360" y2="90" stroke="#F1F5F9" strokeWidth="1" strokeDasharray="4,4" />

          {/* Gradient area */}
          <Path d={current.areaPath} fill="url(#chartGrad)" />

          {/* Smooth spline stroke line */}
          <Path
            d={current.curvePath}
            fill="none"
            stroke="#2563EB"
            strokeWidth="3"
            strokeLinecap="round"
          />

          {/* Active point indicator with glowing outer ring */}
          <Circle
            cx={current.activePoint.x}
            cy={current.activePoint.y}
            r="8"
            fill="#2563EB"
            fillOpacity="0.25"
          />
          <Circle
            cx={current.activePoint.x}
            cy={current.activePoint.y}
            r="4.5"
            fill="#2563EB"
            stroke="#FFFFFF"
            strokeWidth="2"
          />

          {/* Vertical guideline dropped from active point */}
          <Line
            x1={current.activePoint.x}
            y1={current.activePoint.y + 8}
            x2={current.activePoint.x}
            y2="135"
            stroke="#2563EB"
            strokeWidth="1.2"
            strokeDasharray="2,2"
          />
        </Svg>
      </View>

      {/* X-Axis Labels */}
      <View style={styles.labelsRow}>
        {current.labels.map((lbl, idx) => {
          const isSelected = lbl === current.activePoint.label;
          return (
            <Text
              key={idx}
              style={[styles.axisLabel, isSelected && styles.axisLabelSelected]}
            >
              {lbl}
            </Text>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  chartTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.2,
  },
  chartSubtitle: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  periodTabs: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    padding: 3,
  },
  tabBtn: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 9,
  },
  tabBtnActive: {
    backgroundColor: '#0F172A',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  tabBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  tabBtnTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  tooltipContainer: {
    position: 'absolute',
    top: 54,
    zIndex: 10,
  },
  tooltipBadge: {
    backgroundColor: '#0F172A',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  tooltipAmount: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  svgContainer: {
    marginTop: 10,
    height: CHART_HEIGHT,
    overflow: 'hidden',
  },
  labelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    marginTop: 6,
  },
  axisLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94A3B8',
  },
  axisLabelSelected: {
    color: '#0F172A',
    fontWeight: '800',
  },
});
