import React, { useState } from 'react';
import { TextInput, FlatList, Text, View } from 'react-native';

export default function WithoutDeferred() {
  const [query, setQuery] = useState('');

  const filteredData = getFilteredItems(query); // direct filtering on each keystroke

  return (
    <View style={{ padding: 20 }}>
      <TextInput
        placeholder="Search"
        value={query}
        onChangeText={setQuery}
        style={{ borderWidth: 1, marginBottom: 10, padding: 8 }}
      />
      <FlatList
        data={filteredData}
        keyExtractor={(item) => item}
        renderItem={({ item }) => <Text style={{color: 'red',padding: 10}}>{item}</Text>}
      />
    </View>
  );
}

function getFilteredItems(query: string) {
  const items = Array.from({ length: 1000000 }, (_, i) => `Item ${i}`);
  return items.filter((item) => item.toLowerCase().includes(query.toLowerCase()));
}
