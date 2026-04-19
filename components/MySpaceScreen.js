import React, { useState, useContext, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Alert, Dimensions, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import * as FileSystem from 'expo-file-system';

// 🎨 ADN Visual y Contexto
import { THEME_COLORS } from '../src/theme/Config'; // 👈 Importamos los colores globales del Paso 1
import { AppContext } from '../AppContext';

const { width } = Dimensions.get('window');

const MySpaceScreen = () => {
    const navigation = useNavigation();
    const { watchlist } = useContext(AppContext);

    const [downloadedFiles, setDownloadedFiles] = useState([]);

    // 🕵️ 1. Escanear la memoria del teléfono al entrar a la pantalla
    useFocusEffect(
        useCallback(() => {
            scanLocalDownloads();
        }, [])
    );

    const scanLocalDownloads = async () => {
        try {
            const dirUri = FileSystem.documentDirectory;
            const files = await FileSystem.readDirectoryAsync(dirUri);

            // Filtramos solo los archivos de video .mp4 de VERTƎX
            const mp4Files = files.filter(f => f.endsWith('.mp4'));

            const fileDetails = await Promise.all(mp4Files.map(async (fileName) => {
                const fileUri = dirUri + fileName;
                const info = await FileSystem.getInfoAsync(fileUri);

                // Formateamos el nombre (Ej: "Gladiador_1080p.mp4" -> "Gladiador")
                const nameParts = fileName.replace('.mp4', '').split('_');
                const cleanTitle = nameParts[0].replace(/_/g, ' ');
                const quality = nameParts[1] || 'Offline';
                const sizeInMB = (info.size / (1024 * 1024)).toFixed(1);

                return {
                    id: fileName,
                    uri: fileUri,
                    title: cleanTitle,
                    quality: quality,
                    size: sizeInMB
                };
            }));

            setDownloadedFiles(fileDetails);
        } catch (error) {
            console.log("Error escaneando descargas locales:", error);
        }
    };

    // 🗑️ 2. Lógica para eliminar descargas y liberar espacio
    const handleDeleteDownload = (uri, title) => {
        Alert.alert(
            "Eliminar de la Bóveda",
            `¿Deseas borrar permanentemente "${title}" de tu dispositivo?`,
            [
                { text: "Cancelar", style: "cancel" },
                {
                    text: "ELIMINAR",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await FileSystem.deleteAsync(uri);
                            scanLocalDownloads(); // Recargamos la lista
                        } catch (e) {
                            Alert.alert("Error", "No se pudo eliminar el archivo.");
                        }
                    }
                }
            ]
        );
    };

    // 🎬 3. Reproducir desde el archivo local (Modo Avión / Offline)
    const playOfflineVideo = (item) => {
        navigation.navigate('VideoPlayer', {
            movie: { title: item.title, id: item.id },
            sourceURI: item.uri,
            qualityName: item.quality,
            isOffline: true
        });
    };

    return (
        <View style={styles.container}>
            {/* Cabecera de la Bóveda */}
            <View style={styles.headerContainer}>
                <Text style={styles.headerTitle}>Mi Bóveda</Text>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                {/* --- SECCIÓN 1: CONTENIDO DESCARGADO --- */}
                <View style={styles.sectionContainer}>
                    <View style={styles.sectionHeader}>
                        <Ionicons name="cloud-done" size={20} color={THEME_COLORS.gold} />
                        <Text style={styles.sectionTitle}>DESCARGAS EN EL DISPOSITIVO</Text>
                    </View>

                    {downloadedFiles.length === 0 ? (
                        <View style={styles.emptyBox}>
                            <Ionicons name="download-outline" size={40} color={THEME_COLORS.textMuted} />
                            <Text style={styles.emptyText}>No tienes contenido descargado.</Text>
                        </View>
                    ) : (
                        <View style={styles.downloadsList}>
                            {downloadedFiles.map((file) => (
                                <View key={file.id} style={styles.downloadCard}>
                                    <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill} />

                                    <TouchableOpacity style={styles.downloadInfo} onPress={() => playOfflineVideo(file)}>
                                        <View style={styles.playIconBox}>
                                            <Ionicons name="play" size={24} color="#000" />
                                        </View>
                                        <View style={{ marginLeft: 15, flex: 1 }}>
                                            <Text style={styles.downloadTitle} numberOfLines={1}>{file.title}</Text>
                                            <Text style={styles.downloadMeta}>{file.quality} • {file.size} MB</Text>
                                        </View>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        style={styles.deleteBtn}
                                        onPress={() => handleDeleteDownload(file.uri, file.title)}
                                    >
                                        <Ionicons name="trash-outline" size={22} color={THEME_COLORS.error} />
                                    </TouchableOpacity>
                                </View>
                            ))}
                        </View>
                    )}
                </View>

                {/* --- SECCIÓN 2: LISTA DE SEGUIMIENTO (FAVORITOS) --- */}
                <View style={styles.sectionContainer}>
                    <View style={styles.sectionHeader}>
                        <Ionicons name="bookmark" size={20} color={THEME_COLORS.gold} />
                        <Text style={styles.sectionTitle}>LISTA DE SEGUIMIENTO</Text>
                    </View>

                    {watchlist.length === 0 ? (
                        <View style={styles.emptyBox}>
                            <Ionicons name="add-circle-outline" size={40} color={THEME_COLORS.textMuted} />
                            <Text style={styles.emptyText}>Tu lista de favoritos está vacía.</Text>
                        </View>
                    ) : (
                        <View style={styles.gridContainer}>
                            {watchlist.map((movie) => (
                                <TouchableOpacity
                                    key={movie.id}
                                    style={styles.gridPosterCard}
                                    onPress={() => navigation.navigate('MovieDetails', { movie })}
                                >
                                    <Image source={{ uri: movie.thumb || movie.bgImage }} style={styles.posterImage} />
                                    <View style={styles.cardBisel} />
                                </TouchableOpacity>
                            ))}
                        </View>
                    )}
                </View>

            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: THEME_COLORS.bgAbsolute },
    headerContainer: { paddingHorizontal: 25, paddingTop: Platform.OS === 'ios' ? 60 : 40, paddingBottom: 15 },
    headerTitle: { color: THEME_COLORS.textMain, fontSize: 32, fontWeight: 'bold', letterSpacing: 1 },
    scrollContent: { paddingHorizontal: 25, paddingBottom: 100 },
    sectionContainer: { marginTop: 25 },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
    sectionTitle: { color: THEME_COLORS.textMain, fontSize: 14, fontWeight: 'bold', letterSpacing: 2, marginLeft: 10 },
    emptyBox: { alignItems: 'center', justifyContent: 'center', paddingVertical: 40, backgroundColor: THEME_COLORS.glassBg, borderRadius: 16, borderWidth: 1, borderColor: THEME_COLORS.glassBorder },
    emptyText: { color: THEME_COLORS.textMuted, fontSize: 14, marginTop: 10, fontStyle: 'italic' },
    downloadsList: { gap: 12 },
    downloadCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 15, borderRadius: 16, borderWidth: 1.2, borderColor: THEME_COLORS.glassBorder, overflow: 'hidden' },
    downloadInfo: { flexDirection: 'row', alignItems: 'center', flex: 1 },
    playIconBox: { width: 45, height: 45, borderRadius: 23, backgroundColor: THEME_COLORS.gold, justifyContent: 'center', alignItems: 'center' },
    downloadTitle: { color: THEME_COLORS.textMain, fontSize: 16, fontWeight: 'bold' },
    downloadMeta: { color: THEME_COLORS.textMuted, fontSize: 12, marginTop: 4, fontWeight: '600' },
    deleteBtn: { padding: 10, backgroundColor: 'rgba(255, 68, 68, 0.1)', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255, 68, 68, 0.2)', marginLeft: 10 },
    gridContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
    gridPosterCard: { width: (width - 65) / 2, height: 250, borderRadius: 14, marginBottom: 15, overflow: 'hidden', backgroundColor: '#111' },
    posterImage: { width: '100%', height: '100%' },
    cardBisel: { ...StyleSheet.absoluteFillObject, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', borderRadius: 14 },
});

export default MySpaceScreen;