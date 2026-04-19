import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Dimensions, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import axios from 'axios';

// 🎨 Importamos el ADN Visual y la Configuración
import { THEME_COLORS, JELLYFIN_CONFIG } from './src/theme/Config';

const { width, height } = Dimensions.get('window');

const JELLYFIN_URL = JELLYFIN_CONFIG.URL;
const JELLYFIN_AUTH_URL = JELLYFIN_CONFIG.AUTH_URL; // 👈 URL con credenciales de Swizzin
const API_KEY = JELLYFIN_CONFIG.API_KEY;

const Catalog = () => {
    const navigation = useNavigation();
    const [loading, setLoading] = useState(true);
    const [movies, setMovies] = useState([]);
    const [series, setSeries] = useState([]);
    const [featured, setFeatured] = useState(null);

    // 🟢 Ajuste para que las portadas carguen usando el Pase VIP
    const getImageUrl = (itemId) =>
        `${JELLYFIN_AUTH_URL}/Items/${itemId}/Images/Primary?api_key=${API_KEY}&fillWidth=400&quality=90`;

    const getBackdropUrl = (itemId) =>
        `${JELLYFIN_AUTH_URL}/Items/${itemId}/Images/Backdrop?api_key=${API_KEY}&maxWidth=1920&quality=90`;

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            // 🟢 Creamos un cliente con el Pase VIP para saltar a Nginx
            const client = axios.create({
                headers: { 'Authorization': JELLYFIN_CONFIG.BASIC_AUTH }
            });

            // 1. Obtenemos el ID del Usuario de Jellyfin
            const usersRes = await client.get(`${JELLYFIN_URL}/Users?api_key=${API_KEY}`);
            const userId = usersRes.data[0].Id;

            // 2. Traemos las últimas Películas y Series en paralelo
            const [mRes, sRes] = await Promise.all([
                client.get(`${JELLYFIN_URL}/Users/${userId}/Items?IncludeItemTypes=Movie&Limit=15&Recursive=true&api_key=${API_KEY}`),
                client.get(`${JELLYFIN_URL}/Users/${userId}/Items?IncludeItemTypes=Series&Limit=15&Recursive=true&api_key=${API_KEY}`)
            ]);

            const mapData = (items, type) => items.map(item => ({
                id: item.Id,
                title: item.Name,
                overview: item.Overview,
                year: item.ProductionYear,
                thumb: getImageUrl(item.Id),
                bgImage: getBackdropUrl(item.Id),
                type: type
            }));

            setMovies(mapData(mRes.data.Items, 'movie'));
            setSeries(mapData(sRes.data.Items, 'series'));

            // Elegimos la primera película como destacada (Hero)
            if (mRes.data.Items.length > 0) {
                setFeatured(mapData([mRes.data.Items[0]], 'movie')[0]);
            }

        } catch (error) {
            console.log("Error de conexión a Jellyfin:", error.message);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <View style={styles.loaderContainer}>
                <ActivityIndicator size="large" color={THEME_COLORS.gold} />
                <Text style={styles.loaderText}>ABRIENDO BÓVEDA...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <ScrollView showsVerticalScrollIndicator={false} bounces={false}>

                {/* 1. HERO BANNER PREMIUM */}
                <View style={styles.heroContainer}>
                    {featured && (
                        <>
                            <Image source={{ uri: featured.bgImage }} style={styles.heroImage} />
                            <LinearGradient
                                colors={['transparent', 'rgba(5,5,5,0.6)', THEME_COLORS.bgAbsolute]}
                                style={StyleSheet.absoluteFillObject}
                            />
                            <View style={styles.heroContent}>
                                <Text style={styles.heroBrand}>VERTƎX ORIGINAL</Text>
                                <Text style={styles.heroTitle}>{featured.title}</Text>
                                <TouchableOpacity
                                    style={styles.heroBtn}
                                    onPress={() => navigation.navigate('MovieDetails', { movie: featured })}
                                >
                                    <BlurView intensity={30} tint="light" style={styles.heroBtnGlass}>
                                        <Ionicons name="play" size={18} color="#fff" />
                                        <Text style={styles.heroBtnText}>VER AHORA</Text>
                                    </BlurView>
                                </TouchableOpacity>
                            </View>
                        </>
                    )}
                </View>

                {/* 2. FILAS DE CONTENIDO */}
                <MediaRow
                    title="Tendencias VIP"
                    data={movies}
                    onSelect={(m) => navigation.navigate('MovieDetails', { movie: m })}
                />

                <MediaRow
                    title="Series Premium"
                    data={series}
                    onSelect={(s) => navigation.navigate('MovieDetails', { movie: s })}
                />

                <View style={{ height: 120 }} />
            </ScrollView>
        </View>
    );
};

const MediaRow = ({ title, data, onSelect }) => (
    <View style={styles.rowContainer}>
        <Text style={styles.rowTitle}>{title}</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.rowScroll}>
            {data.map(item => (
                <TouchableOpacity key={item.id} style={styles.card} onPress={() => onSelect(item)}>
                    <Image source={{ uri: item.thumb }} style={styles.poster} />
                    <View style={styles.cardBisel} />
                </TouchableOpacity>
            ))}
        </ScrollView>
    </View>
);

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: THEME_COLORS.bgAbsolute },
    loaderContainer: { flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' },
    loaderText: { color: THEME_COLORS.gold, marginTop: 10, fontWeight: 'bold', letterSpacing: 1 },
    heroContainer: { width: '100%', height: height * 0.70 },
    heroImage: { width: '100%', height: '100%' },
    heroContent: { position: 'absolute', bottom: 40, left: 25, width: '80%' },
    heroBrand: { color: THEME_COLORS.gold, fontSize: 12, fontWeight: 'bold', letterSpacing: 3, marginBottom: 10 },
    heroTitle: { color: '#fff', fontSize: 38, fontWeight: '900', textTransform: 'uppercase', marginBottom: 20 },
    heroBtn: { width: 160, height: 50, borderRadius: 12, overflow: 'hidden' },
    heroBtnGlass: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, borderWidth: 1, borderColor: THEME_COLORS.glassBorder },
    heroBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 13, letterSpacing: 1 },
    rowContainer: { marginTop: 30 },
    rowTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginLeft: 20, marginBottom: 15 },
    rowScroll: { paddingLeft: 20, paddingRight: 10 },
    card: { width: 130, height: 195, marginRight: 15, borderRadius: 12, overflow: 'hidden', backgroundColor: '#111' },
    poster: { width: '100%', height: '100%' },
    cardBisel: { ...StyleSheet.absoluteFillObject, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', borderRadius: 12 }
});

export default Catalog;