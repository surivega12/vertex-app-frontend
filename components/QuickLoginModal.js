import React, { useState, useContext } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Modal, ActivityIndicator, Alert, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import * as Device from 'expo-device';
import * as Application from 'expo-application';

import { COLORS } from '../src/theme/Styles';
import { AppContext } from '../AppContext';

const QuickLoginModal = ({ visible, onClose, onSuccess }) => {
    const { setIsLoggedIn, setUser } = useContext(AppContext);
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleLogin = async () => {
        if (!email.trim()) {
            Alert.alert("Campo vacío", "Ingresa tu correo VIP para continuar.");
            return;
        }

        setIsLoading(true);
        let deviceId = Platform.OS === 'android' ? Application.androidId : await Application.getIosIdForVendorAsync();
        const deviceName = `${Device.brand} ${Device.modelName}`;

        try {
            // Petición a tu servidor Flask (Solo validamos el correo y registramos el dispositivo)
            const response = await fetch('http://192.168.0.128:5000/api/app/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: email, device_id: deviceId, device_name: deviceName })
            });

            const result = await response.json();

            if (result.valid || true) { // ⚠️ Quita el "|| true" cuando tu backend esté listo
                setUser(prev => ({ ...prev, email: email }));
                setIsLoggedIn(true);
                onSuccess(); // Le avisa a la pantalla de detalles que ya puede reproducir
            } else {
                Alert.alert("Acceso Denegado", result.error || "Límite de dispositivos alcanzado.");
            }
        } catch (error) {
            Alert.alert("Error de Servidor", "No se pudo verificar tu cuenta.");
        } finally {
            setIsLoading(false);
        }
    };

    if (!visible) return null;

    return (
        <Modal visible={visible} transparent={true} animationType="fade">
            <BlurView intensity={70} tint="dark" style={styles.overlay}>
                <View style={styles.glassBox}>
                    <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
                        <Ionicons name="close" size={24} color={COLORS.textMuted} />
                    </TouchableOpacity>

                    <Ionicons name="lock-closed" size={40} color={COLORS.gold} style={{ marginBottom: 15 }} />
                    <Text style={styles.title}>ACCESO VIP REQUERIDO</Text>
                    <Text style={styles.subtitle}>Inicia sesión con tu correo registrado para desbloquear el catálogo completo.</Text>

                    <View style={styles.inputContainer}>
                        <Ionicons name="mail-outline" size={20} color={COLORS.gold} style={{ marginRight: 10 }} />
                        <TextInput
                            style={styles.input}
                            placeholder="tucorreo@ejemplo.com"
                            placeholderTextColor={COLORS.textMuted}
                            value={email}
                            onChangeText={setEmail}
                            keyboardType="email-address"
                            autoCapitalize="none"
                        />
                    </View>

                    <TouchableOpacity style={styles.btn} onPress={handleLogin} disabled={isLoading}>
                        {isLoading ? <ActivityIndicator color="#000" /> : <Text style={styles.btnText}>DESBLOQUEAR BÓVEDA</Text>}
                    </TouchableOpacity>
                </View>
            </BlurView>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20 },
    glassBox: { width: '100%', maxWidth: 350, backgroundColor: COLORS.glassBg, borderRadius: 24, padding: 25, borderWidth: 1.2, borderColor: COLORS.glassBorder, alignItems: 'center' },
    closeBtn: { position: 'absolute', top: 15, right: 15, zIndex: 10 },
    title: { color: COLORS.textMain, fontSize: 16, fontWeight: '900', letterSpacing: 1, marginBottom: 8 },
    subtitle: { color: COLORS.textMuted, fontSize: 13, textAlign: 'center', marginBottom: 25, lineHeight: 20 },
    inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 15, height: 50, width: '100%', marginBottom: 20 },
    input: { flex: 1, color: '#fff', fontSize: 15 },
    btn: { backgroundColor: COLORS.gold, width: '100%', height: 50, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    btnText: { color: '#000', fontWeight: '900', letterSpacing: 1 }
});

export default QuickLoginModal;