import React from 'react';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

interface IconProps {
  size?: number;
  color?: string;
  strokeWidth?: number;
}

export function PinIcon({ size = 14, color = '#6423C9', strokeWidth = 2 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth}>
      <Path d="M12 21s7-7.5 7-12a7 7 0 10-14 0c0 4.5 7 12 7 12z" />
      <Circle cx={12} cy={9} r={2.4} />
    </Svg>
  );
}

export function SearchIcon({ size = 15, color = '#B4A7AC', strokeWidth = 2.2 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth}>
      <Circle cx={11} cy={11} r={7} />
      <Path d="M21 21l-4.3-4.3" />
    </Svg>
  );
}

export function HeartIcon({ size = 12, color = '#6423C9', strokeWidth = 2 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth}>
      <Path d="M20.8 4.6a5.5 5.5 0 00-7.8 0L12 5.6l-1-1a5.5 5.5 0 10-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 000-7.8z" />
    </Svg>
  );
}

export function ClubbingIcon({ size = 26, color = '#FFF', strokeWidth = 1.8 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth}>
      <Circle cx={9} cy={12} r={6} />
      <Circle cx={15} cy={12} r={6} opacity={0.6} />
    </Svg>
  );
}

export function BackChevronIcon({ size = 16, color = '#251C21', strokeWidth = 2.4 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth}>
      <Path d="M15 5l-7 7 7 7" />
    </Svg>
  );
}

export function EmptyCartIcon({ size = 30, color = '#B4A7AC', strokeWidth = 1.8 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth}>
      <Path d="M4 7h16l-1.5 12.5a2 2 0 01-2 1.5H7.5a2 2 0 01-2-1.5L4 7z" />
      <Path d="M9 7V5a3 3 0 016 0v2" />
    </Svg>
  );
}

export function DownloadIcon({ size = 16, color = '#251C21', strokeWidth = 2 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth}>
      <Path d="M12 3v12M8 7l4-4 4 4M5 21h14" />
    </Svg>
  );
}

export function ForkIcon({ size = 18, color = '#6423C9', strokeWidth = 2 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth}>
      <Path d="M7 2v7a2 2 0 002 2v11M12 2v7a2 2 0 01-2 2M17 2c-1.2 1.2-2 3-2 5s1 4 2 5v9" />
    </Svg>
  );
}

export function CheckIcon({ size = 19, color = '#2F7D4F', strokeWidth = 2.6 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth}>
      <Path d="M5 13l4 4L19 7" />
    </Svg>
  );
}

export function BellIcon({ size = 16, color = '#8A6A1F', strokeWidth = 2 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth}>
      <Path d="M6 8a6 6 0 1112 0c0 4 1.5 5.5 1.5 5.5H4.5S6 12 6 8z" />
      <Path d="M10 19a2 2 0 004 0" />
    </Svg>
  );
}

export function NavHomeIcon({ size = 19, color = '#9B8D93', strokeWidth = 2 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth}>
      <Path d="M4 11l8-7 8 7" />
      <Path d="M6 10v9a1 1 0 001 1h3v-6h4v6h3a1 1 0 001-1v-9" />
    </Svg>
  );
}

export function NavOrdersIcon({ size = 19, color = '#9B8D93', strokeWidth = 2 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth}>
      <Rect x={5} y={4} width={14} height={16} rx={2} />
      <Path d="M8.5 9h7M8.5 13h7" />
    </Svg>
  );
}

export function NavCreditsIcon({ size = 19, color = '#9B8D93', strokeWidth = 2 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth}>
      <Rect x={3} y={6} width={18} height={12} rx={2.5} />
      <Path d="M3 10h18" />
    </Svg>
  );
}

export function NavAccountIcon({ size = 19, color = '#9B8D93', strokeWidth = 2 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth}>
      <Circle cx={12} cy={8.2} r={3.2} />
      <Path d="M5 20c0-3.6 3.1-6.2 7-6.2s7 2.6 7 6.2" />
    </Svg>
  );
}

export function PhoneIcon({ size = 16, color = '#FFF', strokeWidth = 2 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth}>
      <Path d="M6.6 10.8a15.7 15.7 0 006.6 6.6l2.2-2.2a1 1 0 011-.25c1.1.36 2.3.56 3.5.56a1 1 0 011 1V20a1 1 0 01-1 1C10.6 21 3 13.4 3 4a1 1 0 011-1h3.5a1 1 0 011 1c0 1.2.2 2.4.56 3.5a1 1 0 01-.25 1l-2.2 2.3z" />
    </Svg>
  );
}

interface StarIconProps extends IconProps {
  filled?: boolean;
}

export function StarIcon({ size = 26, color = '#D99A1F', strokeWidth = 1.6, filled = false }: StarIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? color : 'none'} stroke={color} strokeWidth={strokeWidth}>
      <Path d="M12 2.5l2.9 6.3 6.6.7-5 4.6 1.4 6.6-5.9-3.4-5.9 3.4 1.4-6.6-5-4.6 6.6-.7z" strokeLinejoin="round" />
    </Svg>
  );
}
