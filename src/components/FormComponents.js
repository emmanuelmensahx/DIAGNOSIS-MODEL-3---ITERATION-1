import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Platform,
} from 'react-native';
import ErrorMessage from './ErrorMessage';

// Enhanced TextInput with validation
export const ValidatedTextInput = ({
  label,
  value,
  onChangeText,
  onBlur,
  error,
  touched,
  required = false,
  placeholder,
  secureTextEntry = false,
  keyboardType = 'default',
  multiline = false,
  numberOfLines = 1,
  maxLength,
  disabled = false,
  leftIcon,
  rightIcon,
  style,
  inputStyle,
  labelStyle,
  errorStyle,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const animatedValue = useRef(new Animated.Value(value ? 1 : 0)).current;

  const handleFocus = () => {
    setIsFocused(true);
    Animated.timing(animatedValue, {
      toValue: 1,
      duration: 200,
      useNativeDriver: false,
    }).start();
  };

  const handleBlur = () => {
    setIsFocused(false);
    if (!value) {
      Animated.timing(animatedValue, {
        toValue: 0,
        duration: 200,
        useNativeDriver: false,
      }).start();
    }
    if (onBlur) onBlur();
  };

  const handleChangeText = (text) => {
    if (!value && text) {
      Animated.timing(animatedValue, {
        toValue: 1,
        duration: 200,
        useNativeDriver: false,
      }).start();
    } else if (value && !text) {
      Animated.timing(animatedValue, {
        toValue: 0,
        duration: 200,
        useNativeDriver: false,
      }).start();
    }
    onChangeText(text);
  };

  const labelTop = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [18, 0],
  });

  const labelFontSize = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [16, 12],
  });

  const hasError = touched && error;
  const borderColor = hasError ? '#dc3545' : isFocused ? '#007bff' : '#ced4da';

  return (
    <View style={[styles.inputContainer, style]}>
      {label && (
        <View style={styles.labelContainer}>
          <Animated.Text
            style={[
              styles.label,
              labelStyle,
              {
                top: labelTop,
                fontSize: labelFontSize,
                color: hasError ? '#dc3545' : isFocused ? '#007bff' : '#6c757d',
              },
            ]}
          >
            {label}
            {required && <Text style={styles.required}> *</Text>}
          </Animated.Text>
        </View>
      )}
      
      <View style={[styles.inputWrapper, { borderColor }]}>
        {leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}
        
        <TextInput
          style={[
            styles.textInput,
            inputStyle,
            {
              paddingLeft: leftIcon ? 40 : 12,
              paddingRight: rightIcon ? 40 : 12,
              opacity: disabled ? 0.6 : 1,
            },
          ]}
          value={value}
          onChangeText={handleChangeText}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={isFocused ? placeholder : ''}
          placeholderTextColor="#adb5bd"
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          multiline={multiline}
          numberOfLines={numberOfLines}
          maxLength={maxLength}
          editable={!disabled}
          {...props}
        />
        
        {rightIcon && <View style={styles.rightIcon}>{rightIcon}</View>}
      </View>
      
      {maxLength && (
        <Text style={styles.characterCount}>
          {value?.length || 0}/{maxLength}
        </Text>
      )}
      
      {hasError && (
        <ErrorMessage
          message={error}
          type="validation"
          style={[styles.errorMessage, errorStyle]}
        />
      )}
    </View>
  );
};

