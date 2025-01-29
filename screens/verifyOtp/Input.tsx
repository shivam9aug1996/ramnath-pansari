import React, {
  forwardRef,
  memo,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import {
  Dimensions,
  Keyboard,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import { numberOfInputs } from "./util";
import { Colors } from "@/constants/Colors";
import { fonts } from "@/constants/Fonts";
const { width: screenWidth } = Dimensions.get("window");

const dynamicInputWidth = Math.min(screenWidth * 0.12, 60);
type InputProps = {
  setInputValues: React.Dispatch<React.SetStateAction<string[]>>;
  inputValues: string[];
  setErrorState: React.Dispatch<React.SetStateAction<string>>;
};

const Input = forwardRef<
  { resetCurrentInputIndex: () => void; resetInput: () => void },
  InputProps
>(({ setInputValues, inputValues, setErrorState }, ref) => {
  const inputRefs = useRef<Array<TextInput | null>>([]);
  const [currentInputIndex, setCurrentInputIndex] = useState<number | null>(
    null
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      focusTextInput(0);
      setCurrentInputIndex(0);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  useImperativeHandle(ref, () => ({
    resetCurrentInputIndex,
    resetInput,
  }));

  const resetCurrentInputIndex = useCallback(() => {
    setCurrentInputIndex(null);
  }, []);

  const resetInput = useCallback(() => {
    setCurrentInputIndex(0);
    inputRefs.current[0]?.focus();
    inputRefs.current = [];
    setInputValues(Array(numberOfInputs).fill(""));
    setErrorState("");
  }, [setInputValues, setErrorState]);

  const focusTextInput = useCallback((index: number) => {
    inputRefs.current[index]?.focus();
  }, []);

  const handleKeyPress = useCallback(
    (e: any, index: number) => {
      const key = e.nativeEvent.key;

      if (key === "Backspace") {
        const newValues = [...inputValues];
        newValues[index] = "";
        setInputValues(newValues);

        if (index > 0) {
          focusTextInput(index - 1);
          setCurrentInputIndex(index - 1);
        } else {
          setCurrentInputIndex(null);
          Keyboard.dismiss();
        }
      } else {
        const newValues = [...inputValues];
        newValues[index] = key;
        setInputValues(newValues);

        if (index < numberOfInputs - 1) {
          focusTextInput(index + 1);
          setCurrentInputIndex(index + 1);
        } else {
          setCurrentInputIndex(null);
          Keyboard.dismiss();
        }

        setErrorState("");
      }
    },
    [inputValues, focusTextInput, setInputValues, setErrorState]
  );

  return (
    <View style={styles.inputsContainer}>
      {Array.from({ length: numberOfInputs }).map((_, index) => (
        <Pressable
          key={index}
          onPress={() => {
            setCurrentInputIndex(index);
            focusTextInput(index);
          }}
          style={[
            styles.inputContainer,
            {
              borderColor:
                currentInputIndex === index
                  ? Colors.light.gradientGreen_1
                  : "transparent",
            },
          ]}
        >
          <TextInput
            caretHidden
            // autoComplete="one-time-code"
            textContentType="oneTimeCode"
            onTouchEnd={() => setCurrentInputIndex(index)}
            ref={(el) => (inputRefs.current[index] = el)}
            keyboardType="numeric"
            style={styles.textInput}
            maxLength={1}
            value={inputValues[index]}
            onKeyPress={(e) => handleKeyPress(e, index)}
            onSubmitEditing={() => setCurrentInputIndex(null)}
          />
        </Pressable>
      ))}
    </View>
  );
});

export default memo(Input);

const styles = StyleSheet.create({
  inputsContainer: {
    flexDirection: "row",
    justifyContent: "space-evenly",
    alignItems: "center",
    marginTop: 35,
    gap: 10,
  },
  inputContainer: {
    borderRadius: 20,
    paddingVertical: 15,
    width: dynamicInputWidth,
    borderWidth: 1,
    backgroundColor: "#f2f4f3",
  },
  textInput: {
    ...fonts.defaultNumber,
    fontSize: 14,
    textAlign: "center",
    color: Colors.light.darkGrey,
  },
});
