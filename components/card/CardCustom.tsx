import React from 'react';
import { Card, Text } from 'react-native-paper';

export default function CardCustom({item}: CardType) {
  return (
    <Card>
      <Card.Title title={item.serviceName} />
      <Card.Content>
        <Text variant='titleLarge'>{item.serviceName}</Text>
        <Text variant='bodyMedium'>{item.description}</Text>
      </Card.Content>
      {/* <Card.Actions>
      <Button>Cancel</Button>
      <Button>Ok</Button>
    </Card.Actions> */}
    </Card>
  );
}

type CardType = {
  item: {
    id: string | number;
    serviceName: string;
    description: string;
    iconUrl: string | null;
    parentId: number;
    active: boolean;
  };
};
