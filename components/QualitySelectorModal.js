import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ActivityIndicator } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';

// Importamos el ADN Visual que creamos antes
import { COLORS } from '../src/theme/Styles';

const QualitySelectorModal = ({ visible, onClose, onSelect, movie }) => {
    const [availableQualities, setAvailableQualities] = useState([]);
    const [isScanning, setIsScanning] = useState(true);

    useEffect(() => {
        if (visible && movie) {
            scanQualities();
        }
    }, [visible, movie]);

    const scanQualities = async () => {
        setIsScanning(true);

        // 1. Simulamos la lectura de calidades disponibles en tu servidor Jellyfin
        // En producción, esto vendría de los MediaSources del item de Jellyfin
        let serverQualities = movie.qualities || ['1080p HEVC', '4K HEVC'];

        // 2. Verificamos cuáles de estas versiones están descargadas localmente
        const safeTitle = movie.title ? movie.title.replace(/[^a-zA-Z0-9]/g, '_') : 'video';
        const scannedResults = [];

        for (const quality of serverQualities) {
            const fileUri = `${FileSystem.documentDirectory}${safeTitle}_${quality}.mp4`;
            try {
                const fileInfo = await FileSystem.getInfoAsync(fileUri);
                scannedResults.push({
                    name: quality,
                    isLocal: fileInfo.exists,
                    localUri: fileInfo.exists ? fileUri : null
                });
            } catch (error) {
                scannedResults.push({ name: quality, isLocal: false, localUri: null });
            }
        }

        setAvailableQualities(scannedResults);
        setIsScanning(false);
    };

    if (!visible) return null;

    return (
        <Modal visible={visible} transparent={true} animationType="fade">
            <BlurView intensity={70} tint="dark" style={styles.overlay}>
                <View style={styles.glassBox}>
                    <View style={styles.header}>
                        <Text style={styles.title}>SELECCIONAR CALIDAD</Text>
                        <Text style={styles.subtitle}>{movie?.title}</Text>
                    </View>

                    {isScanning ? (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="large" color={COLORS.gold} />
                            <Text style={styles.loadingText}>Escaneando bóveda...</Text>
                        </View>
                    ) : (
                        <View style={styles.optionsContainer}>
                            {availableQualities.map((q, index) => (
                                <TouchableOpacity
                                    key={index}
                                    style={[styles.btnQuality, q.isLocal && styles.btnQualityOffline]}
                                    onPress={() => onSelect(q)}
                                >
                                    <View style={styles.btnRow}>
                                        <Ionicons
                                            name={q.isLocal ? "cloud-done" : "cloud-download-outline"}
                                            size={22}
                                            color={q.isLocal ? "#000" : COLORS.gold}
                                        />
                                        <Text style={[styles.btnText, q.isLocal && styles.btnTextOffline]}>
                                            {q.name}
                                        </Text>
                                    </View>
                                    {q.isLocal && (
                                        <View style={styles.offlineBadge}>
                                            <Text style={styles.offlineText}>OFFLINE</Text>
                                        </View>
                                    )}
                                </TouchableOpacity>
                            ))}
                        </View>
                    )}

                    <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
                        <Text style={styles.cancelText}>CANCELAR</Text>
                    </TouchableOpacity>
                </View>
            </BlurView>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    glassBox: {
        width: '100%',
        maxWidth: 380,
        backgroundColor: COLORS.glassBg,
        borderRadius: 24,
        padding: 25,
        borderWidth: 1.2,
        borderColor: COLORS.glassBorder,
    },
    header: {
        alignItems: 'center',
        marginBottom: 25,
    },
    title: {
        color: COLORS.gold,
        fontSize: 14,
        fontWeight: 'bold',
        letterSpacing: 2,
        marginBottom: 5,
    },
    subtitle: {
        color: COLORS.textMain,
        fontSize: 18,
        fontWeight: '600',
        textAlign: 'center',
    },
    loadingContainer: {
        alignItems: 'center',
        paddingVertical: 30,
    },
    loadingText: {
        color: COLORS.textMuted,
        marginTop: 15,
        fontSize: 14,
    },
    optionsContainer: {
        width: '100%',
        gap: 12,
    },
    btnQuality: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: 'rgba(0,0,0,0.5)',
        paddingVertical: 16,
        paddingHorizontal: 20,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(193, 145, 95, 0.3)', // Borde dorado sutil
    },
    btnQualityOffline: {
        backgroundColor: COLORS.gold,
        borderColor: COLORS.gold,
    },
    btnRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    btnText: {
        color: COLORS.textMain,
        fontSize: 16,
        fontWeight: 'bold',
    },
    btnTextOffline: {
        color: '#000000',
    },
    offlineBadge: {
        backgroundColor: 'rgba(0,0,0,0.2)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    offlineText: {
        color: '#000',
        fontSize: 10,
        fontWeight: '900',
        letterSpacing: 1,
    },
    cancelBtn: {
        marginTop: 25,
        alignItems: 'center',
        paddingVertical: 10,
    },
    cancelText: {
        color: COLORS.textMuted,
        fontSize: 14,
        fontWeight: 'bold',
        letterSpacing: 1,
    }
});

export default QualitySelectorModal;