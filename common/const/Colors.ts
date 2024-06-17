const GREY_X_DARK = '#191A1E';
const PURPLE = '#9A6AFF';
const OPACITY_33 = '54';

// Please use the full 6-character color syntax, otherwise weird things happen
// when you try to append opacity modifiers, for example the TRANSLUCENT colors
export const Colors = {
  ALERT_LIGHT: '#FDEFEF',
  ALERT: '#EB5757',
  GREEN: '#71BC8F',
  GREY_X_LIGHT: '#F6F6F6',
  GREY_LIGHT: '#DADCE0',
  GREY: '#AAAAAC',
  GREY_DARK: '#76767A',
  GREY_X_DARK,
  ORANGE_LIGHT: '#FBE3D6',
  ORANGE: '#F88D76',
  PURPLE,
  PURPLE_LIGHT: '#D1D0F9',
  PURPLE_DARK: '#5F5EB3',
  BRAND_PURPLE_LIGHT: '#F6F1FF',
  BRAND_PURPLE_DARK: '#9A6AFF',
  BRAND_PURPLE_DARKER: '#6949AC',
  ACID_YELLOW: '#F4FFA0',
  YELLOW: '#F2FFA1',
  BLACK: '#000000',
  WHITE: '#FFFFFF',
  FOCUS: '#CAE3F1',
  TRANSLUCENT_DARK: GREY_X_DARK + OPACITY_33,
  TRANSLUCENT_PURPLE: PURPLE + OPACITY_33,
  TRANSPARENT: 'transparent',
  INHERIT: 'inherit',
  BRAND_PRIMARY: '#121314',
  CONTENT_PRIMARY: '#696A6C',
  CONTENT_SECONDARY: '#97979F',
};

export type Color = keyof typeof Colors;

export function isCordColor(color: string): color is Color {
  return color in Colors;
}

export function withOpacityZero(color: Color) {
  return Colors[color] + '00';
}

/*
  This function receives a color argument that's either one of our standard design system
  color names (see Colors.ts) or otherwise a generic string that we treat as some valid
  CSS color value, and returns the final CSS color value. 
*/
export function cssColorFromColorArgument(
  color: Color | string | undefined,
  defaultColor: Color,
) {
  // if nothing is provided, return the default
  if (!color) {
    return Colors[defaultColor];
  }

  // if it's one of our standard designs system color name, return the associated color
  if (isCordColor(color)) {
    return Colors[color];
  }

  // assume it's a raw color value, like #hex or whatever, and return it directly
  return color;
}
