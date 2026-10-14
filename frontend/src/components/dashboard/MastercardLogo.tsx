import React from 'react';
import Svg, { Circle, Rect, G } from 'react-native-svg';

interface MastercardLogoProps {
  width?: number;
  height?: number;
}

export const MastercardLogo: React.FC<MastercardLogoProps> = ({ width = 34, height = 22 }) => {
  return (
    <Svg width={width} height={height} viewBox="0 0 36 22" fill="none">
      <Circle cx="12" cy="11" r="10" fill="#EB001B" />
      <Circle cx="24" cy="11" r="10" fill="#F79E1B" fillOpacity="0.92" />
    </Svg>
  );
};
