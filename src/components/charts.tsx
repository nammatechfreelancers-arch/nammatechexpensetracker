import React from 'react';
import { Text, View } from 'react-native';
import Svg, { Circle, G, Line, Path, Rect } from 'react-native-svg';
import { ThemeTokens } from '../types';
import { ProgressBar, styles } from './ui';

type BarDatum = { label: string; value: number; color?: string };
type TrendDatum = { label: string; income: number; expense: number };

export const MiniBarChart = ({ data, theme }: { data: BarDatum[]; theme: ThemeTokens }) => {
  const max = Math.max(...data.map(item => item.value), 1);
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end', height: 150, gap: 8 }}>
      {data.map((item, index) => (
        <View key={`${item.label}-${index}`} style={{ flex: 1, alignItems: 'center', gap: 8 }}>
          <View
            style={{
              width: '100%',
              height: `${Math.max(8, (item.value / max) * 100)}%`,
              borderRadius: 12,
              backgroundColor: item.color ?? theme.chart[index % theme.chart.length],
            }}
          />
          <Text style={[styles.caption, { color: theme.muted }]}>{item.label}</Text>
        </View>
      ))}
    </View>
  );
};

export const TrendChart = ({ data, theme }: { data: TrendDatum[]; theme: ThemeTokens }) => {
  const width = 310;
  const height = 170;
  const padding = 22;
  const max = Math.max(...data.flatMap(item => [item.income, item.expense]), 1);
  const x = (index: number) => padding + (index / Math.max(data.length - 1, 1)) * (width - padding * 2);
  const y = (value: number) => height - padding - (value / max) * (height - padding * 2);
  const pathFor = (key: 'income' | 'expense') =>
    data
      .map((item, index) => `${index === 0 ? 'M' : 'L'} ${x(index)} ${y(item[key])}`)
      .join(' ');

  return (
    <View style={{ alignItems: 'center' }}>
      <Svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`}>
        {[0, 1, 2, 3].map(line => (
          <Line
            key={line}
            x1={padding}
            x2={width - padding}
            y1={padding + line * 38}
            y2={padding + line * 38}
            stroke={theme.border}
            strokeWidth={1}
          />
        ))}
        <Path d={pathFor('income')} fill="none" stroke={theme.success} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" />
        <Path d={pathFor('expense')} fill="none" stroke={theme.danger} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" />
        {data.map((item, index) => (
          <G key={item.label}>
            <Circle cx={x(index)} cy={y(item.income)} r={4} fill={theme.success} />
            <Circle cx={x(index)} cy={y(item.expense)} r={4} fill={theme.danger} />
          </G>
        ))}
      </Svg>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: '100%', paddingHorizontal: 8 }}>
        {data.map(item => (
          <Text key={item.label} style={[styles.caption, { color: theme.muted }]}>
            {item.label}
          </Text>
        ))}
      </View>
    </View>
  );
};

export const DonutChart = ({
  data,
  theme,
  centerLabel,
}: {
  data: { label: string; value: number; color: string }[];
  theme: ThemeTokens;
  centerLabel: string;
}) => {
  const radius = 54;
  const stroke = 16;
  const circumference = 2 * Math.PI * radius;
  const total = data.reduce((sum, item) => sum + item.value, 0) || 1;
  let offset = 0;

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 18 }}>
      <View style={{ width: 140, height: 140, alignItems: 'center', justifyContent: 'center' }}>
        <Svg width={140} height={140} viewBox="0 0 140 140">
          <Circle cx={70} cy={70} r={radius} stroke={theme.subtle} strokeWidth={stroke} fill="none" />
          {data.map((item, index) => {
            const dash = (item.value / total) * circumference;
            const strokeDashoffset = -offset;
            offset += dash;
            return (
              <Circle
                key={item.label}
                cx={70}
                cy={70}
                r={radius}
                stroke={item.color}
                strokeWidth={stroke}
                fill="none"
                strokeDasharray={`${dash} ${circumference - dash}`}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                rotation="-90"
                origin="70, 70"
              />
            );
          })}
        </Svg>
        <Text style={{ position: 'absolute', color: theme.text, fontSize: 24, fontWeight: '900' }}>{centerLabel}</Text>
      </View>
      <View style={{ flex: 1, gap: 10 }}>
        {data.slice(0, 5).map(item => (
          <View key={item.label} style={{ gap: 4 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8 }}>
              <Text numberOfLines={1} style={{ flex: 1, color: theme.text, fontWeight: '800' }}>
                {item.label}
              </Text>
              <Text style={{ color: theme.muted, fontWeight: '700' }}>{Math.round((item.value / total) * 100)}%</Text>
            </View>
            <ProgressBar value={(item.value / total) * 100} theme={theme} color={item.color} height={6} />
          </View>
        ))}
      </View>
    </View>
  );
};

export const StackedComparison = ({ data, theme }: { data: TrendDatum[]; theme: ThemeTokens }) => {
  const max = Math.max(...data.flatMap(item => [item.income, item.expense]), 1);
  return (
    <Svg width="100%" height={170} viewBox="0 0 320 170">
      {data.map((item, index) => {
        const groupX = 18 + index * 50;
        const incomeHeight = Math.max(4, (item.income / max) * 116);
        const expenseHeight = Math.max(4, (item.expense / max) * 116);
        return (
          <G key={item.label}>
            <Rect x={groupX} y={128 - incomeHeight} width={14} height={incomeHeight} rx={7} fill={theme.success} />
            <Rect x={groupX + 17} y={128 - expenseHeight} width={14} height={expenseHeight} rx={7} fill={theme.danger} />
          </G>
        );
      })}
    </Svg>
  );
};
