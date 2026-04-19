import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';

// 🎨 ADN Visual, Configuración y Contexto
import { THEME_COLORS, BACKEND_URL } from '../src/theme/Config'; // 👈 Usamos la configuración centralizada
import { AppContext } from '../AppContext';

const ProfileScreen = ({ navigation }) => {
    const { user, setIsLoggedIn } = useContext(AppContext); // Obtenemos los datos del usuario logueado
    const [devices, setDevices] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user.email) {
            fetchDevices();
        }
    }, [user.email]);

    // 📡 1. Cargar dispositivos desde el servidor Flask
    const fetchDevices = async () => {
        try {
            setLoading(true);
            const response = await fetch(`${BACKEND_URL}/api/app/my-devices?email=${user.email}`);
            const data = await response.json();
            setDevices(data);
        } catch (error) {
            console.log("Error cargando dispositivos de la Bóveda");
        } finally {
            setLoading(false);
        }
    };

    // 🗑️ 2. Lógica para liberar un cupo (Desvincular hardware)
    const handleDeleteDevice = (deviceId, deviceName) => {
        Alert.alert(
            "Desvincular Dispositivo",
            `¿Estás seguro de que quieres eliminar "${deviceName}"? Se liberará un cupo de tu cuenta VIP.`,
            [
                { text: "Cancelar", style: "cancel" },
                {
                    text: "ELIMINAR",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            const res = await fetch(`${BACKEND_URL}/api/app/delete-device`, {
                                method: 'DELETE',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ email: user.email, device_id: deviceId })
                            });
                            if (res.ok) {
                                fetchDevices(); // Recargamos la lista al tener éxito
                                Alert.alert("Éxito", "Dispositivo eliminado correctamente.");
                            }
                        } catch (e) {
                            Alert.alert("Error", "No se pudo desvincular el dispositivo.");
                        }
                    }
                }
            ]
        );
    };

    // 🚪 3. Salida segura de la Bóveda
    const handleLogout = () => {
        setIsLoggedIn(false);
        navigation.replace('Login');
    };

    return (
        <View style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                {/* 👤 CABECERA DE PERFIL VIP */}
                <View style={styles.headerCard}>
                    <View style={styles.avatarCircle}>
                        <BlurView intensity={20} tint="light" style={StyleSheet.absoluteFill} />
                        <Ionicons name="person" size={40} color={THEME_COLORS.gold} />
                    </View>
                    <Text style={styles.userName}>{user.name || 'Usuario VERTƎX'}</Text>
                    <Text style={styles.userEmail}>{user.email || 'Sin correo vinculado'}</Text>
                    <View style={styles.vipBadge}>
                        <Text style={styles.vipText}>USUARIO GOLD • {user.vipDays || 0} DÍAS</Text>
                    </View>
                </View>

                {/* 📱 GESTIÓN DE HARDWARE (CRISTAL) */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>MIS DISPOSITIVOS VINCULADOS</Text>
                    <Text style={styles.deviceCounter}>{devices.length} / 5</Text>
                </View>

                {loading ? (
                    <ActivityIndicator color={THEME_COLORS.gold} style={{ marginTop: 20 }} />
                ) : (
                    <View style={styles.deviceList}>
                        {devices.map((dev, index) => (
                            <View key={index} style={styles.deviceCard}>
                                <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill} />
                                <View style={styles.deviceInfo}>
                                    <Ionicons
                                        name={dev.device_name?.toLowerCase().includes('tv') ? "tv-outline" : "phone-portrait-outline"}
                                        size={24}
                                        color="#fff"
                                    />
                                    <View style={{ marginLeft: 15 }}>
                                        <Text style={styles.deviceName}>{dev.device_name}</Text>
                                        <Text style={styles.deviceId}>ID: {dev.device_id.substring(0, 15)}...</Text>
                                    </View>
                                </View>
                                <TouchableOpacity
                                    style={styles.deleteBtn}
                                    onPress={() => handleDeleteDevice(dev.device_id, dev.device_name)}
                                >
                                    <Ionicons name="trash-outline" size={20} color={THEME_COLORS.error} />
                                </TouchableOpacity>
                            </View>
                        ))}

                        {devices.length === 0 && (
                            <Text style={styles.emptyText}>No hay hardware registrado en esta cuenta.</Text>
                        )}
                    </View>
                )}

                <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
                    <Text style={styles.logoutText}>CERRAR SESIÓN</Text>
                </TouchableOpacity>

                <View style={{ height: 100 }} />
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: THEME_COLORS.bgAbsolute },
    scrollContent: { padding: 25, paddingTop: Platform.OS === 'ios' ? 70 : 50 },
    headerCard: { alignItems: 'center', marginBottom: 40 },
    avatarCircle: { width: 100, height: 100, borderRadius: 50, justifyContent: 'center', alignItems: 'center', borderWidth: 1.2, borderColor: THEME_COLORS.glassBorder, overflow: 'hidden', marginBottom: 20 },
    userName: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
    userEmail: { color: THEME_COLORS.textMuted, fontSize: 14, marginTop: 5 },
    vipBadge: { backgroundColor: 'rgba(193, 145, 95, 0.15)', paddingHorizontal: 15, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: THEME_COLORS.gold, marginTop: 15 },
    vipText: { color: THEME_COLORS.gold, fontSize: 10, fontWeight: 'bold', letterSpacing: 1 },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    sectionTitle: { color: THEME_COLORS.gold, fontSize: 13, fontWeight: 'bold', letterSpacing: 2 },
    deviceCounter: { color: THEME_COLORS.textMuted, fontSize: 13, fontWeight: 'bold' },
    deviceList: { gap: 15 },
    deviceCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', height: 85, borderRadius: 20, borderWidth: 1.2, borderColor: THEME_COLORS.glassBorder, overflow: 'hidden', paddingHorizontal: 20 },
    deviceInfo: { flexDirection: 'row', alignItems: 'center' },
    deviceName: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
    deviceId: { color: THEME_COLORS.textMuted, fontSize: 11, marginTop: 3 },
    deleteBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255, 68, 68, 0.1)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255, 68, 68, 0.2)' },
    emptyText: { color: THEME_COLORS.textMuted, textAlign: 'center', marginTop: 20, fontStyle: 'italic' },
    logoutBtn: { marginTop: 50, paddingVertical: 18, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', alignItems: 'center' },
    logoutText: { color: THEME_COLORS.error, fontWeight: 'bold', letterSpacing: 2, fontSize: 12 }
});

export default ProfileScreen;