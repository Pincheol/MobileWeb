import React from 'react';
import { TouchableOpacity, Text } from 'react-native';
import styled from 'styled-components/native';

const ToggleButton = styled(TouchableOpacity)`
  padding: 10px;
  background-color: ${({ theme }) => theme.main};
  border-radius: 5px;
`;

const ButtonText = styled.Text`
  color: ${({ theme }) => theme.text};
  font-size: 16px;
`;

const BackColor = ({ themeMode, toggleTheme }) => (
  <ToggleButton onPress={toggleTheme}>
    <ButtonText>{themeMode === 'dark' ? 'Light Mode' : 'Dark Mode'}</ButtonText>
  </ToggleButton>
);

export default BackColor;
