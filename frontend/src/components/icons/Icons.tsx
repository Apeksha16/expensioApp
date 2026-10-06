import React from 'react';
import { View, Text, Platform, ViewStyle } from 'react-native';

export interface IconProps {
  size?: number;
  color?: string;
  style?: ViewStyle | ViewStyle[];
}

// Helper to render crisp SVG on web
const renderSvg = (size: number, paths: React.ReactNode, viewBox: string = '0 0 24 24') => {
  if (Platform.OS === 'web') {
    return React.createElement(
      'svg',
      {
        width: size,
        height: size,
        viewBox: viewBox,
        fill: 'none',
        style: { display: 'block' },
      },
      paths
    );
  }
  return null;
};

// 1. Dashboard / Grid Icon
export const IconDashboard: React.FC<IconProps> = ({ size = 22, color = '#FFFFFF', style }) => {
  if (Platform.OS === 'web') {
    return (
      <View style={style}>
        {renderSvg(
          size,
          React.createElement(
            React.Fragment,
            null,
            React.createElement('rect', { x: '3', y: '3', width: '7', height: '7', rx: '2', fill: color }),
            React.createElement('rect', { x: '14', y: '3', width: '7', height: '7', rx: '2', fill: color }),
            React.createElement('rect', { x: '3', y: '14', width: '7', height: '7', rx: '2', fill: color }),
            React.createElement('rect', { x: '14', y: '14', width: '7', height: '7', rx: '2', fill: color })
          )
        )}
      </View>
    );
  }
  return (
    <View style={[{ width: size, height: size, flexWrap: 'wrap', flexDirection: 'row', gap: 3, justifyContent: 'center', alignItems: 'center' }, style]}>
      <View style={{ width: size * 0.35, height: size * 0.35, borderRadius: 2, backgroundColor: color }} />
      <View style={{ width: size * 0.35, height: size * 0.35, borderRadius: 2, backgroundColor: color }} />
      <View style={{ width: size * 0.35, height: size * 0.35, borderRadius: 2, backgroundColor: color }} />
      <View style={{ width: size * 0.35, height: size * 0.35, borderRadius: 2, backgroundColor: color }} />
    </View>
  );
};

// 2. Wallet Icon
export const IconWallet: React.FC<IconProps> = ({ size = 22, color = '#FFFFFF', style }) => {
  if (Platform.OS === 'web') {
    return (
      <View style={style}>
        {renderSvg(
          size,
          React.createElement(
            React.Fragment,
            null,
            React.createElement('path', {
              d: 'M21 7V5a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h15a2 2 0 0 0 2-2v-2',
              stroke: color,
              strokeWidth: '2',
              strokeLinecap: 'round',
              strokeLinejoin: 'round',
            }),
            React.createElement('path', {
              d: 'M16 12h5a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1h-5a1 1 0 0 1-1-1v-2a1 1 0 0 1 1-1z',
              fill: color,
            })
          )
        )}
      </View>
    );
  }
  return (
    <View style={[{ width: size, height: size * 0.78, borderRadius: 4, borderWidth: 2, borderColor: color, justifyContent: 'center', alignItems: 'flex-end', paddingRight: 2 }, style]}>
      <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: color }} />
    </View>
  );
};

// 3. Analytics / Chart Icon
export const IconAnalytics: React.FC<IconProps> = ({ size = 22, color = '#FFFFFF', style }) => {
  if (Platform.OS === 'web') {
    return (
      <View style={style}>
        {renderSvg(
          size,
          React.createElement(
            React.Fragment,
            null,
            React.createElement('path', {
              d: 'M21.21 15.89A10 10 0 1 1 8 2.83',
              stroke: color,
              strokeWidth: '2',
              strokeLinecap: 'round',
            }),
            React.createElement('path', {
              d: 'M22 12A10 10 0 0 0 12 2v10z',
              stroke: color,
              strokeWidth: '2',
              strokeLinecap: 'round',
              strokeLinejoin: 'round',
            })
          )
        )}
      </View>
    );
  }
  return (
    <View style={[{ width: size, height: size, borderRadius: size / 2, borderWidth: 2, borderColor: color, alignItems: 'center', justifyContent: 'center' }, style]}>
      <View style={{ width: size * 0.4, height: size * 0.4, borderRightWidth: 2, borderBottomWidth: 2, borderColor: color }} />
    </View>
  );
};

