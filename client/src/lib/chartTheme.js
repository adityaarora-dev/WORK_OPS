import { useTheme } from '../context/ThemeContext';

export const CHART_PALETTE = [
  '#3B82F6', // Cobalt blue
  '#10B981', // Emerald green
  '#F59E0B', // Amber
  '#8B5CF6', // Purple
  '#06B6D4', // Cyan
  '#EC4899', // Pink
  '#6366F1', // Indigo
  '#14B8A6', // Teal
];

export const useChartTheme = () => {
  const { isDark } = useTheme();

  return {
    isDark,
    palette: CHART_PALETTE,
    gridStroke: isDark ? '#1E293B' : '#E2E8F0',
    gridOpacity: isDark ? 0.6 : 0.8,
    axisStroke: isDark ? '#2C3C54' : '#CBD5E1',
    tickFill: isDark ? '#94A3B8' : '#64748B',
    tickFontSize: 11,
    tooltipContentStyle: {
      backgroundColor: isDark ? '#1E2940' : '#FFFFFF',
      borderColor: isDark ? '#2C3C54' : '#E2E8F0',
      borderRadius: '8px',
      color: isDark ? '#F8FAFC' : '#0F172A',
      boxShadow: isDark
        ? '0 10px 25px -5px rgba(0, 0, 0, 0.6), 0 8px 10px -6px rgba(0, 0, 0, 0.6)'
        : '0 10px 25px -5px rgba(15, 23, 42, 0.08), 0 8px 10px -6px rgba(15, 23, 42, 0.04)',
      padding: '8px 12px',
      fontSize: '12px',
      borderWidth: '1px',
      borderStyle: 'solid',
    },
    tooltipItemStyle: {
      color: isDark ? '#CBD5E1' : '#334155',
      fontSize: '12px',
      padding: '2px 0',
    },
    tooltipLabelStyle: {
      color: isDark ? '#F8FAFC' : '#0F172A',
      fontWeight: 600,
      fontSize: '11px',
      marginBottom: '4px',
    },
    legendTextColor: isDark ? '#CBD5E1' : '#475569',
  };
};

export default useChartTheme;
