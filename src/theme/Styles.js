// src/theme/Styles.js
import { StyleSheet, Platform } from 'react-native';

export const COLORS = {
    bgAbsolute: '#050505',
    gold: '#c1915f',
    goldLight: '#ebd197',
    glassBg: 'rgba(255, 255, 255, 0.06)', // El efecto esmerilado
    glassBorder: 'rgba(255, 255, 255, 0.15)', // El bisel de 1px
    textMain: '#FFFFFF',
    textMuted: '#888888',
    error: '#ff4444'
};

export const GLASS_THEME = StyleSheet.create({
    panel: {
        backgroundColor: COLORS.glassBg,
        borderRadius: 22,
        borderWidth: 1.2,
        borderColor: COLORS.glassBorder,
        ...Platform.select({
            ios: {
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 12 },
                shadowOpacity: 0.5,
                shadowRadius: 16,
            },
            android: {
                elevation: 10,
            },
        }),
    },
    textShadow: {
        textShadowColor: 'rgba(0, 0, 0, 0.75)',
        textShadowOffset: { width: -1, height: 1 },
        textShadowRadius: 10
    }
});