// 4. Ledger / Book Icon
export const IconLedger: React.FC<IconProps> = ({ size = 22, color = '#FFFFFF', style }) => {
  if (Platform.OS === 'web') {
    return (
      <View style={style}>
        {renderSvg(
          size,
          React.createElement('path', {
            d: 'M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2zm20 0h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z',
            stroke: color,
            strokeWidth: '2',
            strokeLinecap: 'round',
            strokeLinejoin: 'round',
          })
        )}
      </View>
    );
  }
  return (
    <View style={[{ flexDirection: 'row', gap: 2 }, style]}>
      <View style={{ width: size * 0.42, height: size * 0.75, borderTopLeftRadius: 3, borderBottomLeftRadius: 3, borderWidth: 1.8, borderRightWidth: 0, borderColor: color }} />
      <View style={{ width: size * 0.42, height: size * 0.75, borderTopRightRadius: 3, borderBottomRightRadius: 3, borderWidth: 1.8, borderLeftWidth: 0, borderColor: color }} />
    </View>
  );
};

// 5. Users / Friends Icon
export const IconUsers: React.FC<IconProps> = ({ size = 22, color = '#FFFFFF', style }) => {
  if (Platform.OS === 'web') {
    return (
      <View style={style}>
        {renderSvg(
          size,
          React.createElement(
            React.Fragment,
            null,
            React.createElement('path', {
              d: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2',
              stroke: color,
              strokeWidth: '2',
              strokeLinecap: 'round',
            }),
            React.createElement('circle', { cx: '9', cy: '7', r: '4', stroke: color, strokeWidth: '2' }),
            React.createElement('path', {
              d: 'M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75',
              stroke: color,
              strokeWidth: '2',
              strokeLinecap: 'round',
            })
          )
        )}
      </View>
    );
  }
  return (
    <View style={[{ alignItems: 'center' }, style]}>
      <View style={{ width: size * 0.38, height: size * 0.38, borderRadius: size * 0.19, borderWidth: 1.8, borderColor: color, marginBottom: 1 }} />
      <View style={{ width: size * 0.75, height: size * 0.35, borderTopLeftRadius: size * 0.37, borderTopRightRadius: size * 0.37, borderWidth: 1.8, borderBottomWidth: 0, borderColor: color }} />
    </View>
  );
};

// 6. Bell / Notification Icon
export const IconBell: React.FC<IconProps & { hasBadge?: boolean }> = ({ size = 20, color = '#FFFFFF', hasBadge, style }) => {
  if (Platform.OS === 'web') {
    return (
      <View style={[{ position: 'relative' }, style]}>
        {renderSvg(
          size,
          React.createElement(
            React.Fragment,
            null,
            React.createElement('path', {
              d: 'M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9',
              stroke: color,
              strokeWidth: '2',
              strokeLinecap: 'round',
              strokeLinejoin: 'round',
            }),
            React.createElement('path', {
              d: 'M13.73 21a2 2 0 0 1-3.46 0',
              stroke: color,
              strokeWidth: '2',
              strokeLinecap: 'round',
            })
          )
        )}
        {hasBadge && (
          <View
            style={{
              position: 'absolute',
              top: -1,
              right: -1,
              width: 7,
              height: 7,
              borderRadius: 4,
              backgroundColor: '#F43F5E',
              borderWidth: 1.5,
              borderColor: '#0B0F19',
            }}
          />
        )}
      </View>
    );
  }
  return (
    <View style={[{ position: 'relative' }, style]}>
      <Text style={{ fontSize: size * 0.85, color }}>🔔</Text>
      {hasBadge && (
        <View
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            width: 6,
            height: 6,
            borderRadius: 3,
            backgroundColor: '#F43F5E',
          }}
        />
      )}
    </View>
  );
};

// 7. Sparkles / AI Copilot Icon
export const IconSparkles: React.FC<IconProps> = ({ size = 20, color = '#2DD4BF', style }) => {
  if (Platform.OS === 'web') {
    return (
      <View style={style}>
        {renderSvg(
          size,
          React.createElement('path', {
            d: 'm12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3z',
            fill: color,
          })
        )}
      </View>
    );
  }
  return <Text style={[{ fontSize: size * 0.85, color }, style]}>✨</Text>;
};

