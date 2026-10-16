import { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { OrderStatus, TABLES, useSession } from '@/context/session-context';

const ink = '#17251f';
const muted = '#7d8982';
const green = '#276b4a';

export default function HomeScreen() {
  const { isHydrated, waiter, signIn, signOut, orders, setOrderStatus } = useSession();
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [filter, setFilter] = useState<'Todos' | OrderStatus>('Todos');
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const visibleOrders = useMemo(() => orders.filter((order) => (filter === 'Todos' || order.status === filter) && (!selectedTable || order.table === selectedTable)), [orders, filter, selectedTable]);

  if (!isHydrated) return null;

  if (!waiter) return (
    <SafeAreaView style={styles.loginRoot}>
      <ScrollView contentContainerStyle={styles.loginContent} keyboardShouldPersistTaps="handled">
        <View style={styles.brandMark}><Text style={styles.brandEmoji}>🍔</Text></View>
        <Text style={styles.eyebrow}>easyOrder · PEDIDOS</Text>
        <Text style={styles.loginTitle}>Todo listo{ '\n' }para servir.</Text>
        <Text style={styles.loginCopy}>Ingresa a tu turno y toma pedidos de forma rápida y clara.</Text>
        <View style={styles.loginCard}>
          <Text style={styles.sectionEyebrow}>ACCESO DE PERSONAL</Text>
          <Text style={styles.label}>Usuario</Text>
          <TextInput value={name} onChangeText={setName} placeholder="Tu nombre de usuario" placeholderTextColor="#a2aaa5" autoCapitalize="none" style={styles.input} />
          <Text style={[styles.label, { marginTop: 16 }]}>Contraseña</Text>
          <TextInput value={password} onChangeText={setPassword} placeholder="••••••••" placeholderTextColor="#a2aaa5" secureTextEntry style={styles.input} />
          <Pressable style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]} onPress={() => {
            if (!name.trim() || !password.trim()) {
              Alert.alert('Completa tus datos', 'Ingresa tu usuario y contraseña para continuar.');
              return;
            }
            signIn(name);
          }}>
            <Text style={styles.primaryButtonText}>Iniciar sesión <Text style={styles.arrow}>→</Text></Text>
          </Pressable>
          <Text style={styles.loginHint}>Acceso para meseros · Admin y cocina próximamente</Text>
        </View>
        <Text style={styles.footerBrand}>HECHO PARA TRABAJAR MEJOR</Text>
      </ScrollView>
    </SafeAreaView>
  );

  const cooking = orders.filter((order) => order.status === 'Pendiente' || order.status === 'En preparación').length;
  const ready = orders.filter((order) => order.status === 'Listo').length;
  return (
    <SafeAreaView style={styles.root}>
      <ScrollView contentContainerStyle={styles.page}>
        <View style={styles.topline}>
          <View><Text style={styles.eyebrow}>easyOrder</Text><Text style={styles.pageTitle}>Pedidos</Text></View>
          <Pressable onPress={signOut} style={styles.avatar}><Text style={styles.avatarText}>{waiter.slice(0, 1).toUpperCase()}</Text></Pressable>
        </View>
        <Text style={styles.greeting}>Hola, {waiter} <Text>👋</Text></Text>
        <Text style={styles.subheading}>Este es el movimiento de tu turno.</Text>
        <View style={styles.statsRow}>
          <View style={[styles.statCard, styles.statHighlight]}><Text style={styles.statLabelLight}>EN COCINA</Text><Text style={styles.statNumberLight}>{cooking.toString().padStart(2, '0')}</Text><Text style={styles.statFootLight}>pedidos activos</Text></View>
          <View style={styles.statCard}><Text style={styles.statLabel}>LISTOS</Text><Text style={styles.statNumber}>{ready.toString().padStart(2, '0')}</Text><Text style={styles.statFoot}>para entregar</Text></View>
        </View>
        <View style={styles.ordersHeader}><View><Text style={styles.sectionEyebrow}>MESAS</Text><Text style={styles.sectionTitle}>Tus 10 mesas</Text></View><Pressable onPress={() => setSelectedTable(null)}><Text style={styles.orderCount}>{selectedTable ? 'Ver todas →' : '10 mesas'}</Text></Pressable></View>
        <View style={styles.tableGrid}>{TABLES.map((table) => {
          const tableOrders = orders.filter((order) => order.table === table);
          const activeOrder = tableOrders.find((order) => order.status !== 'Entregado');
          return <Pressable key={table} onPress={() => setSelectedTable(selectedTable === table ? null : table)} style={[styles.tableCard, selectedTable === table && styles.tableCardSelected, activeOrder && styles.tableCardOccupied]}><View style={styles.tableCardTop}><Text style={styles.tableCardName}>{table.replace('Mesa ', 'M')}</Text><View style={[styles.tableIndicator, activeOrder ? styles.tableIndicatorBusy : styles.tableIndicatorFree]} /></View><Text style={styles.tableCardStatus}>{activeOrder ? activeOrder.status : 'Disponible'}</Text><Text style={styles.tableCardCount}>{tableOrders.length} {tableOrders.length === 1 ? 'pedido' : 'pedidos'}</Text></Pressable>;
        })}</View>
        <View style={styles.ordersHeader}><View><Text style={styles.sectionEyebrow}>SEGUIMIENTO</Text><Text style={styles.sectionTitle}>{selectedTable ? `Pedidos · ${selectedTable}` : 'Pedidos recientes'}</Text></View><Text style={styles.orderCount}>{visibleOrders.length} {visibleOrders.length === 1 ? 'pedido' : 'pedidos'}</Text></View>
        <View style={styles.filters}>{(['Todos', 'Pendiente', 'En preparación', 'Listo', 'Entregado'] as const).map((item) => <Pressable key={item} onPress={() => setFilter(item)} style={[styles.filter, filter === item && styles.filterActive]}><Text style={[styles.filterText, filter === item && styles.filterTextActive]}>{item}</Text></Pressable>)}</View>
        {visibleOrders.length === 0 ? <View style={styles.empty}><Text style={styles.emptyEmoji}>🧾</Text><Text style={styles.emptyTitle}>Aún no hay pedidos</Text><Text style={styles.emptyCopy}>Cuando envíes uno, aparecerá aquí.</Text></View> : visibleOrders.map((order) => (
          <View key={order.id} style={styles.orderCard}>
            <View style={styles.orderTop}><View><Text style={styles.table}>{order.table}</Text><Text style={styles.orderMeta}>#{String(order.id).slice(-3)} · {order.waiter} · {order.createdAt}</Text></View><StatusBadge status={order.status} /></View>
            <View style={styles.divider} />
            {order.items.map((item, index) => <View key={`${item.name}-${index}`} style={styles.orderItem}><Text style={styles.itemQty}>{item.quantity}×</Text><View style={{ flex: 1 }}><Text style={styles.itemName}>{item.name}</Text>{item.details.length > 0 && <Text style={styles.itemDetails}>{item.details.join(' · ')}</Text>}</View></View>)}
            <Text style={styles.changeStatusLabel}>ESTADO DE ELABORACIÓN</Text>
            <View style={styles.statusChoices}>{(['Pendiente', 'En preparación', 'Listo', 'Entregado'] as const).map((status) => <Pressable key={status} accessibilityRole="button" accessibilityState={{ selected: order.status === status }} onPress={() => setOrderStatus(order.id, status)} style={[styles.statusChoice, order.status === status && statusChoiceStyle(status)]}><Text style={[styles.statusChoiceText, order.status === status && statusChoiceTextStyle(status)]}>{status}</Text></Pressable>)}</View>
          </View>
        ))}
        <Text style={styles.footerBrand}>easyOrder · TURNO ACTIVO</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function StatusBadge({ status }: { status: OrderStatus }) {
  const colorStyles = statusBadgeStyles(status);
  return <View style={[styles.statusPill, colorStyles.pill]}><View style={[styles.statusDot, colorStyles.dot]} /><Text style={[styles.statusText, colorStyles.text]}>{status}</Text></View>;
}

function statusBadgeStyles(status: OrderStatus) {
  if (status === 'Pendiente') return { pill: styles.pendingPill, dot: styles.pendingDot, text: styles.pendingText };
  if (status === 'En preparación') return { pill: styles.preparingPill, dot: styles.preparingDot, text: styles.preparingText };
  if (status === 'Listo') return { pill: styles.readyPill, dot: styles.readyDot, text: styles.readyText };
  return { pill: styles.deliveredPill, dot: styles.deliveredDot, text: styles.deliveredText };
}

function statusChoiceStyle(status: OrderStatus) {
  if (status === 'Pendiente') return styles.pendingChoiceActive;
  if (status === 'En preparación') return styles.preparingChoiceActive;
  if (status === 'Listo') return styles.readyChoiceActive;
  return styles.deliveredChoiceActive;
}

function statusChoiceTextStyle(status: OrderStatus) {
  if (status === 'Pendiente') return styles.pendingChoiceTextActive;
  if (status === 'En preparación') return styles.preparingChoiceTextActive;
  if (status === 'Listo') return styles.readyChoiceTextActive;
  return styles.deliveredChoiceTextActive;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f5f5f0' }, page: { width: '100%', maxWidth: 760, alignSelf: 'center', paddingHorizontal: 22, paddingTop: 20, paddingBottom: 42 },
  loginRoot: { flex: 1, backgroundColor: '#f5f5f0' }, loginContent: { width: '100%', maxWidth: 540, alignSelf: 'center', flexGrow: 1, justifyContent: 'center', padding: 26, paddingVertical: 38 },
  brandMark: { width: 56, height: 56, borderRadius: 18, backgroundColor: '#e3eee6', alignItems: 'center', justifyContent: 'center', marginBottom: 26 }, brandEmoji: { fontSize: 28 },
  eyebrow: { color: green, fontSize: 10, fontWeight: '800', letterSpacing: 2.2 }, loginTitle: { color: ink, fontSize: 42, lineHeight: 47, fontWeight: '800', letterSpacing: -1.5, marginTop: 13 }, loginCopy: { color: muted, fontSize: 15, lineHeight: 23, marginTop: 12, maxWidth: 330 },
  loginCard: { marginTop: 34, backgroundColor: '#fff', padding: 22, borderRadius: 22, borderWidth: 1, borderColor: '#e8ebe5' }, sectionEyebrow: { color: '#89958d', fontSize: 9, fontWeight: '800', letterSpacing: 1.7 }, label: { color: ink, fontSize: 12, fontWeight: '700', marginBottom: 8, marginTop: 21 }, input: { height: 49, borderWidth: 1, borderColor: '#e5e9e4', borderRadius: 12, paddingHorizontal: 14, fontSize: 14, color: ink, backgroundColor: '#fbfcfa' },
  primaryButton: { backgroundColor: green, height: 52, borderRadius: 13, alignItems: 'center', justifyContent: 'center', marginTop: 24 }, primaryButtonText: { color: '#fff', fontSize: 14, fontWeight: '800' }, arrow: { fontSize: 18 }, pressed: { opacity: 0.8 }, loginHint: { color: '#97a19a', fontSize: 10, textAlign: 'center', marginTop: 15 }, footerBrand: { textAlign: 'center', color: '#a6afa8', fontSize: 9, fontWeight: '700', letterSpacing: 1.8, marginTop: 30 },
  topline: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, pageTitle: { color: ink, fontSize: 29, fontWeight: '800', letterSpacing: -0.7, marginTop: 4 }, avatar: { width: 42, height: 42, borderRadius: 15, backgroundColor: green, alignItems: 'center', justifyContent: 'center' }, avatarText: { color: 'white', fontWeight: '800', fontSize: 16 }, greeting: { color: ink, fontSize: 19, fontWeight: '700', marginTop: 24 }, subheading: { color: muted, fontSize: 12, marginTop: 5 },
  statsRow: { flexDirection: 'row', gap: 12, marginTop: 22 }, statCard: { flex: 1, minHeight: 126, borderRadius: 18, padding: 17, backgroundColor: '#fff', borderWidth: 1, borderColor: '#e8ebe5' }, statHighlight: { backgroundColor: green, borderColor: green }, statLabel: { color: '#89958d', fontSize: 9, fontWeight: '800', letterSpacing: 1.3 }, statLabelLight: { color: '#d4e4d8', fontSize: 9, fontWeight: '800', letterSpacing: 1.3 }, statNumber: { color: ink, fontSize: 35, fontWeight: '800', marginTop: 9, lineHeight: 40 }, statNumberLight: { color: '#fff', fontSize: 35, fontWeight: '800', marginTop: 9, lineHeight: 40 }, statFoot: { color: muted, fontSize: 10 }, statFootLight: { color: '#c8dbce', fontSize: 10 },
  ordersHeader: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: 32 }, sectionTitle: { color: ink, fontSize: 20, fontWeight: '800', marginTop: 5 }, orderCount: { color: muted, fontSize: 11, marginBottom: 3 }, tableGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 9, marginTop: 13 }, tableCard: { width: '31%', flexGrow: 1, minWidth: 96, borderRadius: 14, backgroundColor: '#fff', borderWidth: 1, borderColor: '#e8ebe5', padding: 11 }, tableCardSelected: { borderColor: green, backgroundColor: '#e9f2eb' }, tableCardOccupied: { borderColor: '#ead8b7' }, tableCardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, tableCardName: { color: ink, fontSize: 12, fontWeight: '800' }, tableIndicator: { width: 7, height: 7, borderRadius: 4 }, tableIndicatorBusy: { backgroundColor: '#d38b19' }, tableIndicatorFree: { backgroundColor: '#7eaa8c' }, tableCardStatus: { color: '#536159', fontSize: 9, fontWeight: '700', marginTop: 8 }, tableCardCount: { color: muted, fontSize: 9, marginTop: 3 }, filters: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14, marginBottom: 8 }, filter: { paddingHorizontal: 12, paddingVertical: 8, backgroundColor: '#ecefe9', borderRadius: 30 }, filterActive: { backgroundColor: ink }, filterText: { color: '#69766e', fontSize: 10, fontWeight: '700' }, filterTextActive: { color: '#fff' },
  orderCard: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#e8ebe5', borderRadius: 17, padding: 16, marginTop: 10 }, orderTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, table: { color: ink, fontSize: 15, fontWeight: '800' }, orderMeta: { color: muted, fontSize: 10, marginTop: 4 }, statusPill: { paddingHorizontal: 9, paddingVertical: 6, borderRadius: 20, flexDirection: 'row', alignItems: 'center', gap: 5 }, pendingPill: { backgroundColor: '#fff1d9' }, preparingPill: { backgroundColor: '#e8efff' }, readyPill: { backgroundColor: '#e3f2e8' }, deliveredPill: { backgroundColor: '#edf0ed' }, statusDot: { width: 6, height: 6, borderRadius: 4 }, pendingDot: { backgroundColor: '#d38b19' }, preparingDot: { backgroundColor: '#5277ca' }, readyDot: { backgroundColor: '#2c8555' }, deliveredDot: { backgroundColor: '#78847b' }, statusText: { fontSize: 9, fontWeight: '800' }, pendingText: { color: '#98610d' }, preparingText: { color: '#3f5fa8' }, readyText: { color: '#276b4a' }, deliveredText: { color: '#647067' }, divider: { height: 1, backgroundColor: '#edf0eb', marginVertical: 13 }, orderItem: { flexDirection: 'row', gap: 9, marginBottom: 9 }, itemQty: { width: 22, color: green, fontSize: 11, fontWeight: '800', paddingTop: 1 }, itemName: { color: ink, fontSize: 12, fontWeight: '700' }, itemDetails: { color: muted, fontSize: 10, lineHeight: 15, marginTop: 3 }, changeStatusLabel: { color: '#89958d', fontSize: 8, fontWeight: '800', letterSpacing: 1.2, marginTop: 5, marginBottom: 8 }, statusChoices: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 }, statusChoice: { borderRadius: 8, paddingHorizontal: 9, paddingVertical: 7, backgroundColor: '#f3f5f1', borderWidth: 1, borderColor: '#edf0eb' }, statusChoiceText: { color: '#69766e', fontSize: 9, fontWeight: '700' }, pendingChoiceActive: { backgroundColor: '#fff1d9', borderColor: '#e9c985' }, preparingChoiceActive: { backgroundColor: '#e8efff', borderColor: '#b8c8f0' }, readyChoiceActive: { backgroundColor: '#e3f2e8', borderColor: '#a6d0b3' }, deliveredChoiceActive: { backgroundColor: '#edf0ed', borderColor: '#cdd4ce' }, pendingChoiceTextActive: { color: '#98610d' }, preparingChoiceTextActive: { color: '#3f5fa8' }, readyChoiceTextActive: { color: '#276b4a' }, deliveredChoiceTextActive: { color: '#647067' }, empty: { backgroundColor: '#fff', borderRadius: 18, alignItems: 'center', padding: 28, marginTop: 12 }, emptyEmoji: { fontSize: 26 }, emptyTitle: { color: ink, fontSize: 14, fontWeight: '800', marginTop: 8 }, emptyCopy: { color: muted, fontSize: 11, marginTop: 4 },
});
