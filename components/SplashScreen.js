import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    Easing
} from 'react-native-reanimated';

const SplashScreen = ({ onAnimationFinish }) => {
    const containerOpacity = useSharedValue(1);
    const logoScale = useSharedValue(4);
    const logoOpacity = useSharedValue(0);

    useEffect(() => {
        // 1. Fase de Entrada (1.2 segundos): El logo aparece y se achica
        logoOpacity.value = withTiming(1, { duration: 600 });
        logoScale.value = withTiming(1, {
            duration: 1200,
            easing: Easing.bezier(0.16, 1, 0.3, 1)
        });

        // 2. Freno Físico 1: A los 2.5 segundos se desvanece todo el fondo
        const fadeTimer = setTimeout(() => {
            containerOpacity.value = withTiming(0, { duration: 800 });
        }, 2500);

        // 3. Freno Físico 2: A los 3.3 segundos exactos, damos paso al catálogo
        const unmountTimer = setTimeout(() => {
            if (onAnimationFinish) {
                onAnimationFinish(); // Ya no necesitamos runOnJS aquí
            }
        }, 3300); // 2500 + 800 milisegundos

        // Limpieza de memoria si la app se cierra antes
        return () => {
            clearTimeout(fadeTimer);
            clearTimeout(unmountTimer);
        };
    }, []);

    const animatedContainerStyle = useAnimatedStyle(() => ({
        opacity: containerOpacity.value,
    }));

    const animatedLogoStyle = useAnimatedStyle(() => ({
        opacity: logoOpacity.value,
        transform: [
            { rotateY: '180deg' },
            { scale: logoScale.value }
        ]
    }));

    return (
        <Animated.View style={[styles.container, animatedContainerStyle]}>
            <Animated.View style={animatedLogoStyle}>
                <Animated.Text style={styles.textƎ}>E</Animated.Text>
            </Animated.View>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: '#050505', // Negro Bóveda
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 9999
    },
    textƎ: {
        fontSize: 100,
        fontWeight: 'bold',
        color: '#D4AF37', // Dorado VERTƎX
        fontFamily: 'serif',
        textShadowColor: 'rgba(212, 175, 55, 0.8)',
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 25
    }
});

export default SplashScreen;