// 8. Scan QR Icon
export const IconScan: React.FC<IconProps> = ({ size = 20, color = '#FFFFFF', style }) => {
  if (Platform.OS === 'web') {
    return (
      <View style={style}>
        {renderSvg(
          size,
          React.createElement(
            React.Fragment,
            null,
            React.createElement('path', { d: 'M3 7V5a2 2 0 0 1 2-2h2', stroke: color, strokeWidth: '2', strokeLinecap: 'round' }),
            React.createElement('path', { d: 'M17 3h2a2 2 0 0 1 2 2v2', stroke: color, strokeWidth: '2', strokeLinecap: 'round' }),
            React.createElement('path', { d: 'M21 17v2a2 2 0 0 1-2 2h-2', stroke: color, strokeWidth: '2', strokeLinecap: 'round' }),
            React.createElement('path', { d: 'M7 21H5a2 2 0 0 1-2-2v-2', stroke: color, strokeWidth: '2', strokeLinecap: 'round' }),
            React.createElement('line', { x1: '7', y1: '12', x2: '17', y2: '12', stroke: color, strokeWidth: '2', strokeLinecap: 'round' })
          )
        )}
      </View>
    );
  }
  return <Text style={[{ fontSize: size * 0.85, color }, style]}>📷</Text>;
};

// 9. Send / Transfer Icon
export const IconSend: React.FC<IconProps> = ({ size = 20, color = '#FFFFFF', style }) => {
  if (Platform.OS === 'web') {
    return (
      <View style={style}>
        {renderSvg(
          size,
          React.createElement('path', {
            d: 'M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z',
            stroke: color,
            strokeWidth: '2',
            strokeLinecap: 'round',
            strokeLinejoin: 'round',
          })
        )}
      </View>
    );
  }
  return <Text style={[{ fontSize: size * 0.85, color }, style]}>↗️</Text>;
};

// 10. Split Bill Icon
export const IconSplit: React.FC<IconProps> = ({ size = 20, color = '#F97316', style }) => {
  if (Platform.OS === 'web') {
    return (
      <View style={style}>
        {renderSvg(
          size,
          React.createElement(
            React.Fragment,
            null,
            React.createElement('path', { d: 'M16 3h5v5', stroke: color, strokeWidth: '2', strokeLinecap: 'round', strokeLinejoin: 'round' }),
            React.createElement('path', { d: 'M4 20L21 3', stroke: color, strokeWidth: '2', strokeLinecap: 'round', strokeLinejoin: 'round' }),
            React.createElement('path', { d: 'M21 16v5h-5', stroke: color, strokeWidth: '2', strokeLinecap: 'round', strokeLinejoin: 'round' }),
            React.createElement('path', { d: 'M15 15l6 6', stroke: color, strokeWidth: '2', strokeLinecap: 'round', strokeLinejoin: 'round' }),
            React.createElement('path', { d: 'M4 4l5 5', stroke: color, strokeWidth: '2', strokeLinecap: 'round', strokeLinejoin: 'round' })
          )
        )}
      </View>
    );
  }
  return <Text style={[{ fontSize: size * 0.85, color }, style]}>➗</Text>;
};

// 11. Plus / Add Icon
export const IconPlus: React.FC<IconProps> = ({ size = 20, color = '#FFFFFF', style }) => {
  if (Platform.OS === 'web') {
    return (
      <View style={style}>
        {renderSvg(
          size,
          React.createElement(
            React.Fragment,
            null,
            React.createElement('line', { x1: '12', y1: '5', x2: '12', y2: '19', stroke: color, strokeWidth: '2.5', strokeLinecap: 'round' }),
            React.createElement('line', { x1: '5', y1: '12', x2: '19', y2: '12', stroke: color, strokeWidth: '2.5', strokeLinecap: 'round' })
          )
        )}
      </View>
    );
  }
  return <Text style={[{ fontSize: size, color, fontWeight: '700' }, style]}>+</Text>;
};

// 12. Chevron Right
export const IconChevronRight: React.FC<IconProps> = ({ size = 18, color = '#94A3B8', style }) => {
  if (Platform.OS === 'web') {
    return (
      <View style={style}>
        {renderSvg(
          size,
          React.createElement('path', {
            d: 'm9 18 6-6-6-6',
            stroke: color,
            strokeWidth: '2',
            strokeLinecap: 'round',
            strokeLinejoin: 'round',
          })
        )}
      </View>
    );
  }
  return <Text style={[{ fontSize: size, color, fontWeight: '700' }, style]}>›</Text>;
};

