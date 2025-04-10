import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import KeyEvent from 'react-native-keyevent';

const ShortcutListener = ({ onShortcutTriggered }) => {
  const [pressCount, setPressCount] = useState(0);
  const [timerId, setTimerId] = useState(null);

  useEffect(() => {
    // Inizializza il listener per gli eventi key
    KeyEvent.onKeyUpListener((keyEvent) => {
      // Controlla il codice della chiave: ad es. 24 � il tasto volume gi� (il codice pu� variare per modello)
      // Dovrai verificare il codice esatto sul tuo dispositivo, oppure stampare keyEvent per debug.
      if (keyEvent.keyCode === 25) { // 25 � spesso il tasto volume gi� su molti dispositivi Android
        handleKeyPress();
      }
    });

    // Rimuovi il listener al cleanup
    return () => {
      KeyEvent.removeKeyUpListener();
      if (timerId) clearTimeout(timerId);
    };
  }, [pressCount, timerId]);

  const handleKeyPress = () => {
    // Se non � presente un timer, inizializza un timer per resettare il contatore dopo ad esempio 2 secondi
    if (!timerId) {
      const id = setTimeout(() => {
        setPressCount(0);
        setTimerId(null);
      }, 2000);
      setTimerId(id);
    }

    setPressCount((prevCount) => {
      const newCount = prevCount + 1;
      if (newCount === 3) {
        // Shortcut attivata: 3 pressioni in 2 secondi
        Alert.alert('Shortcut attivata!', 'Avvio schermata rapida di FastLife.');
        onShortcutTriggered(); // Chiama la callback per mostrare la schermata rapida
        // Resetta il contatore e il timer
        clearTimeout(timerId);
        setTimerId(null);
        return 0;
      }
      return newCount;
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.info}>Premi il tasto Volume Gi� 3 volte per aprire la schermata rapida</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#f0f0f0',
  },
  info: {
    fontSize: 16,
    textAlign: 'center',
  },
});

export default ShortcutListener;