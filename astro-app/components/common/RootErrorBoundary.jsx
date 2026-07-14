import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { COLORS } from '../../constants/colors';

export default class RootErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null, info: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    this.setState({ info });
    console.error('[RootErrorBoundary]', error, info?.componentStack);
  }

  handleRetry = () => {
    this.setState({ error: null, info: null });
  };

  render() {
    if (this.state.error) {
      const msg = this.state.error?.message || String(this.state.error);
      return (
        <View style={styles.wrap}>
          <Text style={styles.title}>App error</Text>
          <Text style={styles.sub}>
            Partner app crash ho gayi — Retry try karo. Agar phir bhi band ho to naya APK (v1.0.1+) install karo.
          </Text>
          <ScrollView style={styles.box}>
            <Text style={styles.msg}>{msg}</Text>
            {!!this.state.info?.componentStack && (
              <Text style={styles.stack}>{this.state.info.componentStack.slice(0, 800)}</Text>
            )}
          </ScrollView>
          <TouchableOpacity style={styles.btn} onPress={this.handleRetry}>
            <Text style={styles.btnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    backgroundColor: COLORS.background || '#1E1033',
    padding: 24,
    justifyContent: 'center',
  },
  title: { fontSize: 22, fontWeight: '800', color: '#fff', marginBottom: 8 },
  sub: { fontSize: 14, color: 'rgba(255,255,255,0.75)', marginBottom: 16, lineHeight: 20 },
  box: {
    maxHeight: 220,
    backgroundColor: 'rgba(0,0,0,0.35)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  msg: { color: COLORS.primary || '#FDB913', fontSize: 13, fontWeight: '600' },
  stack: { color: 'rgba(255,255,255,0.65)', fontSize: 11, marginTop: 10 },
  btn: {
    backgroundColor: COLORS.primary || '#FDB913',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  btnText: { fontWeight: '800', color: '#1E1033', fontSize: 16 },
});
