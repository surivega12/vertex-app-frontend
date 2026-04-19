import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Animated, Pressable, Modal, Platform, StatusBar, ActivityIndicator } from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import Slider from '@react-native-community/slider';
import { BlurView } from 'expo-blur';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { PanGestureHandler } from 'react-native-gesture-handler';
import * as ScreenOrientation from 'expo-screen-orientation';

// 🎨 ADN Visual y Configuración de la Bóveda
import { THEME_COLORS, JELLYFIN_CONFIG } from '../src/theme/Config';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const VideoPlayerScreen = ({ route, navigation }) => {
    const { movie, sourceURI, qualityName, isOffline, startAt = 0 } = route.params;
    const isSeries = movie?.type === 'series' || movie?.type === 'anime';

    // 📡 Configuración de la Nube
    const JELLYFIN_URL = JELLYFIN_CONFIG.URL;
    const API_KEY = JELLYFIN_CONFIG.API_KEY;

    const videoRef = useRef(null);
    const timeoutRef = useRef(null);
    const hideGestureTimer = useRef(null);

    const [showControls, setShowControls] = useState(true);
    const [status, setStatus] = useState({});
    const fadeAnim = useRef(new Animated.Value(1)).current;

    const [isSliding, setIsSliding] = useState(false);
    const [sliderValue, setSliderValue] = useState(0);

    const [isLocked, setIsLocked] = useState(false);
    const [resizeMode, setResizeMode] = useState(ResizeMode.CONTAIN);
    const [showTracksModal, setShowTracksModal] = useState(false);

    // 🔊 ESTADOS PARA PISTAS DE AUDIO Y SUBTÍTULOS
    const [audioTracks, setAudioTracks] = useState([]);
    const [subTracks, setSubTracks] = useState([]);
    const [activeAudio, setActiveAudio] = useState(null);
    const [activeSub, setActiveSub] = useState(null);
    const [activeVideoUrl, setActiveVideoUrl] = useState(sourceURI);

    // 🔄 EFECTO: Orientación de Pantalla y Controles
    useEffect(() => {
        if (Platform.OS !== 'web') {
            ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
            StatusBar.setHidden(true);
        }
        resetControlsTimer();
        return () => {
            if (Platform.OS !== 'web') {
                ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
                StatusBar.setHidden(false);
            }
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
        };
    }, []);

    // 🌐 EFECTO: Cargar pistas desde Jellyfin (Solo streaming)
    useEffect(() => {
        if (!isOffline && movie?.id) {
            fetchMediaTracks();
        }
    }, []);

    const fetchMediaTracks = async () => {
        try {
            const response = await fetch(`${JELLYFIN_URL}/Items/${movie.id}?api_key=${API_KEY}`);
            const data = await response.json();

            if (data.MediaSources && data.MediaSources.length > 0) {
                const streams = data.MediaSources[0].MediaStreams;
                setAudioTracks(streams.filter(s => s.Type === 'Audio'));
                setSubTracks(streams.filter(s => s.Type === 'Subtitle'));
            }
        } catch (error) {
            console.log("Error leyendo pistas del MKV");
        }
    };

    const changeTrack = (audioIndex, subIndex) => {
        let newUrl = sourceURI;
        if (audioIndex !== null) newUrl += `&AudioStreamIndex=${audioIndex}`;
        if (subIndex !== null) newUrl += `&SubtitleStreamIndex=${subIndex}`;

        setActiveVideoUrl(newUrl);
        setShowTracksModal(false);
    };

    const resetControlsTimer = () => {
        if (isSliding || isLocked) return;
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        setShowControls(true);
        Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }).start();

        timeoutRef.current = setTimeout(() => {
            if (!isSliding) {
                Animated.timing(fadeAnim, { toValue: 0, duration: 400, useNativeDriver: true }).start(() => setShowControls(false));
            }
        }, 5000);
    };

    const togglePlayPause = () => {
        resetControlsTimer();
        if (status.isPlaying) videoRef.current.pauseAsync();
        else videoRef.current.playAsync();
    };

    const skipRelative = async (millis) => {
        resetControlsTimer();
        if (status.positionMillis !== undefined) {
            await videoRef.current.setPositionAsync(
                Math.max(0, Math.min(status.durationMillis || 0, status.positionMillis + millis))
            );
        }
    };

    const formatTime = (millis) => {
        if (!millis || isNaN(millis)) return "00:00";
        const totalSeconds = Math.floor(millis / 1000);
        const h = Math.floor(totalSeconds / 3600);
        const m = Math.floor((totalSeconds % 3600) / 60);
        const s = totalSeconds % 60;
        return h > 0 ? `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}` : `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const duration = status.durationMillis || 1;
    const position = isSliding ? sliderValue : (status.positionMillis || 0);
    const showSkipIntroBtn = isSeries && position > 5000 && position < 90000;

    return (
        <View style={styles.playerContainer}>
            {/* 💎 MODAL DE AUDIOS Y SUBTÍTULOS */}
            <Modal visible={showTracksModal} transparent={true} animationType="fade">
                <BlurView intensity={80} tint="dark" style={styles.tracksOverlay}>
                    <View style={styles.tracksContainer}>
                        <View style={{ flex: 1, paddingRight: 10, borderRightWidth: 1, borderColor: 'rgba(255,255,255,0.1)' }}>
                            <Text style={styles.trackTitle}>Audio</Text>
                            {audioTracks.map((audio) => (
                                <TouchableOpacity key={audio.Index} style={styles.trackItem} onPress={() => { setActiveAudio(audio.Index); changeTrack(audio.Index, activeSub); }}>
                                    <Text style={{ color: activeAudio === audio.Index ? THEME_COLORS.gold : '#fff' }}>{audio.DisplayTitle || audio.Language}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                        <View style={{ flex: 1, paddingLeft: 10 }}>
                            <Text style={styles.trackTitle}>Subtítulos</Text>
                            <TouchableOpacity style={styles.trackItem} onPress={() => { setActiveSub(null); changeTrack(activeAudio, null); }}>
                                <Text style={{ color: activeSub === null ? THEME_COLORS.gold : '#fff' }}>Desactivado</Text>
                            </TouchableOpacity>
                            {subTracks.map((sub) => (
                                <TouchableOpacity key={sub.Index} style={styles.trackItem} onPress={() => { setActiveSub(sub.Index); changeTrack(activeAudio, sub.Index); }}>
                                    <Text style={{ color: activeSub === sub.Index ? THEME_COLORS.gold : '#fff' }}>{sub.DisplayTitle || sub.Language}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                        <TouchableOpacity style={styles.closeModal} onPress={() => setShowTracksModal(false)}>
                            <Ionicons name="close-circle" size={30} color={THEME_COLORS.textMuted} />
                        </TouchableOpacity>
                    </View>
                </BlurView>
            </Modal>

            <PanGestureHandler>
                <Pressable style={styles.videoWrapper} onPress={() => showControls ? setShowControls(false) : resetControlsTimer()}>
                    <Video
                        ref={videoRef}
                        style={StyleSheet.absoluteFillObject}
                        resizeMode={resizeMode}
                        source={{ uri: activeVideoUrl }}
                        shouldPlay={true}
                        onPlaybackStatusUpdate={s => setStatus(() => s)}
                        onLoad={() => { if (startAt > 0) videoRef.current.setPositionAsync(startAt); }}
                    />
                </Pressable>
            </PanGestureHandler>

            {/* ⏭️ BOTÓN SALTAR INTRO */}
            {showSkipIntroBtn && showControls && (
                <TouchableOpacity style={styles.skipBtn} onPress={() => skipRelative(85000)}>
                    <Text style={{ color: '#fff', fontWeight: 'bold' }}>Saltar Intro</Text>
                    <Ionicons name="play-skip-forward" size={16} color="#fff" style={{ marginLeft: 8 }} />
                </TouchableOpacity>
            )}

            {/* 🎮 CAPA DE CONTROLES VIP */}
            {!isLocked && showControls && (
                <Animated.View style={[styles.controls, { opacity: fadeAnim }]} pointerEvents="box-none">
                    <View style={styles.topBar}>
                        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
                            <Ionicons name="chevron-back" size={28} color="#fff" />
                        </TouchableOpacity>
                        <View style={{ flex: 1, marginLeft: 15 }}>
                            <Text style={styles.title} numberOfLines={1}>{movie.title}</Text>
                            <Text style={styles.subtitle}>{qualityName} {isOffline ? '(Bóveda Local)' : '(Streaming)'}</Text>
                        </View>
                        <TouchableOpacity style={styles.iconBtn} onPress={() => setShowTracksModal(true)}>
                            <MaterialIcons name="subtitles" size={24} color="#fff" />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.centerRow}>
                        <TouchableOpacity onPress={() => skipRelative(-10000)}><MaterialIcons name="replay-10" size={50} color="#fff" /></TouchableOpacity>
                        <TouchableOpacity onPress={togglePlayPause} style={styles.playBtn}>
                            <Ionicons name={status.isPlaying ? "pause" : "play"} size={60} color={THEME_COLORS.gold} />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => skipRelative(10000)}><MaterialIcons name="forward-10" size={50} color="#fff" /></TouchableOpacity>
                    </View>

                    <View style={styles.bottomBar}>
                        <Text style={styles.timeText}>{formatTime(position)}</Text>
                        <Slider
                            style={{ flex: 1, height: 40 }}
                            minimumValue={0}
                            maximumValue={duration}
                            value={position}
                            minimumTrackTintColor={THEME_COLORS.gold}
                            maximumTrackTintColor="rgba(255,255,255,0.3)"
                            thumbTintColor="#fff"
                            onSlidingStart={() => setIsSliding(true)}
                            onSlidingComplete={val => { setIsSliding(false); videoRef.current.setPositionAsync(val); resetControlsTimer(); }}
                        />
                        <Text style={styles.timeText}>{formatTime(duration)}</Text>
                        <TouchableOpacity onPress={() => setResizeMode(prev => prev === ResizeMode.CONTAIN ? ResizeMode.COVER : ResizeMode.CONTAIN)}>
                            <Ionicons name="crop" size={22} color="#fff" style={{ marginLeft: 15 }} />
                        </TouchableOpacity>
                    </View>
                </Animated.View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    playerContainer: { flex: 1, backgroundColor: '#000' },
    videoWrapper: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center' },
    controls: { ...StyleSheet.absoluteFillObject, justifyContent: 'space-between', padding: 25, backgroundColor: 'rgba(0,0,0,0.3)' },
    topBar: { flexDirection: 'row', alignItems: 'center' },
    title: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
    subtitle: { color: THEME_COLORS.textMuted, fontSize: 12 },
    centerRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 60 },
    playBtn: { width: 90, height: 90, borderRadius: 45, borderWidth: 1.5, borderColor: THEME_COLORS.gold, justifyContent: 'center', alignItems: 'center' },
    bottomBar: { flexDirection: 'row', alignItems: 'center' },
    timeText: { color: '#fff', fontSize: 12, width: 50, textAlign: 'center' },
    iconBtn: { width: 45, height: 45, borderRadius: 23, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center' },
    skipBtn: { position: 'absolute', bottom: 100, right: 30, flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.6)', padding: 12, borderRadius: 10, borderWidth: 1, borderColor: THEME_COLORS.glassBorder },
    tracksOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    tracksContainer: { width: '80%', height: '70%', backgroundColor: 'rgba(5,5,5,0.9)', borderRadius: 20, padding: 25, flexDirection: 'row', borderWidth: 1, borderColor: THEME_COLORS.glassBorder },
    trackTitle: { color: THEME_COLORS.gold, fontWeight: 'bold', marginBottom: 15 },
    trackItem: { paddingVertical: 12 },
    closeModal: { position: 'absolute', top: 15, right: 15 }
});

export default VideoPlayerScreen;