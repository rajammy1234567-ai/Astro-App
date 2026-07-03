import { Redirect } from 'expo-router';
import { useSelector } from 'react-redux';

export default function Index() {
  const { token, initialized } = useSelector((s) => s.auth);

  if (!initialized) return null;

  return <Redirect href={token ? '/(tabs)/home' : '/(auth)/login'} />;
}