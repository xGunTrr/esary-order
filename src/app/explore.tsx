import { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { TABLES, useSession } from '@/context/session-context';

type Category = 'Broaster' | 'Hamburguesas' | 'Alitas BBQ' | 'Bebidas';
const categories: { title: Category; subtitle: string; icon: string }[] = [
  { title: 'Hamburguesas', subtitle: 'Carne o pollo', icon: '🍔' },
  { title: 'Broaster', subtitle: 'Piezas de pollo', icon: '🍗' },
  { title: 'Alitas BBQ', subtitle: '6 o 12 alitas', icon: '🍖' },
  { title: 'Bebidas', subtitle: 'Gaseosas frías', icon: '🥤' },
];
const parts = ['Pecho', 'Pierna', 'Ala', 'Entrepierna', 'Cuello'];
const flavors = ['BBQ clásico', 'Acevichado', 'Anticuchero', 'Picante'];
const creams = ['Mayonesa', 'Mostaza', 'Ketchup', 'Ají', 'Golf'];
const drinkSizes = ['150 ml', '250 ml', '1 L', '2 L'];
const drinks = ['Inka Cola', 'Coca Cola', 'Fanta', 'Pepsi'];
const ink = '#17251f'; const green = '#276b4a'; const muted = '#7d8982';

export default function ExploreScreen() {
  const { addOrder, drafts, isHydrated, orders, setDraftItems } = useSession();
  const [category, setCategory] = useState<Category>('Hamburguesas');
  const [variant, setVariant] = useState('Carne');
  const [flavor, setFlavor] = useState(flavors[0]);
  const [wingSize, setWingSize] = useState('6 alitas');
  const [drink, setDrink] = useState(drinks[0]);
  const [drinkSize, setDrinkSize] = useState('1 L');
  const [quantity, setQuantity] = useState(1);
  const [toppings, setToppings] = useState<string[]>(['Papas fritas']);
  const [selectedCreams, setSelectedCreams] = useState<string[]>([]);
  const [table, setTable] = useState(TABLES[0]);
  const draft = drafts[table] ?? [];

  const productName = useMemo(() => {
    if (category === 'Hamburguesas') return `Hamburguesa de ${variant.toLowerCase()}`;
    if (category === 'Broaster') return `Pollo broaster · ${variant}`;
    if (category === 'Alitas BBQ') return `Alitas BBQ · ${flavor} · ${wingSize}`;
    return `${drink} ${drinkSize}`;
  }, [category, variant, flavor, wingSize, drink, drinkSize]);

  if (!isHydrated) return null;

  const chooseCategory = (value: Category) => {
    setCategory(value);
    setVariant(value === 'Broaster' ? parts[0] : 'Carne');
    setToppings(value === 'Hamburguesas' || value === 'Broaster' ? ['Papas fritas'] : []);
    setSelectedCreams([]);
    setQuantity(1);
  };
  const toggle = (values: string[], setValues: (values: string[]) => void, value: string) => setValues(values.includes(value) ? values.filter((item) => item !== value) : [...values, value]);

  const addCurrentItem = () => {
    const details = category === 'Bebidas' ? [] : category === 'Alitas BBQ' ? selectedCreams.length ? [`Cremas: ${selectedCreams.join(', ')}`] : ['Sin cremas'] : [
      ...((category === 'Hamburguesas' || category === 'Broaster') ? [toppings.length ? toppings.join(' + ') : 'Sin papas ni ensalada'] : []),
      selectedCreams.length ? `Cremas: ${selectedCreams.join(', ')}` : 'Sin cremas',
    ];
    setDraftItems(table, [...draft, { name: productName, details, quantity }]);
    setSelectedCreams([]);
    setQuantity(1);
  };

  const sendOrder = () => {
    if (draft.length === 0) { Alert.alert('Pedido vacío', `Agrega al menos un producto para ${table}.`); return; }
    addOrder(table, draft);
    Alert.alert('Pedido enviado', `El pedido de ${table} ya está en cocina.`);
    setDraftItems(table, []);
  };

  return (
    <SafeAreaView style={styles.root}>
      <ScrollView contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled">
        <View style={styles.header}><View><Text style={styles.eyebrow}>TOMA DE PEDIDO</Text><Text style={styles.title}>Nuevo pedido</Text></View><View style={styles.stepBadge}><Text style={styles.stepText}>●  EN VIVO</Text></View></View>
        <Text style={styles.subtitle}>Elige una mesa y personaliza sus productos al gusto.</Text>

        <Text style={styles.sectionEyebrow}>01 · SELECCIONA LA MESA</Text>
        <View style={styles.tablesGrid}>{TABLES.map((item) => {
          const tableOrders = orders.filter((order) => order.table === item);
          const activeOrders = tableOrders.filter((order) => order.status !== 'Entregado').length;
          return <Pressable key={item} onPress={() => setTable(item)} style={[styles.tableTile, table === item && styles.tableTileActive, activeOrders > 0 && styles.tableTileOccupied]}><Text style={[styles.tableTileName, table === item && styles.tableTileNameActive]}>{item.replace('Mesa ', 'M')}</Text><Text style={styles.tableTileCount}>{activeOrders > 0 ? `${activeOrders} activo${activeOrders === 1 ? '' : 's'}` : 'Libre'}</Text></Pressable>;
        })}</View>
        <Text style={styles.selectedTableNote}>Pedido independiente para <Text style={styles.selectedTableName}>{table}</Text>{draft.length > 0 ? ` · ${draft.length} producto${draft.length === 1 ? '' : 's'} en curso` : ''}</Text>

        <Text style={styles.sectionEyebrow}>02 · ELIGE UNA CATEGORÍA</Text>
        <View style={styles.categoryGrid}>{categories.map((item) => <Pressable key={item.title} onPress={() => chooseCategory(item.title)} style={[styles.categoryCard, category === item.title && styles.categorySelected]}><Text style={styles.categoryIcon}>{item.icon}</Text><Text style={[styles.categoryTitle, category === item.title && styles.categoryTitleSelected]}>{item.title}</Text><Text style={styles.categorySubtitle}>{item.subtitle}</Text></Pressable>)}</View>

        <View style={styles.configCard}>
          <View style={styles.configHeader}><Text style={styles.sectionEyebrow}>03 · PERSONALIZA</Text><Text style={styles.configIcon}>{categories.find((item) => item.title === category)?.icon}</Text></View>
          <Text style={styles.configTitle}>{category === 'Broaster' ? 'Elige tu pieza' : category === 'Hamburguesas' ? '¿De qué la preparamos?' : category === 'Alitas BBQ' ? 'Arma tus alitas' : 'Elige tu bebida'}</Text>
          {category === 'Hamburguesas' && <OptionGroup label="TIPO DE HAMBURGUESA" values={['Carne', 'Pollo']} selected={[variant]} onPress={setVariant} />}
          {category === 'Broaster' && <OptionGroup label="PIEZA DE POLLO" values={parts} selected={[variant]} onPress={setVariant} />}
          {category === 'Hamburguesas' && <OptionGroup label="ACOMPAÑAMIENTOS" helper="Papas incluidas por defecto" values={['Papas fritas', 'Ensalada', 'Huevo frito']} selected={toppings} onPress={(value) => toggle(toppings, setToppings, value)} multi />}
          {category === 'Broaster' && <OptionGroup label="ACOMPAÑAMIENTOS" helper="Papas incluidas por defecto" values={['Papas fritas', 'Ensalada']} selected={toppings} onPress={(value) => toggle(toppings, setToppings, value)} multi />}
          {category === 'Alitas BBQ' && <><OptionGroup label="SABOR" values={flavors} selected={[flavor]} onPress={setFlavor} /><OptionGroup label="TAMAÑO DEL COMBO" values={['6 alitas', '12 alitas']} selected={[wingSize]} onPress={setWingSize} /></>}
          {category === 'Bebidas' && <><OptionGroup label="GASEOSA" values={drinks} selected={[drink]} onPress={setDrink} /><OptionGroup label="PRESENTACIÓN" values={drinkSizes} selected={[drinkSize]} onPress={setDrinkSize} /></>}
          {category !== 'Bebidas' && <OptionGroup label="CREMAS" helper="Puedes elegir varias" values={creams} selected={selectedCreams} onPress={(value) => toggle(selectedCreams, setSelectedCreams, value)} multi />}
          {category === 'Bebidas' && <View style={styles.quantityRow}><Text style={styles.optionLabel}>CANTIDAD</Text><Quantity value={quantity} setValue={setQuantity} /></View>}
          {category !== 'Bebidas' && <View style={styles.quantityRow}><Text style={styles.optionLabel}>CANTIDAD</Text><Quantity value={quantity} setValue={setQuantity} /></View>}
          <View style={styles.productPreview}><Text style={styles.previewLabel}>SE AGREGARÁ</Text><Text style={styles.previewName}>{quantity}× {productName}</Text></View>
          <Pressable onPress={addCurrentItem} style={({ pressed }) => [styles.addButton, pressed && styles.pressed]}><Text style={styles.addButtonText}>＋ Agregar al pedido</Text></Pressable>
        </View>

        <View style={styles.draftHeader}><View><Text style={styles.sectionEyebrow}>04 · CONFIRMA</Text><Text style={styles.sectionTitle}>Pedido · {table}</Text></View><Text style={styles.draftCount}>{draft.length} {draft.length === 1 ? 'producto' : 'productos'}</Text></View>
        <View style={styles.draftCard}>
          {draft.length === 0 ? <View style={styles.draftEmpty}><Text style={styles.draftEmptyIcon}>🧾</Text><Text style={styles.draftEmptyText}>Tu pedido aparecerá aquí</Text></View> : draft.map((item, index) => <View key={`${item.name}-${index}`} style={styles.draftItem}><View style={styles.draftBullet}><Text style={styles.draftBulletText}>{item.quantity}</Text></View><View style={{ flex: 1 }}><Text style={styles.draftItemName}>{item.name}</Text>{item.details.length > 0 && <Text style={styles.draftItemDetails}>{item.details.join(' · ')}</Text>}</View><Pressable hitSlop={10} onPress={() => setDraftItems(table, draft.filter((_, itemIndex) => itemIndex !== index))}><Text style={styles.remove}>×</Text></Pressable></View>)}
          <Pressable onPress={sendOrder} style={[styles.sendButton, draft.length === 0 && styles.sendDisabled]}><Text style={styles.sendButtonText}>Enviar a cocina <Text style={styles.sendArrow}>→</Text></Text></Pressable>
          <Text style={styles.sendHint}>La cocina verá el pedido apenas lo envíes.</Text>
        </View>
        <Text style={styles.footer}>easyOrder · BUEN PROVECHO</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function OptionGroup({ label, helper, values, selected, onPress, multi }: { label: string; helper?: string; values: string[]; selected: string[]; onPress: (value: string) => void; multi?: boolean }) {
  return <View style={styles.optionGroup}><View style={styles.optionHeader}><Text style={styles.optionLabel}>{label}</Text>{helper && <Text style={styles.optionHelper}>{helper}</Text>}</View><View style={styles.optionWrap}>{values.map((value) => { const active = selected.includes(value); return <Pressable key={value} onPress={() => onPress(value)} style={[styles.option, active && styles.optionActive]}><Text style={[styles.optionText, active && styles.optionTextActive]}>{multi && active ? '✓ ' : ''}{value}</Text></Pressable>; })}</View></View>;
}

function Quantity({ value, setValue }: { value: number; setValue: (value: number) => void }) {
  return <View style={styles.quantity}><Pressable onPress={() => setValue(Math.max(1, value - 1))} style={styles.quantityButton}><Text style={styles.quantitySymbol}>−</Text></Pressable><Text style={styles.quantityValue}>{value}</Text><Pressable onPress={() => setValue(value + 1)} style={styles.quantityButton}><Text style={styles.quantitySymbol}>＋</Text></Pressable></View>;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f5f5f0' }, page: { width: '100%', maxWidth: 760, alignSelf: 'center', paddingHorizontal: 20, paddingTop: 19, paddingBottom: 42 }, header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, eyebrow: { color: green, fontSize: 9, fontWeight: '800', letterSpacing: 2 }, title: { color: ink, fontSize: 29, fontWeight: '800', letterSpacing: -0.7, marginTop: 4 }, stepBadge: { paddingHorizontal: 10, paddingVertical: 7, backgroundColor: '#e4f1e7', borderRadius: 30 }, stepText: { color: green, fontSize: 8, fontWeight: '800', letterSpacing: 0.5 }, subtitle: { color: muted, fontSize: 12, marginTop: 6, marginBottom: 22 }, sectionEyebrow: { color: '#89958d', fontSize: 9, fontWeight: '800', letterSpacing: 1.4 }, tablesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginTop: 11, marginBottom: 8 }, tableTile: { width: '18%', flexGrow: 1, minWidth: 55, paddingVertical: 9, paddingHorizontal: 6, borderRadius: 11, alignItems: 'center', backgroundColor: '#fff', borderWidth: 1, borderColor: '#e8ebe5' }, tableTileActive: { backgroundColor: '#e5f0e8', borderColor: green }, tableTileOccupied: { borderColor: '#e5ca96' }, tableTileName: { color: ink, fontSize: 11, fontWeight: '800' }, tableTileNameActive: { color: green }, tableTileCount: { color: muted, fontSize: 8, marginTop: 3 }, selectedTableNote: { color: muted, fontSize: 10, marginBottom: 21 }, selectedTableName: { color: green, fontWeight: '800' }, categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 12, marginBottom: 23 }, categoryCard: { width: '48%', flexGrow: 1, minWidth: 140, padding: 14, borderRadius: 15, backgroundColor: '#fff', borderWidth: 1, borderColor: '#e8ebe5' }, categorySelected: { backgroundColor: '#e9f2eb', borderColor: green }, categoryIcon: { fontSize: 23, marginBottom: 8 }, categoryTitle: { color: ink, fontSize: 12, fontWeight: '800' }, categoryTitleSelected: { color: green }, categorySubtitle: { color: muted, fontSize: 10, marginTop: 3 },
  configCard: { borderRadius: 19, backgroundColor: '#fff', borderWidth: 1, borderColor: '#e8ebe5', padding: 17 }, configHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, configIcon: { fontSize: 20 }, configTitle: { color: ink, fontSize: 18, fontWeight: '800', marginTop: 9, marginBottom: 4 }, optionGroup: { marginTop: 17 }, optionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 6, marginBottom: 8 }, optionLabel: { color: '#69766e', fontSize: 9, fontWeight: '800', letterSpacing: 1 }, optionHelper: { color: '#9aa39d', fontSize: 9 }, optionWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 }, option: { borderRadius: 9, paddingHorizontal: 11, paddingVertical: 8, backgroundColor: '#f3f5f1', borderWidth: 1, borderColor: '#edf0eb' }, optionActive: { backgroundColor: '#e6f1e9', borderColor: '#75a587' }, optionText: { color: '#56645b', fontSize: 10, fontWeight: '600' }, optionTextActive: { color: green, fontWeight: '800' }, quantityRow: { marginTop: 17, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, quantity: { flexDirection: 'row', alignItems: 'center', gap: 12 }, quantityButton: { width: 31, height: 31, borderRadius: 10, backgroundColor: '#f0f3ee', alignItems: 'center', justifyContent: 'center' }, quantitySymbol: { color: green, fontSize: 17, fontWeight: '700' }, quantityValue: { color: ink, fontSize: 13, fontWeight: '800', minWidth: 13, textAlign: 'center' }, productPreview: { marginTop: 20, padding: 12, backgroundColor: '#f7f8f5', borderRadius: 11 }, previewLabel: { color: '#98a29b', fontSize: 8, fontWeight: '800', letterSpacing: 1.2 }, previewName: { color: ink, fontSize: 11, fontWeight: '700', marginTop: 5 }, addButton: { height: 46, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: ink, marginTop: 11 }, addButtonText: { color: '#fff', fontSize: 12, fontWeight: '800' }, pressed: { opacity: 0.82 },
  draftHeader: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: 29, marginBottom: 12 }, sectionTitle: { color: ink, fontSize: 18, fontWeight: '800', marginTop: 5 }, draftCount: { color: muted, fontSize: 10, marginBottom: 2 }, draftCard: { padding: 16, borderRadius: 18, backgroundColor: '#fff', borderWidth: 1, borderColor: '#e8ebe5' }, tableInput: { height: 43, borderRadius: 10, borderWidth: 1, borderColor: '#e5e9e4', backgroundColor: '#fbfcfa', paddingHorizontal: 12, color: ink, fontSize: 12, marginTop: 8, marginBottom: 10 }, draftEmpty: { alignItems: 'center', paddingVertical: 22 }, draftEmptyIcon: { fontSize: 22 }, draftEmptyText: { color: muted, fontSize: 10, marginTop: 7 }, draftItem: { flexDirection: 'row', alignItems: 'center', gap: 10, borderBottomWidth: 1, borderBottomColor: '#eff1ed', paddingVertical: 12 }, draftBullet: { width: 25, height: 25, borderRadius: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: '#e8f1eb' }, draftBulletText: { color: green, fontSize: 10, fontWeight: '800' }, draftItemName: { color: ink, fontSize: 11, fontWeight: '700' }, draftItemDetails: { color: muted, fontSize: 9, lineHeight: 14, marginTop: 3 }, remove: { color: '#9ca69f', fontSize: 20, paddingHorizontal: 3 }, sendButton: { height: 48, backgroundColor: green, alignItems: 'center', justifyContent: 'center', borderRadius: 12, marginTop: 14 }, sendDisabled: { backgroundColor: '#aab9ae' }, sendButtonText: { color: '#fff', fontSize: 12, fontWeight: '800' }, sendArrow: { fontSize: 17 }, sendHint: { color: '#9aa39d', textAlign: 'center', fontSize: 9, marginTop: 10 }, footer: { textAlign: 'center', color: '#a6afa8', fontSize: 8, fontWeight: '700', letterSpacing: 1.5, marginTop: 27 },
});
