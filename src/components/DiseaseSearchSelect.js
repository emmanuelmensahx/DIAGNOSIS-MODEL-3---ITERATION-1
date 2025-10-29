import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList } from 'react-native';
import { createApiInstance } from '../utils/apiUtils';
import { API_BASE_URL as API_URL } from '../utils/apiConfig';

const api = createApiInstance(API_URL, { timeout: 10000 });

const PRIORITY_LABELS = {
  1: 'High',
  2: 'Medium',
  3: 'Low',
};

const RegionFilter = ({ regions, selectedRegion, onSelect }) => {
  const allRegions = useMemo(() => {
    const set = new Set();
    regions.forEach(r => set.add(r));
    return ['all', ...Array.from(set)];
  }, [regions]);

  return (
    <View style={styles.filtersRow}>
      {allRegions.map(r => (
        <TouchableOpacity
          key={r}
          style={[styles.filterChip, selectedRegion === r && styles.filterChipActive]}
          onPress={() => onSelect(r)}
        >
          <Text style={[styles.filterChipText, selectedRegion === r && styles.filterChipTextActive]}>
            {r === 'all' ? 'All Regions' : r.replace(/_/g, ' ')}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const PriorityFilter = ({ selectedPriority, onSelect }) => {
  const priorities = ['all', 1, 2, 3];
  return (
    <View style={styles.filtersRow}>
      {priorities.map(p => (
        <TouchableOpacity
          key={p}
          style={[styles.filterChip, selectedPriority === p && styles.filterChipActive]}
          onPress={() => onSelect(p)}
        >
          <Text style={[styles.filterChipText, selectedPriority === p && styles.filterChipTextActive]}>
            {p === 'all' ? 'All Tiers' : PRIORITY_LABELS[p]}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const DiseaseItem = ({ item, onSelect, selected }) => (
  <TouchableOpacity style={[styles.item, selected && styles.itemSelected]} onPress={() => onSelect(item)}>
    <View style={styles.itemHeader}>
      <Text style={styles.itemTitle}>{item.name}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        {selected ? <Text style={styles.itemSelectedBadge}>Selected</Text> : null}
        <Text style={styles.itemBadge}>{PRIORITY_LABELS[item.priority] || 'Medium'}</Text>
      </View>
    </View>
    <Text style={styles.itemSubtitle}>{item.code}</Text>
    <Text style={styles.itemRegions}>{(item.regions || []).join(', ')}</Text>
  </TouchableOpacity>
);

const DiseaseSearchSelect = ({ value, onChange, onBlur, error, touched }) => {
  const [query, setQuery] = useState('');
  const [supported, setSupported] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedPriority, setSelectedPriority] = useState('all');
  const [selectedRegion, setSelectedRegion] = useState('all');

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    api.get('/predict/supported-diseases')
      .then(res => {
        if (isMounted) setSupported(res.data || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
    return () => { isMounted = false; };
  }, []);

  const allRegions = useMemo(() => {
    const set = new Set();
    supported.forEach(d => (d.regions || []).forEach(r => set.add(r)));
    return Array.from(set);
  }, [supported]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return supported.filter(d => {
      const matchesQuery = !q || d.name.toLowerCase().includes(q) || d.code.toLowerCase().includes(q);
      const matchesPriority = selectedPriority === 'all' || d.priority === selectedPriority;
      const matchesRegion = selectedRegion === 'all' || (d.regions || []).includes(selectedRegion);
      return matchesQuery && matchesPriority && matchesRegion;
    });
  }, [supported, query, selectedPriority, selectedRegion]);

  const onSelect = (item) => {
    onChange && onChange(item.code);
    onBlur && onBlur();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Disease (Search & Select)</Text>
      <TextInput
        style={styles.searchInput}
        value={query}
        onChangeText={setQuery}
        placeholder="Search diseases by name or code"
      />
      <PriorityFilter selectedPriority={selectedPriority} onSelect={setSelectedPriority} />
      <RegionFilter regions={allRegions} selectedRegion={selectedRegion} onSelect={setSelectedRegion} />
      {error && touched ? <Text style={styles.errorText}>{error}</Text> : null}
      {loading ? (
        <Text style={styles.loadingText}>Loading diseases...</Text>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.code}
          renderItem={({ item }) => (
            <DiseaseItem item={item} onSelect={onSelect} selected={value === item.code} />
          )}
          ListEmptyComponent={<Text style={styles.emptyText}>No diseases match the current filters.</Text>}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { marginBottom: 16 },
  label: { fontSize: 16, fontWeight: '600', marginBottom: 8, color: '#495057' },
  searchInput: {
    borderWidth: 1,
    borderColor: '#ced4da',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 8,
    backgroundColor: '#fff',
  },
  filtersRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginVertical: 6,
  },
  filterChip: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#ced4da',
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
    backgroundColor: '#fff',
  },
  filterChipActive: {
    backgroundColor: '#0d6efd',
    borderColor: '#0d6efd',
  },
  filterChipText: { color: '#495057' },
  filterChipTextActive: { color: '#fff' },
  item: {
    borderWidth: 1,
    borderColor: '#e9ecef',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    backgroundColor: '#fff',
  },
  itemSelected: {
    borderColor: '#0d6efd',
    backgroundColor: '#e7f1ff',
  },
  itemHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  itemTitle: { fontSize: 16, fontWeight: '600', color: '#343a40' },
  itemBadge: { fontSize: 12, color: '#6c757d' },
  itemSelectedBadge: { fontSize: 12, color: '#0d6efd', marginRight: 8 },
  itemSubtitle: { fontSize: 12, color: '#6c757d', marginTop: 4 },
  itemRegions: { fontSize: 12, color: '#495057', marginTop: 4 },
  errorText: { color: '#dc3545', marginBottom: 8 },
  loadingText: { color: '#6c757d', marginTop: 8 },
  emptyText: { color: '#6c757d', marginTop: 8 },
});

export default DiseaseSearchSelect;