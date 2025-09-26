import React, { useState } from 'react';
import { Modal, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import ButtonCustom from '../button/ButtonCustom';

export default function MapPicker({initialCoords, onSelect}) {
  const [selected, setSelected] = useState(initialCoords);

  return (
    <Modal visible={true} animationType='slide'>
      <MapView
        style={{flex: 1}}
        initialRegion={{
          latitude: initialCoords.latitude,
          longitude: initialCoords.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
        onPress={e => setSelected(e.nativeEvent.coordinate)}>
        {selected && <Marker coordinate={selected} />}
      </MapView>
      <View style={{marginBottom: 16}}>
        <ButtonCustom onPress={() => onSelect(selected)}>Xác nhận</ButtonCustom>
      </View>
    </Modal>
  );
}