// 13. Chevron Left / Back
export const IconChevronLeft: React.FC<IconProps> = ({ size = 18, color = '#94A3B8', style }) => {
  if (Platform.OS === 'web') {
    return (
      <View style={style}>
        {renderSvg(
          size,
          React.createElement('path', {
            d: 'm15 18-6-6 6-6',
            stroke: color,
            strokeWidth: '2',
            strokeLinecap: 'round',
            strokeLinejoin: 'round',
          })
        )}
      </View>
    );
  }
  return <Text style={[{ fontSize: size, color, fontWeight: '700' }, style]}>‹</Text>;
};

// 14. Trend Up Icon
export const IconTrendUp: React.FC<IconProps> = ({ size = 18, color = '#34D399', style }) => {
  if (Platform.OS === 'web') {
    return (
      <View style={style}>
        {renderSvg(
          size,
          React.createElement(
            React.Fragment,
            null,
            React.createElement('polyline', { points: '23 6 13.5 15.5 8.5 10.5 1 18', stroke: color, strokeWidth: '2', strokeLinecap: 'round', strokeLinejoin: 'round' }),
            React.createElement('polyline', { points: '17 6 23 6 23 12', stroke: color, strokeWidth: '2', strokeLinecap: 'round', strokeLinejoin: 'round' })
          )
        )}
      </View>
    );
  }
  return <Text style={[{ fontSize: size, color }, style]}>↗</Text>;
};

// 15. Trend Down Icon
export const IconTrendDown: React.FC<IconProps> = ({ size = 18, color = '#F43F5E', style }) => {
  if (Platform.OS === 'web') {
    return (
      <View style={style}>
        {renderSvg(
          size,
          React.createElement(
            React.Fragment,
            null,
            React.createElement('polyline', { points: '23 18 13.5 8.5 8.5 13.5 1 6', stroke: color, strokeWidth: '2', strokeLinecap: 'round', strokeLinejoin: 'round' }),
            React.createElement('polyline', { points: '17 18 23 18 23 12', stroke: color, strokeWidth: '2', strokeLinecap: 'round', strokeLinejoin: 'round' })
          )
        )}
      </View>
    );
  }
  return <Text style={[{ fontSize: size, color }, style]}>↘</Text>;
};

// 16. Zap / Lightning Icon
export const IconZap: React.FC<IconProps> = ({ size = 18, color = '#FBBF24', style }) => {
  if (Platform.OS === 'web') {
    return (
      <View style={style}>
        {renderSvg(
          size,
          React.createElement('polygon', {
            points: '13 2 3 14 12 14 11 22 21 10 12 10 13 2',
            fill: color,
            stroke: color,
            strokeWidth: '1',
            strokeLinejoin: 'round',
          })
        )}
      </View>
    );
  }
  return <Text style={[{ fontSize: size, color }, style]}>⚡</Text>;
};

// 17. Calendar / Date Icon
export const IconCalendar: React.FC<IconProps> = ({ size = 18, color = '#94A3B8', style }) => {
  if (Platform.OS === 'web') {
    return (
      <View style={style}>
        {renderSvg(
          size,
          React.createElement(
            React.Fragment,
            null,
            React.createElement('rect', { x: '3', y: '4', width: '18', height: '18', rx: '2', ry: '2', stroke: color, strokeWidth: '2' }),
            React.createElement('line', { x1: '16', y1: '2', x2: '16', y2: '6', stroke: color, strokeWidth: '2', strokeLinecap: 'round' }),
            React.createElement('line', { x1: '8', y1: '2', x2: '8', y2: '6', stroke: color, strokeWidth: '2', strokeLinecap: 'round' }),
            React.createElement('line', { x1: '3', y1: '10', x2: '21', y2: '10', stroke: color, strokeWidth: '2' })
          )
        )}
      </View>
    );
  }
  return <Text style={[{ fontSize: size, color }, style]}>📅</Text>;
};

// 18. Cart / Grocery Icon
export const IconCart: React.FC<IconProps> = ({ size = 18, color = '#38BDF8', style }) => {
  if (Platform.OS === 'web') {
    return (
      <View style={style}>
        {renderSvg(
          size,
          React.createElement(
            React.Fragment,
            null,
            React.createElement('circle', { cx: '9', cy: '21', r: '1', fill: color }),
            React.createElement('circle', { cx: '20', cy: '21', r: '1', fill: color }),
            React.createElement('path', {
              d: 'M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6',
              stroke: color,
              strokeWidth: '2',
              strokeLinecap: 'round',
              strokeLinejoin: 'round',
            })
          )
        )}
      </View>
    );
  }
  return <Text style={[{ fontSize: size, color }, style]}>🛒</Text>;
};

