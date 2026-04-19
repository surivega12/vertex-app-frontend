import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Dimensions, Platform, Pressable } from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import Slider from '@react-native-community/slider';
import { MaterialIcons, Ionicons, FontAwesome } from '@expo/vector-icons';
import * as ScreenOrientation from 'expo-screen-orientation';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const COLORS = { bg: '#000', oro: '#d4af37' };

// AHORA RECIBE LA VARIABLE "isSeries"
const VideoPlayer = ({ sourceURI, isSeries, onBack }) => {
    const videoRef = useRef(null);

    const [paused, setPaused] = useState(false);
    const [progress, setProgress] = useState(0);
    const [duration, setDuration] = useState(0);
    const [showControls, setShowControls] = useState(true);
    const [isLoading, setIsLoading] = useState(true);
    const [resizeMode, setResizeMode] = useState(ResizeMode.CONTAIN);
    const [interactionTimer, setInteractionTimer] = useState(null);

    useEffect(() => {
        ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
        return () => { ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP); };
    }, []);

    useEffect(() => {
        if (showControls && !paused && !isLoading) {
            const timer = setTimeout(() => setShowControls(false), 3500);
            setInteractionTimer(timer);
            return () => timer && clearTimeout(timer);
        }
    }, [showControls, paused, isLoading]);

    const handleMainContainerTap = () => {
        if (interactionTimer) clearTimeout(interactionTimer);
        setShowControls(prev => !prev);
    };

    const formatTime = (seconds) => {
        if (!seconds || isNaN(seconds)) return "00:00";
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = Math.floor(seconds % 60);
        const hVal = h > 0 ? `${h < 10 ? '0' : ''}${h}:` : '';
        const mVal = `${m < 10 ? '0' : ''}${m}:`;
        const sVal = `${s < 10 ? '0' : ''}${s}`;
        return hVal + mVal + sVal;
    };

    const handlePlaybackStatusUpdate = (status) => {
        if (status.isLoaded) {
            setProgress(status.positionMillis / 1000);
            setDuration(status.durationMillis / 1000);
            setPaused(!status.isPlaying);
            setIsLoading(false);
        }
    };

    const handleSeek = (value) => {
        if (videoRef.current) {
            videoRef.current.setPositionAsync(value * 1000);
            setShowControls(true);
        }
    };

    const seekRelative = (seconds) => {
        if (videoRef.current) {
            videoRef.current.setPositionAsync((progress + seconds) * 1000);
            setShowControls(true);
        }
    };

    const handleTogglePlayPause = async () => {
        if (!videoRef.current) return;
        if (paused) await videoRef.current.playAsync();
        else await videoRef.current.pauseAsync();
    };

    const toggleResizeMode = () => {
        if (resizeMode === ResizeMode.CONTAIN) setResizeMode(ResizeMode.COVER);
        else if (resizeMode === ResizeMode.COVER) setResizeMode(ResizeMode.STRETCH);
        else setResizeMode(ResizeMode.CONTAIN);
    };

    const renderControls = () => (
        <View style={styles.controlsOverlay}>

            {/* Cabecera Flotante */}
            <View style={styles.headerPanel}>
                <TouchableOpacity onPress={onBack} style={styles.backBtn}>
                    <Ionicons name="chevron-back" size={32} color={COLORS.oro} />
                </TouchableOpacity>
                <Text style={styles.videoTitle} numberOfLines={1}>Matrix Resurrecciones (4K VIP)</Text>
                <View style={styles.topRightControls}>
                    <TouchableOpacity style={styles.iconBtn}><MaterialIcons name="picture-in-picture-alt" size={24} color="#fff" /></TouchableOpacity>
                    <TouchableOpacity style={styles.iconBtn}><FontAwesome name="commenting-o" size={24} color="#fff" /></TouchableOpacity>
                    <TouchableOpacity style={styles.iconBtn}><MaterialIcons name="closed-caption-off" size={24} color="#fff" /></TouchableOpacity>
                </View>
            </View>

            {/* Controles Centrales Flotantes */}
            <View style={styles.centerControls}>
                <TouchableOpacity style={styles.centerIconBtn} onPress={() => seekRelative(-10)}><MaterialIcons name="replay-10" size={45} color="#fff" /></TouchableOpacity>
                <TouchableOpacity style={styles.playPauseBtn} onPress={handleTogglePlayPause}>
                    <Ionicons name={paused ? 'play' : 'pause'} size={55} color={COLORS.oro} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.centerIconBtn} onPress={() => seekRelative(10)}><MaterialIcons name="forward-10" size={45} color="#fff" /></TouchableOpacity>
            </View>

            {/* Acciones y Línea de tiempo flotante integradas a la imagen */}
            <View style={styles.bottomArea}>
                {/* ESTO SOLO APARECE SI ES SERIE */}
                {isSeries && (
                    <View style={styles.actionsRow}>
                        {progress > 5 && progress < 90 ? (
                            <TouchableOpacity style={styles.actionButtonGold} onPress={() => seekRelative(85)}>
                                <Text style={styles.actionButtonTextGold}>Saltar Intro</Text>
                            </TouchableOpacity>
                        ) : <View style={{ flex: 1 }} />}

                        <View style={styles.seriesControls}>
                            <TouchableOpacity style={styles.actionButton}><MaterialIcons name="format-list-bulleted" size={20} color="#fff" /><Text style={styles.actionButtonText}>Episodios</Text></TouchableOpacity>
                            <TouchableOpacity style={styles.actionButton}><MaterialIcons name="skip-next" size={20} color="#fff" /><Text style={styles.actionButtonText}>Siguiente</Text></TouchableOpacity>
                        </View>
                    </View>
                )}

                {/* Footer sin cajas de fondo, integrado al video */}
                <View style={styles.footerPanel}>
                    <Text style={styles.timeText}>{formatTime(progress)}</Text>
                    <Slider
                        style={styles.slider}
                        minimumValue={0}
                        maximumValue={duration || 1}
                        value={progress}
                        onValueChange={handleSeek}
                        minimumTrackTintColor={COLORS.oro}
                        maximumTrackTintColor="rgba(255,255,255,0.4)"
                        thumbTintColor={COLORS.oro}
                    />
                    <Text style={styles.timeText}>{formatTime(duration)}</Text>
                    <TouchableOpacity style={styles.fullscreenBtn} onPress={toggleResizeMode}>
                        <MaterialIcons name={resizeMode === ResizeMode.CONTAIN ? "aspect-ratio" : resizeMode === ResizeMode.COVER ? "crop-free" : "settings-overscan"} size={26} color="#fff" />
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );

    return (
        <Pressable style={styles.container} onPress={handleMainContainerTap}>
            <Video
                ref={videoRef}
                source={{ uri: sourceURI }}
                style={styles.video}
                resizeMode={resizeMode}
                shouldPlay={false}
                onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
                useNativeControls={false}
            />
            {isLoading && (
                <View style={styles.loaderContainer}>
                    <ActivityIndicator size="large" color={COLORS.oro} />
                </View>
            )}
            {showControls && renderControls()}
        </Pressable>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.bg },
    video: { width: '100%', height: '100%', position: 'absolute' },
    loaderContainer: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center', zIndex: 10 },
    // El overlay cubre toda la pantalla, pero tiene un fondo sutil oscuro para que los iconos blancos resalten sobre escenas claras
    controlsOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'space-between', padding: 25, zIndex: 5 },

    headerPanel: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    backBtn: { padding: 5 },
    videoTitle: { color: '#fff', fontWeight: 'bold', fontSize: 18, flex: 1, textAlign: 'left', marginLeft: 15 },
    topRightControls: { flexDirection: 'row', gap: 25 },
    iconBtn: { alignItems: 'center', justifyContent: 'center' },

    centerControls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 70 },
    playPauseBtn: { width: 80, height: 80, borderRadius: 40, borderWidth: 2, borderColor: COLORS.oro, justifyContent: 'center', alignItems: 'center' },
    centerIconBtn: { padding: 10 },

    bottomArea: { width: '100%' },
    actionsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
    seriesControls: { flexDirection: 'row', gap: 15, marginLeft: 'auto' },
    actionButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 5, borderWidth: 1, borderColor: '#555' },
    actionButtonText: { color: '#fff', marginLeft: 5, fontSize: 14, fontWeight: 'bold' },
    actionButtonGold: { backgroundColor: 'rgba(212, 175, 55, 0.2)', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 5, borderWidth: 1, borderColor: COLORS.oro },
    actionButtonTextGold: { color: COLORS.oro, fontSize: 14, fontWeight: 'bold' },

    footerPanel: { flexDirection: 'row', alignItems: 'center' },
    timeText: { color: '#fff', fontSize: 13, width: 55, textAlign: 'center', fontWeight: '600' },
    slider: { flex: 1, marginHorizontal: 10, height: 40 },
    fullscreenBtn: { marginLeft: 10, padding: 5 }
});

export default VideoPlayer;