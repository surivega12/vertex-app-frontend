import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator, Dimensions, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import axios from 'axios';

// 🎨 ADN Visual y Configuración Global
import { THEME_COLORS, JELLYFIN_CONFIG } from '../src/theme/Config';

const { width } = Dimensions.get('window');

const JELLYFIN_URL = JELLYFIN_CONFIG.URL;
const JELLYFIN_AUTH_URL = JELLYFIN_CONFIG.AUTH_URL;
const API_KEY = JELLYFIN_CONFIG.API_KEY;

// 🖼️ Generador de imágenes usando el Pase VIP de Swizzin
const getImageUrl = (itemId) =>
    `${JELLYFIN_AUTH_URL}/Items/${itemId}/Images/Primary?api_key=${API_KEY}&fillWidth=200&quality=90`;

const SearchScreen = () => {
    const navigation = useNavigation();
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [userId, setUserId] = useState(null);

    // 🔑 1. Obtener el ID del Usuario de Jellyfin al iniciar (Con Pase VIP)
    useEffect(() => {
        const fetchUser = async () => {
            try {
                const res = await axios.get(`${JELLYFIN_URL}/Users?api_key=${API_KEY}`, {
                    headers: { 'Authorization': JELLYFIN_CONFIG.BASIC_AUTH }
                });
                if (res.data.length > 0) setUserId(res.data[0].Id);
            } catch (e) {
                console.log("Error conectando a la base de datos de usuarios");
            }
        };
        fetchUser();
    }, []);

    // 🛰️ 2. Lógica de búsqueda en tiempo real en la nube
    const handleSearch = async (text) => {
        setSearchQuery(text);

        if (!text.trim() || !userId) {
            setSearchResults([]);
            return;
        }

        setIsSearching(true);
        try {
            // Buscamos en el catálogo remoto inyectando el Pase VIP para saltar a Nginx
            const response = await axios.get(
                `${JELLYFIN_URL}/Users/${userId}/Items?searchTerm=${text}&IncludeItemTypes=Movie,Series&Recursive=true&Limit=20&api_key=${API_KEY}`,
                { headers: { 'Authorization': JELLYFIN_CONFIG.BASIC_AUTH } }
            );

            const mappedResults = response.data.Items.map(item => ({
                id: item.Id,
                title: item.Name,
                overview: item.Overview,
                year: item.ProductionYear,
                rating: item.OfficialRating,
                thumb: getImageUrl(item.Id),
                bgImage: `${JELLYFIN_AUTH_URL}/Items/${item.Id}/Images/Backdrop?api_key=${API_KEY}`,
                type: item.Type.toLowerCase()
            }));

            setSearchResults(mappedResults);
        } catch (error) {
            console.log("Error consultando la Bóveda:", error.message);
        } finally {
            setIsSearching(false);
        }
    };

    return (
        <View style={styles.container}>
            {/* 💎 Cabecera y Barra de Búsqueda de Cristal */}
            <View style={styles.headerContainer}>
                <Text style={styles.headerTitle}>Explorar</Text>
                <BlurView intensity={30} tint="dark" style={styles.searchBarWrapper}>
                    <Ionicons name="search" size={22} color={THEME_COLORS.textMuted} style={{ marginLeft: 15 }} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Películas, series, géneros..."
                        placeholderTextColor={THEME_COLORS.textMuted}
                        value={searchQuery}
                        onChangeText={handleSearch}
                        autoFocus={true}
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity onPress={() => handleSearch("")} style={{ padding: 10 }}>
                            <Ionicons name="close-circle" size={20} color={THEME_COLORS.textMuted} />
                        </TouchableOpacity>
                    )}
                </BlurView>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {isSearching ? (
                    <ActivityIndicator size="large" color={THEME_COLORS.gold} style={{ marginTop: 50 }} />
                ) : (
                    <View style={styles.gridContainer}>
                        {searchResults.map((movie) => (
                            <TouchableOpacity
                                key={movie.id}
                                style={styles.gridPosterCard}
                                onPress={() => navigation.navigate('MovieDetails', { movie })}
                            >
                                <Image source={{ uri: movie.thumb }} style={styles.posterImage} />
                                <View style={styles.cardBisel} />
                            </TouchableOpacity>
                        ))}
                    </View>
                )}

                {/* 🏮 Estado Vacío */}
                {!isSearching && searchQuery.length > 0 && searchResults.length === 0 && (
                    <View style={styles.emptyStateContainer}>
                        <View style={styles.emptyIconCircle}>
                            <Ionicons name="film-outline" size={40} color={THEME_COLORS.gold} />
                        </View>
                        <Text style={styles.emptyTitle}>Sin resultados</Text>
                        <Text style={styles.emptySubtitle}>
                            No encontramos "{searchQuery}" en la Bóveda de VERTƎX.
                        </Text>
                    </View>
                )}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: THEME_COLORS.bgAbsolute },
    headerContainer: { paddingHorizontal: 25, paddingTop: Platform.OS === 'ios' ? 60 : 40, paddingBottom: 20 },
    headerTitle: { color: THEME_COLORS.textMain, fontSize: 32, fontWeight: 'bold', marginBottom: 20, letterSpacing: 1 },
    searchBarWrapper: { flexDirection: 'row', alignItems: 'center', height: 55, borderRadius: 16, borderWidth: 1.2, borderColor: THEME_COLORS.glassBorder, overflow: 'hidden' },
    searchInput: { flex: 1, color: THEME_COLORS.textMain, fontSize: 16, paddingHorizontal: 15, height: '100%' },
    scrollContent: { paddingHorizontal: 25, paddingBottom: 100 },
    gridContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
    gridPosterCard: { width: (width - 65) / 2, height: 250, borderRadius: 14, marginBottom: 15, overflow: 'hidden', backgroundColor: '#111' },
    posterImage: { width: '100%', height: '100%' },
    cardBisel: { ...StyleSheet.absoluteFillObject, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', borderRadius: 14 },
    emptyStateContainer: { alignItems: 'center', marginTop: 60, paddingHorizontal: 20 },
    emptyIconCircle: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center', marginBottom: 20, borderWidth: 1, borderColor: THEME_COLORS.glassBorder, backgroundColor: THEME_COLORS.glassBg },
    emptyTitle: { color: THEME_COLORS.textMain, fontSize: 20, fontWeight: 'bold', marginBottom: 10 },
    emptySubtitle: { color: THEME_COLORS.textMuted, fontSize: 14, textAlign: 'center', lineHeight: 22 }
});

export default SearchScreen;