// 19. Film / Streaming Icon
export const IconFilm: React.FC<IconProps> = ({ size = 18, color = '#E879F9', style }) => {
  if (Platform.OS === 'web') {
    return (
      <View style={style}>
        {renderSvg(
          size,
          React.createElement(
            React.Fragment,
            null,
            React.createElement('rect', { x: '2', y: '2', width: '20', height: '20', rx: '2.18', ry: '2.18', stroke: color, strokeWidth: '2' }),
            React.createElement('line', { x1: '7', y1: '2', x2: '7', y2: '22', stroke: color, strokeWidth: '2' }),
            React.createElement('line', { x1: '17', y1: '2', x2: '17', y2: '22', stroke: color, strokeWidth: '2' }),
            React.createElement('line', { x1: '2', y1: '12', x2: '22', y2: '12', stroke: color, strokeWidth: '2' })
          )
        )}
      </View>
    );
  }
  return <Text style={[{ fontSize: size, color }, style]}>🎬</Text>;
};

// 20. Coffee / Food Icon
export const IconCoffee: React.FC<IconProps> = ({ size = 18, color = '#F59E0B', style }) => {
  if (Platform.OS === 'web') {
    return (
      <View style={style}>
        {renderSvg(
          size,
          React.createElement(
            React.Fragment,
            null,
            React.createElement('path', { d: 'M18 8h1a4 4 0 0 1 0 8h-1', stroke: color, strokeWidth: '2', strokeLinecap: 'round', strokeLinejoin: 'round' }),
            React.createElement('path', { d: 'M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z', stroke: color, strokeWidth: '2', strokeLinecap: 'round', strokeLinejoin: 'round' }),
            React.createElement('line', { x1: '6', y1: '1', x2: '6', y2: '4', stroke: color, strokeWidth: '2', strokeLinecap: 'round' }),
            React.createElement('line', { x1: '10', y1: '1', x2: '10', y2: '4', stroke: color, strokeWidth: '2', strokeLinecap: 'round' }),
            React.createElement('line', { x1: '14', y1: '1', x2: '14', y2: '4', stroke: color, strokeWidth: '2', strokeLinecap: 'round' })
          )
        )}
      </View>
    );
  }
  return <Text style={[{ fontSize: size, color }, style]}>☕</Text>;
};

// 21. Refresh / Sync Icon
export const IconRefresh: React.FC<IconProps> = ({ size = 18, color = '#38BDF8', style }) => {
  if (Platform.OS === 'web') {
    return (
      <View style={style}>
        {renderSvg(
          size,
          React.createElement(
            React.Fragment,
            null,
            React.createElement('path', { d: 'M23 4v6h-6', stroke: color, strokeWidth: '2', strokeLinecap: 'round', strokeLinejoin: 'round' }),
            React.createElement('path', { d: 'M1 20v-6h6', stroke: color, strokeWidth: '2', strokeLinecap: 'round', strokeLinejoin: 'round' }),
            React.createElement('path', { d: 'M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15', stroke: color, strokeWidth: '2', strokeLinecap: 'round', strokeLinejoin: 'round' })
          )
        )}
      </View>
    );
  }
  return <Text style={[{ fontSize: size, color }, style]}>🔄</Text>;
};

// 22. Shield / Security Icon
export const IconShield: React.FC<IconProps> = ({ size = 18, color = '#34D399', style }) => {
  if (Platform.OS === 'web') {
    return (
      <View style={style}>
        {renderSvg(
          size,
          React.createElement('path', {
            d: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z',
            stroke: color,
            strokeWidth: '2',
            strokeLinecap: 'round',
            strokeLinejoin: 'round',
          })
        )}
      </View>
    );
  }
  return <Text style={[{ fontSize: size, color }, style]}>🛡️</Text>;
};

// 23. Checkmark Icon
export const IconCheck: React.FC<IconProps> = ({ size = 18, color = '#34D399', style }) => {
  if (Platform.OS === 'web') {
    return (
      <View style={style}>
        {renderSvg(
          size,
          React.createElement('polyline', {
            points: '20 6 9 17 4 12',
            stroke: color,
            strokeWidth: '2.5',
            strokeLinecap: 'round',
            strokeLinejoin: 'round',
          })
        )}
      </View>
    );
  }
  return <Text style={[{ fontSize: size, color, fontWeight: '700' }, style]}>✓</Text>;
};