// Select/Picker component with validation
export const ValidatedSelect = ({
  label,
  value,
  onValueChange,
  onBlur,
  error,
  touched,
  required = false,
  placeholder = 'Select an option',
  options = [],
  disabled = false,
  style,
  labelStyle,
  errorStyle,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const hasError = touched && error;

  const selectedOption = options.find(option => option.value === value);

  const handleSelect = (optionValue) => {
    onValueChange(optionValue);
    setIsOpen(false);
    if (onBlur) onBlur();
  };

  return (
    <View style={[styles.inputContainer, style]}>
      {label && (
        <Text style={[styles.staticLabel, labelStyle, hasError && { color: '#dc3545' }]}>
          {label}
          {required && <Text style={styles.required}> *</Text>}
        </Text>
      )}
      
      <TouchableOpacity
        style={[
          styles.selectWrapper,
          {
            borderColor: hasError ? '#dc3545' : '#ced4da',
            opacity: disabled ? 0.6 : 1,
          },
        ]}
        onPress={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
      >
        <Text style={[
          styles.selectText,
          !selectedOption && styles.placeholderText,
        ]}>
          {selectedOption ? selectedOption.label : placeholder}
        </Text>
        <Text style={styles.selectArrow}>{isOpen ? '▲' : '▼'}</Text>
      </TouchableOpacity>
      
      {isOpen && (
        <View style={styles.optionsContainer}>
          {options.map((option) => (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.option,
                option.value === value && styles.selectedOption,
              ]}
              onPress={() => handleSelect(option.value)}
            >
              <Text style={[
                styles.optionText,
                option.value === value && styles.selectedOptionText,
              ]}>
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
      
      {hasError && (
        <ErrorMessage
          message={error}
          type="validation"
          style={[styles.errorMessage, errorStyle]}
        />
      )}
    </View>
  );
};

// Checkbox component with validation
export const ValidatedCheckbox = ({
  label,
  value,
  onValueChange,
  error,
  touched,
  required = false,
  disabled = false,
  style,
  labelStyle,
  errorStyle,
}) => {
  const hasError = touched && error;

  return (
    <View style={[styles.checkboxContainer, style]}>
      <TouchableOpacity
        style={styles.checkboxRow}
        onPress={() => !disabled && onValueChange(!value)}
        disabled={disabled}
      >
        <View style={[
          styles.checkbox,
          value && styles.checkedCheckbox,
          hasError && styles.errorCheckbox,
          disabled && styles.disabledCheckbox,
        ]}>
          {value && <Text style={styles.checkmark}>✓</Text>}
        </View>
        
        <Text style={[
          styles.checkboxLabel,
          labelStyle,
          hasError && { color: '#dc3545' },
          disabled && { opacity: 0.6 },
        ]}>
          {label}
          {required && <Text style={styles.required}> *</Text>}
        </Text>
      </TouchableOpacity>
      
      {hasError && (
        <ErrorMessage
          message={error}
          type="validation"
          style={[styles.errorMessage, errorStyle]}
        />
      )}
    </View>
  );
};

// Radio button group with validation
export const ValidatedRadioGroup = ({
  label,
  value,
  onValueChange,
  error,
  touched,
  required = false,
  options = [],
  disabled = false,
  horizontal = false,
  style,
  labelStyle,
  errorStyle,
}) => {
  const hasError = touched && error;

  return (
    <View style={[styles.radioGroupContainer, style]}>
      {label && (
        <Text style={[
          styles.staticLabel,
          labelStyle,
          hasError && { color: '#dc3545' },
        ]}>
          {label}
          {required && <Text style={styles.required}> *</Text>}
        </Text>
      )}
      
      <View style={[
        styles.radioGroup,
        horizontal && styles.horizontalRadioGroup,
      ]}>
        {options.map((option) => (
          <TouchableOpacity
            key={option.value}
            style={[
              styles.radioOption,
              horizontal && styles.horizontalRadioOption,
            ]}
            onPress={() => !disabled && onValueChange(option.value)}
            disabled={disabled}
          >
            <View style={[
              styles.radioButton,
              value === option.value && styles.selectedRadioButton,
              hasError && styles.errorRadioButton,
              disabled && styles.disabledRadioButton,
            ]}>
              {value === option.value && <View style={styles.radioButtonInner} />}
            </View>
            
            <Text style={[
              styles.radioLabel,
              disabled && { opacity: 0.6 },
            ]}>
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      
      {hasError && (
        <ErrorMessage
          message={error}
          type="validation"
          style={[styles.errorMessage, errorStyle]}
        />
      )}
    </View>
  );
};

// Form section component
export const FormSection = ({ title, children, style }) => (
  <View style={[styles.formSection, style]}>
    {title && <Text style={styles.sectionTitle}>{title}</Text>}
    {children}
  </View>
);

// Form submit button with loading state
export const FormSubmitButton = ({
  title,
  onPress,
  loading = false,
  disabled = false,
  style,
  textStyle,
}) => (
  <TouchableOpacity
    style={[
      styles.submitButton,
      (disabled || loading) && styles.disabledButton,
      style,
    ]}
    onPress={onPress}
    disabled={disabled || loading}
  >
    <Text style={[styles.submitButtonText, textStyle]}>
      {loading ? 'Please wait...' : title}
    </Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  inputContainer: {
    marginBottom: 16,
  },
  labelContainer: {
    position: 'relative',
    height: 20,
  },
  label: {
    position: 'absolute',
    left: 12,
    fontWeight: '500',
    backgroundColor: '#fff',
    paddingHorizontal: 4,
    zIndex: 1,
  },
  staticLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#495057',
    marginBottom: 8,
  },
  required: {
    color: '#dc3545',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    backgroundColor: '#fff',
    minHeight: 48,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: '#495057',
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  leftIcon: {
    position: 'absolute',
    left: 12,
    zIndex: 1,
  },
  rightIcon: {
    position: 'absolute',
    right: 12,
    zIndex: 1,
  },
  characterCount: {
    fontSize: 12,
    color: '#6c757d',
    textAlign: 'right',
    marginTop: 4,
  },
  selectWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 8,
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 12,
    minHeight: 48,
  },
  selectText: {
    fontSize: 16,
    color: '#495057',
    flex: 1,
  },
  placeholderText: {
    color: '#adb5bd',
  },
  selectArrow: {
    fontSize: 12,
    color: '#6c757d',
  },
  optionsContainer: {
    borderWidth: 1,
    borderColor: '#ced4da',
    borderRadius: 8,
    backgroundColor: '#fff',
    marginTop: 4,
    maxHeight: 200,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  option: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f8f9fa',
  },
  selectedOption: {
    backgroundColor: '#e3f2fd',
  },
  optionText: {
    fontSize: 16,
    color: '#495057',
  },
  selectedOptionText: {
    color: '#007bff',
    fontWeight: '500',
  },
  checkboxContainer: {
    marginBottom: 16,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: '#ced4da',
    borderRadius: 4,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  checkedCheckbox: {
    backgroundColor: '#007bff',
    borderColor: '#007bff',
  },
  errorCheckbox: {
    borderColor: '#dc3545',
  },
  disabledCheckbox: {
    opacity: 0.6,
  },
  checkmark: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  checkboxLabel: {
    fontSize: 16,
    color: '#495057',
    flex: 1,
  },
  radioGroupContainer: {
    marginBottom: 16,
  },
  radioGroup: {
    marginTop: 8,
  },
  horizontalRadioGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  horizontalRadioOption: {
    marginRight: 20,
    marginBottom: 8,
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#ced4da',
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  selectedRadioButton: {
    borderColor: '#007bff',
  },
  errorRadioButton: {
    borderColor: '#dc3545',
  },
  disabledRadioButton: {
    opacity: 0.6,
  },
  radioButtonInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#007bff',
  },
  radioLabel: {
    fontSize: 16,
    color: '#495057',
  },
  formSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#495057',
    marginBottom: 16,
  },
  submitButton: {
    backgroundColor: '#007bff',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  disabledButton: {
    backgroundColor: '#6c757d',
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  errorMessage: {
    marginTop: 4,
  },
});

export default {
  ValidatedTextInput,
  ValidatedSelect,
  ValidatedCheckbox,
  ValidatedRadioGroup,
  FormSection,
  FormSubmitButton,
};