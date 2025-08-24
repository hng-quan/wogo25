import { ROLE, useRole } from '@/context/RoleContext';
import React from 'react';
import { StyleSheet } from 'react-native';
import { Button } from 'react-native-paper';

const CustomButton = ({children, ...props}: React.ComponentProps<typeof Button>) => {
  const {role} = useRole();
  const buttonColor = role === ROLE.WORKER ? styles.workerButtonColor : styles.customerButtonColor;
  return (
    <Button {...props} style={styles.button} textColor='#FFFFFF' buttonColor={buttonColor.backgroundColor}>
      {children}
    </Button>
  );
};

export default CustomButton;

const styles = StyleSheet.create({
  button: {
    // marginTop: 12,
    borderRadius: 8,
  },
  customerButtonColor: {
    backgroundColor: '#4CAF50',
  },
  workerButtonColor: {
    backgroundColor: 'blue',
  },
});
