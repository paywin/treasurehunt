import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Image, Modal, Pressable, ScrollView, Text, View, useWindowDimensions } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { openChest, collect, emptyProgress, weapons, bonuses, token } from './src/loot';
import { fetchPirate } from './src/api';
import useShake from './src/useShake';
import styles from './src/styles';

const KEY = '@treasurehunt/progress-v1';
const colors = { Comum: '#81dba6', Raro: '#68baff', Épico: '#c698ff', Lendário: '#ffca64', Supremo: '#ffe4a0' };
const allItems = [...weapons, ...bonuses, token];
function Button({ title, onPress, secondary, disabled }) {
  return <Pressable accessibilityRole="button" accessibilityState={{ disabled: !!disabled }} onPress={onPress} disabled={disabled}
    style={({ pressed }) => [styles.button, secondary && styles.secondary, { opacity: disabled ? 0.5 : pressed ? 0.75 : 1 }]}>
    <Text style={[styles.buttonText, secondary && { color: '#d9e2ef' }]}>{title}</Text>
  </Pressable>;
}
function Item({ item, count }) {
  return <View style={[styles.item, { borderColor: colors[item.rarity] + '66' }]}>
    <Text style={styles.itemEmoji}>{item.emoji}</Text><Text style={[styles.label, { color: colors[item.rarity] }]}>{item.rarity.toUpperCase()}</Text>
    <Text style={styles.itemName}>{item.name}</Text>
    {count !== undefined && <Text style={styles.muted}>{count > 0 ? `${count} na coleção` : 'Não encontrado'}</Text>}
  </View>;
}
export default function App() {
  const { width, height } = useWindowDimensions();
  const chestWidth = Math.min(width - 40, 400);
  const chestHeight = Math.min(230, height * 0.28);
  const [tab, setTab] = useState('hunt');
  const [progress, setProgress] = useState(emptyProgress);
  const [ready, setReady] = useState(false);
  const [storageError, setStorageError] = useState('');
  const [busy, setBusy] = useState(false);
  const [drops, setDrops] = useState(null);
  const [pirate, setPirate] = useState(null);
  const [apiState, setApiState] = useState('loading');
  // A trava bloqueia eventos repetidos antes da próxima renderização.
  const locked = useRef(false);
  const animation = useRef(new Animated.Value(0)).current;
  const saveQueue = useRef(Promise.resolve());
  useEffect(() => {
    AsyncStorage.getItem(KEY).then(raw => {
      if (!raw) return;
      const saved = JSON.parse(raw);
      if (!Number.isSafeInteger(saved.opened) || saved.opened < 0 || !saved.items || typeof saved.items !== 'object' || Array.isArray(saved.items)
        || Object.values(saved.items).some(n => !Number.isSafeInteger(n) || n < 0)) throw new Error('Dados inválidos');
      setProgress(saved);
    }).catch(() => setStorageError('Não foi possível recuperar sua coleção. Esta sessão começa do zero.')).finally(() => setReady(true));
  }, []);
  useEffect(() => {
    if (!ready) return;
    // Gravações em sequência evitam que dados antigos substituam os novos.
    saveQueue.current = saveQueue.current.then(() => AsyncStorage.setItem(KEY, JSON.stringify(progress)))
      .catch(() => setStorageError('Não foi possível salvar. Seu progresso pode ser perdido ao fechar o app.'));
  }, [progress, ready]);
  async function loadPirate() {
    setApiState('loading');
    try { setPirate(await fetchPirate()); setApiState('success'); }
    catch { setApiState('error'); }
  }
  useEffect(() => { loadPirate(); }, []);
  useEffect(() => () => animation.stopAnimation(), [animation]);
  function handleOpen() {
    if (!ready || locked.current || tab !== 'hunt') return;
    locked.current = true;
    setBusy(true);
    Animated.sequence([
      ...Array.from({ length: 6 }, (_, i) => Animated.timing(animation, { toValue: i % 2 ? -1 : 1, duration: 100, useNativeDriver: true })),
      Animated.timing(animation, { toValue: 0, duration: 120, useNativeDriver: true }),
    ]).start(({ finished }) => {
      if (!finished) return;
      const result = openChest();
      setProgress(current => collect(current, result));
      setDrops(result);
      setBusy(false);
    });
  }
  function closeResult() { setDrops(null); locked.current = false; }
  const shake = useShake(handleOpen, ready && !busy && !drops && tab === 'hunt');
  const found = allItems.filter(item => progress.items[item.id]).length;
  return <SafeAreaProvider><SafeAreaView style={styles.safe}>
    <StatusBar style="light" />
    <ScrollView contentContainerStyle={styles.page}>
      <View style={styles.header}><Text style={styles.brand}>Treasure Hunt</Text></View>
      <View style={styles.tabs}>{[['hunt', 'Baú'], ['collection', 'Coleção']].map(([id, label]) =>
        <Pressable key={id} accessibilityRole="tab" accessibilityState={{ selected: tab === id, disabled: busy }} disabled={busy} onPress={() => setTab(id)} style={[styles.tab, tab === id && styles.tabActive]}><Text style={[styles.tabText, tab === id && { color: '#ffda86' }]}>{label}</Text></Pressable>)}</View>
      {storageError ? <Text accessibilityRole="alert" style={styles.warning}>{storageError}</Text> : null}
      <View style={styles.stats}>{[[progress.opened, 'baús abertos'], [found, 'itens diferentes'], [progress.items[token.id] || 0, 'tokens']].map(([value, label]) => <View key={label} style={styles.stat}><Text style={styles.statValue}>{value}</Text><Text style={styles.statLabel}>{label}</Text></View>)}</View>
      {tab === 'hunt' ? <>
        <View style={styles.hero}>
          <Text style={styles.title}>Baú pirata</Text>
          <Text style={styles.subtitle}>Uma arma por abertura. O resto é sorte.</Text>
          <Animated.View style={{ alignSelf: 'center', width: chestWidth, height: chestHeight, transform: [{ rotate: animation.interpolate({ inputRange: [-1, 1], outputRange: ['-4deg', '4deg'] }) }] }}>
            <Image source={require('./assets/chest.png')} style={styles.chest} resizeMode="contain" accessibilityLabel="Baú pirata dourado com joias e fechadura de caveira" />
          </Animated.View>
          <View style={styles.odds}><Text style={styles.itemName}>Token pirata</Text><Text style={styles.muted}>1 em 100.000</Text></View>
          <Button title={busy ? 'Abrindo o baú…' : ready ? 'Abrir baú' : 'Carregando coleção…'} onPress={handleOpen} disabled={!ready || busy || !!drops} />
          <Button title="Usar movimento do celular" onPress={shake.activate} secondary />
          <Text style={styles.sensor}>{shake.status}</Text>
        </View>
        <View style={styles.rules}><Text style={styles.sectionTitle}>Como funciona</Text><Text style={styles.muted}>Sempre vem uma arma. Há também 35% de chance de um item extra e 0,001% de chance do token pirata.</Text></View>
        <View style={styles.apiCard}>
          <Text style={styles.label}>PERSONAGEM EM DESTAQUE</Text>
          {apiState === 'loading' ? <View style={styles.apiLoading}><ActivityIndicator color="#ffda86" /><Text style={styles.muted}>Carregando personagem…</Text></View>
            : apiState === 'error' ? <><Text style={styles.itemName}>Não foi possível carregar o personagem.</Text><Text style={styles.muted}>Não foi possível carregar a API. Você ainda pode abrir baús.</Text><Button title="Tentar novamente" onPress={loadPirate} secondary /></>
              : <View style={styles.apiContent}><Image source={{ uri: pirate.image }} style={styles.pirate} accessibilityLabel={pirate.name} /><View style={{ flex: 1 }}><Text style={styles.sectionTitle}>{pirate.name}</Text><Text style={styles.muted}>{pirate.description}</Text><Text style={styles.apiNote}>Fonte: Fortnite-API · fora do sorteio</Text></View></View>}
        </View>
      </> : <>
        <Text style={styles.title}>Sua coleção</Text><Text style={styles.subtitle}>{found} de {allItems.length} itens encontrados.</Text>
        {!progress.opened && <View style={styles.apiCard}><Text style={styles.itemName}>Nenhum item ainda.</Text><Text style={styles.muted}>Abra um baú para começar sua coleção.</Text><Button title="Ir para o baú" onPress={() => setTab('hunt')} /></View>}
        <View style={styles.grid}>{allItems.map(item => <Item key={item.id} item={item} count={progress.items[item.id] || 0} />)}</View>
      </>}
    </ScrollView>
    <Modal visible={!!drops} transparent animationType="fade" onRequestClose={closeResult}>
      <View style={styles.overlay}><View style={styles.modal}><ScrollView contentContainerStyle={{ gap: 16 }}>
        <Text style={styles.label}>RESULTADO</Text><Text style={styles.title}>{drops?.some(item => item.id === token.id) ? 'Você encontrou o token!' : 'Você recebeu'}</Text>
        <Text style={styles.muted}>Os itens já foram adicionados à sua coleção.</Text>
        <View style={styles.grid}>{drops?.map(item => <Item key={item.id} item={item} />)}</View>
        <Button title="Continuar" onPress={closeResult} />
      </ScrollView></View></View>
    </Modal>
  </SafeAreaView></SafeAreaProvider>;
}