// 24. Cross / Close Icon
export const IconCross: React.FC<IconProps> = ({ size = 18, color = '#FFFFFF', style }) => {
  if (Platform.OS === 'web') {
    return (
      <View style={style}>
        {renderSvg(
          size,
          React.createElement(
            React.Fragment,
            null,
            React.createElement('line', { x1: '18', y1: '6', x2: '6', y2: '18', stroke: color, strokeWidth: '2', strokeLinecap: 'round' }),
            React.createElement('line', { x1: '6', y1: '6', x2: '18', y2: '18', stroke: color, strokeWidth: '2', strokeLinecap: 'round' })
          )
        )}
      </View>
    );
  }
  return <Text style={[{ fontSize: size, color, fontWeight: '700' }, style]}>✕</Text>;
};

// 25. Settings / Gear Icon
export const IconSettings: React.FC<IconProps> = ({ size = 18, color = '#94A3B8', style }) => {
  if (Platform.OS === 'web') {
    return (
      <View style={style}>
        {renderSvg(
          size,
          React.createElement(
            React.Fragment,
            null,
            React.createElement('circle', { cx: '12', cy: '12', r: '3', stroke: color, strokeWidth: '2' }),
            React.createElement('path', {
              d: 'M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z',
              stroke: color,
              strokeWidth: '2',
            })
          )
        )}
      </View>
    );
  }
  return <Text style={[{ fontSize: size, color }, style]}>⚙️</Text>;
};

// 26. Power / Logout Icon
export const IconPower: React.FC<IconProps> = ({ size = 18, color = '#F43F5E', style }) => {
  if (Platform.OS === 'web') {
    return (
      <View style={style}>
        {renderSvg(
          size,
          React.createElement(
            React.Fragment,
            null,
            React.createElement('path', { d: 'M18.36 6.64a9 9 0 1 1-12.73 0', stroke: color, strokeWidth: '2', strokeLinecap: 'round' }),
            React.createElement('line', { x1: '12', y1: '2', x2: '12', y2: '12', stroke: color, strokeWidth: '2', strokeLinecap: 'round' })
          )
        )}
      </View>
    );
  }
  return <Text style={[{ fontSize: size, color }, style]}>⏻</Text>;
};

// 27. Target / Goal Icon
export const IconTarget: React.FC<IconProps> = ({ size = 18, color = '#38BDF8', style }) => {
  if (Platform.OS === 'web') {
    return (
      <View style={style}>
        {renderSvg(
          size,
          React.createElement(
            React.Fragment,
            null,
            React.createElement('circle', { cx: '12', cy: '12', r: '10', stroke: color, strokeWidth: '2' }),
            React.createElement('circle', { cx: '12', cy: '12', r: '6', stroke: color, strokeWidth: '2' }),
            React.createElement('circle', { cx: '12', cy: '12', r: '2', fill: color })
          )
        )}
      </View>
    );
  }
  return <Text style={[{ fontSize: size, color }, style]}>🎯</Text>;
};

// 28. Apple Brand Icon (iOS Native)
export const IconApple: React.FC<IconProps> = ({ size = 20, color = '#FFFFFF', style }) => {
  if (Platform.OS === 'web') {
    return (
      <View style={style}>
        {renderSvg(
          size,
          React.createElement('path', {
            d: 'M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.37c.62-.75 1.04-1.8 0.93-2.85-.9.04-1.99.6-2.63 1.35-.57.65-1.07 1.72-.94 2.74 1 .08 2.02-.49 2.64-1.24z',
            fill: color,
          })
        )}
      </View>
    );
  }
  return <Text style={[{ fontSize: size * 0.9, color, fontWeight: '700' }, style]}></Text>;
};

// 29. Google Brand Icon
export const IconGoogle: React.FC<IconProps> = ({ size = 20, style }) => {
  if (Platform.OS === 'web') {
    return (
      <View style={style}>
        {renderSvg(
          size,
          React.createElement(
            React.Fragment,
            null,
            React.createElement('path', {
              d: 'M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z',
              fill: '#4285F4',
            }),
            React.createElement('path', {
              d: 'M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z',
              fill: '#34A853',
            }),
            React.createElement('path', {
              d: 'M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z',
              fill: '#FBBC05',
            }),
            React.createElement('path', {
              d: 'M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z',
              fill: '#EA4335',
            })
          )
        )}
      </View>
    );
  }
  return <Text style={[{ fontSize: size * 0.85, fontWeight: '700', color: '#4285F4' }, style]}>G</Text>;
};

