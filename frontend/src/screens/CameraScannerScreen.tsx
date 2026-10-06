import React, { useState, useEffect, useRef } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Feather, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { haptics } from '../services/haptics';

export function CameraScannerScreen({ navigation, route, onSuccess, onResetAuth, ...props }: any) {
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  const [isScanning, setIsScanning] = useState(false);
  const [flash, setFlash] = useState<boolean>(false);
  const cameraRef = useRef<CameraView>(null);

  useEffect(() => {
    (async () => {
      if (!permission?.granted) {
        await requestPermission();
      }
    })();
  }, [permission, requestPermission]);

  const handleClose = () => {
    haptics.selection();
    navigation.goBack();
  };

  const processReceipt = async (imageUri: string) => {
    setIsScanning(true);
    await haptics.medium();
    
    // Simulate ML OCR processing
    setTimeout(async () => {
      setIsScanning(false);
      await haptics.success();
      
      Alert.alert(
        'Receipt Scanned 🧾',
        'Detected:\n\nMerchant: Starbucks\nAmount: ₹450\nDate: Today',
        [
          { text: 'Retake', style: 'cancel', onPress: () => haptics.light() },
          { 
            text: 'Save Expense', 
            onPress: () => {
              haptics.selection();
              navigation.navigate('Expenses', { openNewExpense: true, prefillAmount: '450', prefillTitle: 'Starbucks' });
            } 
          }
        ]
      );
    }, 2500);
  };

  const takePicture = async () => {
    if (cameraRef.current) {
      await haptics.heavy();
      try {
        const photo = await cameraRef.current.takePictureAsync({ quality: 0.8 });
        if (photo) {
          processReceipt(photo.uri);
        }
      } catch (e) {
        Alert.alert('Error', 'Failed to take picture.');
      }
    }
  };

  const pickImage = async () => {
    await haptics.light();
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      processReceipt(result.assets[0].uri);
    }
  };

  if (!permission) {
    return <View style={styles.container}><ActivityIndicator color="#14B8A6" /></View>;
  }

  if (!permission.granted) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.permissionBox}>
          <Feather name="camera-off" size={48} color="#94A3B8" />
          <Text style={styles.permissionTitle}>Camera Access Needed</Text>
          <Text style={styles.permissionSub}>We need camera access to scan receipts for auto-filling expenses.</Text>
          <TouchableOpacity style={styles.permissionBtn} onPress={requestPermission}>
            <Text style={styles.permissionBtnText}>Grant Permission</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.cancelBtn} onPress={handleClose}>
            <Text style={styles.cancelBtnText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      
      <View style={styles.cameraContainer}>
        <CameraView 
          ref={cameraRef}
          style={StyleSheet.absoluteFill}
          facing="back"
          enableTorch={flash}
        >
          {/* Overlay Grid / Frame */}
          <View style={styles.overlay}>
            <View style={styles.header}>
              <TouchableOpacity style={styles.iconBtn} onPress={handleClose}>
                <Feather name="x" size={24} color="#FFF" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.iconBtn} onPress={() => { haptics.light(); setFlash(!flash); }}>
                <Feather name={flash ? "zap" : "zap-off"} size={24} color={flash ? "#FBBF24" : "#FFF"} />
              </TouchableOpacity>
            </View>

            <View style={styles.scanAreaContainer}>
              <View style={styles.scanFrame}>
                <View style={[styles.corner, styles.tl]} />
                <View style={[styles.corner, styles.tr]} />
                <View style={[styles.corner, styles.bl]} />
                <View style={[styles.corner, styles.br]} />
                
                {isScanning && (
                  <View style={styles.scanningOverlay}>
                    <ActivityIndicator size="large" color="#14B8A6" />
                    <Text style={styles.scanningText}>Analyzing Receipt...</Text>
                  </View>
                )}
              </View>
              <Text style={styles.instructionText}>Align receipt within frame</Text>
            </View>

            <View style={styles.footer}>
              <TouchableOpacity style={styles.galleryBtn} onPress={pickImage} disabled={isScanning}>
                <Feather name="image" size={24} color="#FFF" />
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.captureOuterBtn} 
                onPress={takePicture}
                disabled={isScanning}
                activeOpacity={0.8}
              >
                <View style={styles.captureInnerBtn} />
              </TouchableOpacity>
              
              <View style={{ width: 44 }} /> {/* Spacer */}
            </View>
          </View>
        </CameraView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
  },
  permissionBox: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  permissionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFF',
    marginTop: 20,
    marginBottom: 8,
  },
  permissionSub: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 20,
  },
  permissionBtn: {
    backgroundColor: '#0D9488',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
    marginBottom: 16,
  },
  permissionBtnText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '700',
  },
  cancelBtn: {
    paddingVertical: 12,
  },
  cancelBtnText: {
    color: '#94A3B8',
    fontSize: 15,
    fontWeight: '600',
  },
  cameraContainer: {
    flex: 1,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#000',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'space-between',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanAreaContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanFrame: {
    width: 280,
    height: 400,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    position: 'relative',
    backgroundColor: 'transparent',
    marginBottom: 20,
  },
  corner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor: '#FFF',
  },
  tl: { top: -2, left: -2, borderTopWidth: 4, borderLeftWidth: 4 },
  tr: { top: -2, right: -2, borderTopWidth: 4, borderRightWidth: 4 },
  bl: { bottom: -2, left: -2, borderBottomWidth: 4, borderLeftWidth: 4 },
  br: { bottom: -2, right: -2, borderBottomWidth: 4, borderRightWidth: 4 },
  scanningOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanningText: {
    color: '#FFF',
    marginTop: 12,
    fontWeight: '600',
    fontSize: 14,
  },
  instructionText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '500',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    overflow: 'hidden',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 40,
    paddingBottom: 40,
  },
  galleryBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureOuterBtn: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 4,
    borderColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureInnerBtn: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFF',
  },
});
