import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { topPadding, bottomPadding, tabBarHeight, tabBarBottomInset, contentPaddingBottom } from '../utils/layout';

export function useScreenInsets() {
  const insets = useSafeAreaInsets();

  return {
    insets,
    top: (extra = 0) => topPadding(insets, extra),
    bottom: (extra = 0) => bottomPadding(insets, extra),
    tabBar: tabBarHeight(insets),
    tabBarBottom: tabBarBottomInset(insets),
    tabBarPadding: (extra = 0) => tabBarHeight(insets) + extra,
    contentBottom: (hasTabBar = false) => contentPaddingBottom(insets, hasTabBar),
  };
}