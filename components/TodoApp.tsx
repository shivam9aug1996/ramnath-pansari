import React from "react";
import { useOptimistic } from "react";
import {
  View,
  Text,
  TextInput,
  Button,
  FlatList,
  StyleSheet,
  TouchableOpacity,
} from "react-native";

export default function TodoApp() {
  const [input, setInput] = React.useState("");
  const [todos, setTodos] = useOptimistic([], (state, action) => {
    // Define how actions modify the optimistic state
    switch (action.type) {
      case "add":
        return [...state, action.newTodo];
      case "remove":
        return state.filter((todo) => todo.id !== action.id);
      default:
        return state;
    }
  });

  const handleAddTodo = () => {
    if (!input.trim()) return;

    const newTodo = { id: Date.now().toString(), text: input };
    setTodos({ type: "add", newTodo }); // Optimistic update

    // Simulate an API call
    fakeApiCallToAdd(newTodo)
      .then(() => {
       // console.log("Todo added successfully!");
      })
      .catch(() => {
      //  console.log("Failed to add todo, rolling back.");
        setTodos({ type: "rollback" });
      });

    setInput(""); // Clear input
  };

  const handleRemoveTodo = (id) => {
    setTodos({ type: "remove", id }); // Optimistic update

    // Simulate an API call
    fakeApiCallToRemove(id)
      .then(() => {
       // console.log("Todo removed successfully!");
      })
      .catch(() => {
      //  console.log("Failed to remove todo, rolling back.");
        setTodos({ type: "rollback" });
      });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Optimistic Todo List</Text>
      <FlatList
        data={todos}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.todoItem}>
            <Text>{item.text}</Text>
            <TouchableOpacity onPress={() => handleRemoveTodo(item.id)}>
              <Text style={styles.delete}>Delete</Text>
            </TouchableOpacity>
          </View>
        )}
      />
      <TextInput
        style={styles.input}
        placeholder="Add a new todo"
        value={input}
        onChangeText={setInput}
      />
      <Button title="Add Todo" onPress={handleAddTodo} />
    </View>
  );
}

// Mock API functions
const fakeApiCallToAdd = (todo) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => (Math.random() > 0.2 ? resolve() : reject()), 1000);
  });
};

const fakeApiCallToRemove = (id) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => (Math.random() > 0.2 ? resolve() : reject()), 1000);
  });
};

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#f8f9fa",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
  },
  todoItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 15,
    backgroundColor: "#ffffff",
    marginBottom: 10,
    borderRadius: 5,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  delete: {
    color: "red",
    fontWeight: "bold",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 10,
    borderRadius: 5,
    marginBottom: 10,
  },
});
