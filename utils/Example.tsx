import React from "react";
import { Button, View } from "react-native";
import { useCartOperations1 } from "./useCartOperations1";

export default function Example() {
  const { updateItem } = useCartOperations1();

  return (
    <View>
      <Button title="Item A +1" onPress={() => updateItem("A", 1)} />
      <Button title="Item A +2" onPress={() => updateItem("A", 2)} />
      <Button title="Item B +1" onPress={() => updateItem("B", 1)} />
    </View>
  );
}
