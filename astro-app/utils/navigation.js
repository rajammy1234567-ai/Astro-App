/**
 * Safe back navigation — avoids "GO_BACK was not handled" when stack is empty.
 */
export function safeGoBack(router, fallback = '/(tabs)/dashboard') {
  try {
    if (typeof router?.canGoBack === 'function' && router.canGoBack()) {
      router.back();
      return;
    }
  } catch {
    // fall through to replace
  }
  router.replace(fallback);
}
