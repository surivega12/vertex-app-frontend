import React, { useState, useContext } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import * as Device from 'expo-device';
import * as Application from 'expo-application';

// 🎨 ADN Visual, Configuración y Contexto
import { THEME_COLORS, BACKEND_URL } from '../src/theme/Config'; // 👈 Usamos la configuración centralizada
import { AppContext } from '../AppContext';

const LoginScreen = ({ navigation }) => {
    const { setIsLoggedIn, setUser } = useContext(AppContext);

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // 🚀 LÓGICA DE ACCESO Y REGISTRO DE HARDWARE
    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert("Campos vacíos", "Por favor ingresa tu correo y contraseña VIP.");
            return;
        }

        setIsLoading(true);

        // 1. CAPTURAMOS EL ADN DEL DISPOSITIVO (Device ID)
        let deviceId = '';
        try {
            if (Platform.OS === 'android') {
                deviceId = Application.androidId;
            } else {
                deviceId = await Application.getIosIdForVendorAsync();
            }
        } catch (e) {
            deviceId = "unknown_device";
        }

        const deviceName = `${Device.brand} ${Device.modelName}`;

        try {
            // 2. PETICIÓN AL SERVIDOR (Registro de Correo + ID de Hardware)
            const response = await fetch(`${BACKEND_URL}/api/app/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: email.toLowerCase().trim(),
                    password: password,
                    device_id: deviceId,
                    device_name: deviceName
                })
            });

            const result = await response.json();

            // 🟢 VALIDACIÓN DE ACCESO
            if (result.valid) {
                // 3. ÉXITO: GUARDAMOS EL ESTADO Y ENTRAMOS A LA BÓVEDA
                setUser(prev => ({
                    ...prev,
                    email: email.toLowerCase().trim(),
                    name: result.user_name || "Usuario VIP"
                }));
                setIsLoggedIn(true);

                // Redirigimos al catálogo principal
                navigation.replace('MainApp');
            } else {
                // 🔴 BLOQUEO: Límite de dispositivos o credenciales incorrectas
                Alert.alert("Acceso Denegado", result.error || "No se pudo validar tu cuenta.");
            }
        } catch (error) {
            console.log("Error de conexión con el servidor:", error);
            Alert.alert("Error de Conexión", "La Bóveda no responde. Intenta de nuevo más tarde.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <BlurView intensity={20} tint="dark" style={styles.loginBox}>
                <View style={styles.header}>
                    <Text style={styles.brandText}>VERTƎX</Text>
                    <Text style={styles.subText}>Acceso exclusivo a la Bóveda Premium</Text>
                </View>

                {/* 📧 Input de Correo */}
                <View style={styles.inputContainer}>
                    <Ionicons name="mail-outline" size={20} color={THEME_COLORS.gold} style={styles.icon} />
                    <TextInput
                        style={styles.input}
                        placeholder="Correo Electrónico"
                        placeholderTextColor={THEME_COLORS.textMuted}
                        value={email}
                        onChangeText={setEmail}
                        keyboardType="email-address"
                        autoCapitalize="none"
                    />
                </View>

                {/* 🔒 Input de Contraseña */}
                <View style={styles.inputContainer}>
                    <Ionicons name="lock-closed-outline" size={20} color={THEME_COLORS.gold} style={styles.icon} />
                    <TextInput
                        style={styles.input}
                        placeholder="Contraseña"
                        placeholderTextColor={THEME_COLORS.textMuted}
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry
                    />
                </View>

                <TouchableOpacity
                    style={styles.loginBtn}
                    onPress={handleLogin}
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <ActivityIndicator color="#000" />
                    ) : (
                        <Text style={styles.loginBtnText}>INGRESAR</Text>
                    )}
                </TouchableOpacity>

                <Text style={styles.deviceInfoText}>
                    Dispositivo actual: {Device.modelName}
                </Text>
            </BlurView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: THEME_COLORS.bgAbsolute, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20 },
    loginBox: { width: '100%', maxWidth: 400, padding: 30, borderRadius: 24, borderWidth: 1.2, borderColor: THEME_COLORS.glassBorder, backgroundColor: THEME_COLORS.glassBg },
    header: { alignItems: 'center', marginBottom: 40 },
    brandText: { color: THEME_COLORS.gold, fontSize: 32, fontWeight: '900', letterSpacing: 4 },
    subText: { color: THEME_COLORS.textMuted, fontSize: 13, marginTop: 5, textAlign: 'center' },
    inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 16, marginBottom: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 15, height: 55 },
    icon: { marginRight: 10 },
    input: { flex: 1, color: '#fff', fontSize: 16, height: '100%' },
    loginBtn: { backgroundColor: THEME_COLORS.gold, height: 55, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginTop: 10 },
    loginBtnText: { color: '#000', fontWeight: '900', fontSize: 16, letterSpacing: 2 },
    deviceInfoText: { color: THEME_COLORS.textMuted, fontSize: 10, textAlign: 'center', marginTop: 25, fontStyle: 'italic' }
});

export default LoginScreen;