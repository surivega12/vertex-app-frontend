import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

// Paleta Vertex (Negro profundo y Oro)
const COLORS = {
    bg: '#000000',
    oro: '#d4af37',
    inputBg: 'rgba(255, 255, 255, 0.04)',
    inputBorder: 'rgba(212, 175, 55, 0.15)',
    textLight: '#fff',
    textMuted: '#999',
};

const Login = ({ onLoginSuccess }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <LinearGradient
                colors={['#0a0802', '#000000', '#0a0802']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFillObject}
            />

            <View style={styles.formContainer}>

                {/* CABECERA: Tu Logo Real */}
                <View style={styles.header}>
                    <Image
                        source={require('./logo-m.png')} // <--- NOMBRE CORREGIDO
                        style={styles.logoImage}
                        resizeMode="contain"
                    />
                    <Text style={styles.brandTitle}>Vertex<Text style={{ fontWeight: '300' }}>Premium</Text></Text>
                </View>

                {/* Caja de Login Limpia */}
                <View style={styles.loginBox}>
                    <Text style={styles.boxTitle}>Bienvenido a la Bóveda</Text>
                    <Text style={styles.boxSubtitle}>Ingresa el correo con el que activaste tu plan. Si es tu primera vez, crea una contraseña segura.</Text>

                    {/* Input Email */}
                    <View style={styles.inputWrapper}>
                        <Ionicons name="mail-outline" size={18} color={COLORS.textMuted} style={styles.icon} />
                        <TextInput
                            style={styles.input}
                            placeholder="Correo Electrónico de facturación"
                            placeholderTextColor={COLORS.textMuted}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            value={email}
                            onChangeText={setEmail}
                        />
                    </View>

                    {/* Input Password */}
                    <View style={styles.inputWrapper}>
                        <Ionicons name="lock-closed-outline" size={18} color={COLORS.textMuted} style={styles.icon} />
                        <TextInput
                            style={styles.input}
                            placeholder="Contraseña"
                            placeholderTextColor={COLORS.textMuted}
                            secureTextEntry
                            value={password}
                            onChangeText={setPassword}
                        />
                    </View>

                    {/* Botón Principal */}
                    <TouchableOpacity onPress={onLoginSuccess} activeOpacity={0.8} style={styles.loginBtn}>
                        <Text style={styles.loginBtnText}>Ingresar / Configurar</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.forgotPass}>
                        <Text style={styles.forgotText}>¿Olvidaste tu contraseña?</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.supportLink}>
                    <Text style={styles.supportText}>¿Necesitas ayuda? Visita vertexpremium.com</Text>
                </View>

            </View>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.bg, justifyContent: 'center', alignItems: 'center' },
    formContainer: { width: '100%', maxWidth: 450, padding: 30, alignItems: 'center' },

    header: { alignItems: 'center', marginBottom: 40 },
    logoImage: { width: 100, height: 100, tintColor: COLORS.oro }, // TintColor asegura que el PNG negro se pinte de dorado si hace falta
    brandTitle: { fontSize: 24, fontWeight: 'bold', color: COLORS.oro, letterSpacing: 1.5, marginTop: 10 },

    loginBox: { width: '100%', backgroundColor: 'rgba(212, 175, 55, 0.03)', borderWidth: 1, borderColor: COLORS.inputBorder, borderRadius: 20, padding: 25, alignItems: 'center' },
    boxTitle: { fontSize: 20, fontWeight: 'bold', color: COLORS.textLight, marginBottom: 8 },
    boxSubtitle: { fontSize: 13, color: COLORS.textMuted, marginBottom: 25, textAlign: 'center', lineHeight: 18 },

    inputWrapper: { flexDirection: 'row', alignItems: 'center', width: '100%', backgroundColor: COLORS.inputBg, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', borderRadius: 8, marginBottom: 15, paddingHorizontal: 15, height: 50 },
    icon: { marginRight: 12 },
    input: { flex: 1, color: COLORS.textLight, fontSize: 15 },

    loginBtn: { width: '100%', height: 50, backgroundColor: COLORS.oro, borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginTop: 10 },
    loginBtnText: { color: '#000', fontSize: 16, fontWeight: 'bold', letterSpacing: 1 },

    forgotPass: { marginTop: 20 },
    forgotText: { color: COLORS.oro, fontSize: 13 },

    supportLink: { marginTop: 40 },
    supportText: { color: COLORS.textMuted, fontSize: 12 }
});

export default Login;