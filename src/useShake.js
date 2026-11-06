import { useEffect, useRef, useState } from 'react';
import { AppState, Platform } from 'react-native';
import { Accelerometer } from 'expo-sensors';

export default function useShake(onShake, enabled) {
  const callback = useRef(onShake);
  callback.current = onShake;
  const [status, setStatus] = useState('Toque para ativar o movimento');
  const [active, setActive] = useState(false);
  const [foreground, setForeground] = useState(AppState.currentState === 'active');
  useEffect(() => {
    const sub = AppState.addEventListener('change', state => setForeground(state === 'active'));
    return () => sub.remove();
  }, []);
  async function activate() {
    try {
      if (Platform.OS === 'web') { setStatus('No navegador, use o botão de abrir'); return; }
      const permission = await Accelerometer.requestPermissionsAsync();
      if (!permission.granted || !(await Accelerometer.isAvailableAsync())) {
        setStatus('Sensor indisponível. Use o botão de abrir'); return;
      }
      setActive(true);
      setStatus('Movimento ativado • balance para abrir');
    } catch { setStatus('Não foi possível ativar. Use o botão de abrir'); }
  }
  useEffect(() => {
    if (!active || !enabled || !foreground) return;
    let lastShake = Date.now();
    Accelerometer.setUpdateInterval(100);
    const subscription = Accelerometer.addListener(({ x, y, z }) => {
      const strength = Math.sqrt(x * x + y * y + z * z);
      if (strength > 1.8 && Date.now() - lastShake > 1500) {
        lastShake = Date.now();
        callback.current();
      }
    });
    return () => subscription.remove();
  }, [active, enabled, foreground]);
  return { status, activate };
}
