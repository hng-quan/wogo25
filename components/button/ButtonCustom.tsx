import { ROLE, useRole } from '@/context/RoleContext';
import React from 'react';
import { StyleSheet } from 'react-native';
import { Button } from 'react-native-paper';

const ButtonCustom = ({children, ...props}: React.ComponentProps<typeof Button>) => {
  const {role} = useRole();

  const mainColor =
    role === ROLE.WORKER ? styles.workerButtonColor.backgroundColor : styles.customerButtonColor.backgroundColor;

  // Nếu props.textColor có thì dùng, nếu không thì mặc định
  const textColor = props.textColor ?? (props.mode === 'outlined' ? mainColor : '#FFFFFF');

  if (props.mode === 'outlined') {
    return (
      <Button
        {...props}
        style={[
          styles.button,
          {borderColor: mainColor, borderWidth: 1}, // Thêm borderColor hợp role
          props.style,
        ]}
        textColor={textColor}
        rippleColor={props.rippleColor ?? mainColor + '33' /* nhạt hơn, 33 = 20% opacity */}>
        {children}
      </Button>
    );
  }

  return (
    <Button {...props} style={[styles.button, props.style]} textColor={textColor} buttonColor={mainColor}>
      {children}
    </Button>
  );
};

export default ButtonCustom;

const styles = StyleSheet.create({
  button: {
    borderRadius: 2,
  },
  customerButtonColor: {
    backgroundColor: '#4CAF50', // Green 500
  },
  workerButtonColor: {
    backgroundColor: '#1565C0', // Blue 500
  },
});
