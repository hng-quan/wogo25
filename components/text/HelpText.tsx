import React from 'react';
import { StyleSheet } from 'react-native';
import { HelperText } from 'react-native-paper';

type HelpTextProps = React.ComponentProps<typeof HelperText> & {
  visible?: boolean;
};

export default function HelpText({ children, visible = false, ...props }: HelpTextProps) {
  return (
    <HelperText {...props} visible={visible} style={[styles.HelpText, props.style]}>
      {children}
    </HelperText>
  );
}

const styles = StyleSheet.create({
    HelpText: {
        paddingVertical: 0,
        paddingHorizontal: 0,
        lineHeight: 15,
        fontSize: 12,
        color: 'red'
    }
})
