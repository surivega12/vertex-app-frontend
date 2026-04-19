import React, { useContext, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, Animated, useWindowDimensions, StyleSheet } from 'react-native';
import { createDrawerNavigator, DrawerContentScrollView } from '@react-navigation/drawer';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// 🎨 IMPORTAMOS EL ADN VISUAL Y CONFIGURACIÓN
import { THEME_COLORS } from './src/theme/Config';
import { AppContext } from './AppContext';

// Importación de las pantallas principales
import HomeScreen from './Catalog'; // El escaparate principal
import SearchScreen from './components/SearchScreen'; // Buscador
import ProfileScreen from './components/ProfileScreen'; // Gestión de dispositivos
import MySpaceScreen from './components/MySpaceScreen'; // Descargas offline

const Drawer = createDrawerNavigator();
const Stack = createNativeStackNavigator();

// ==========================================
// 💎 COMPONENTE: BARRA LATERAL DE CRISTAL (TV)
// ==========================================
function CustomDrawerContent(props) {
    const [isExpanded, setIsExpanded] = useState(false);
    const widthAnim = useRef(new Animated.Value(70)).current;

    const toggleDrawer = (expand) => {
        setIsExpanded(expand);
        Animated.timing(widthAnim, {
            toValue: expand ? 220 : 70,
            duration: 300,
            useNativeDriver: false
        }).start();
    };

    return (
        <Animated.View
            style={[styles.drawerContainer, { width: widthAnim }]}
            onMouseEnter={() => toggleDrawer(true)}
            onMouseLeave={() => toggleDrawer(false)}
        >
            <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} />
            <DrawerContentScrollView {...props} contentContainerStyle={{ paddingTop: 50 }}>
                <MenuItem
                    icon="home-outline"
                    label="Inicio"
                    isExpanded={isExpanded}
                    onPress={() => props.navigation.navigate('Home')}
                />
                <MenuItem
                    icon="search-outline"
                    label="Explorar"
                    isExpanded={isExpanded}
                    onPress={() => props.navigation.navigate('Search')}
                />
                <MenuItem
                    icon="bookmark-outline"
                    label="Mi Bóveda"
                    isExpanded={isExpanded}
                    onPress={() => props.navigation.navigate('MySpace')}
                />
                <MenuItem
                    icon="person-outline"
                    label="Perfil"
                    isExpanded={isExpanded}
                    onPress={() => props.navigation.navigate('Profile')}
                />
            </DrawerContentScrollView>
        </Animated.View>
    );
}

const MenuItem = ({ icon, label, isExpanded, onPress }) => (
    <TouchableOpacity style={styles.menuItem} onPress={onPress}>
        <Ionicons name={icon} size={24} color={THEME_COLORS.gold} />
        {isExpanded && <Text style={styles.menuLabel}>{label}</Text>}
    </TouchableOpacity>
);

// ==========================================
// 📱 COMPONENTE: BARRA FLOTANTE MÓVIL
// ==========================================
const MobileBottomBar = () => {
    const navigation = useNavigation();

    return (
        <View style={styles.mobileBarWrapper}>
            <BlurView intensity={60} tint="dark" style={[StyleSheet.absoluteFill, { borderRadius: 30 }]} />
            <View style={styles.mobileBarContent}>
                <TouchableOpacity onPress={() => navigation.navigate('Home')}>
                    <Ionicons name="home" size={24} color={THEME_COLORS.gold} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => navigation.navigate('Search')}>
                    <Ionicons name="search" size={24} color={THEME_COLORS.textMuted} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => navigation.navigate('MySpace')}>
                    <Ionicons name="folder-open" size={24} color={THEME_COLORS.textMuted} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
                    <Ionicons name="person" size={24} color={THEME_COLORS.textMuted} />
                </TouchableOpacity>
            </View>
        </View>
    );
};

// ==========================================
// 🚀 FLUJO DE NAVEGACIÓN
// ==========================================
const MobileStack = () => (
    <Stack.Navigator screenOptions={{ headerShown: false, animation: 'fade' }}>
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Search" component={SearchScreen} />
        <Stack.Screen name="MySpace" component={MySpaceScreen} />
        <Stack.Screen name="Profile" component={ProfileScreen} />
    </Stack.Navigator>
);

export default function MainApp() {
    const { width } = useWindowDimensions();
    const isMobile = width < 768;

    return (
        <View style={{ flex: 1, backgroundColor: THEME_COLORS.bgAbsolute }}>
            {isMobile ? (
                <MobileStack />
            ) : (
                <Drawer.Navigator
                    drawerContent={(props) => <CustomDrawerContent {...props} />}
                    screenOptions={{
                        headerShown: false,
                        drawerType: 'permanent',
                        drawerStyle: { width: 70, backgroundColor: 'transparent' },
                        sceneContainerStyle: { backgroundColor: THEME_COLORS.bgAbsolute }
                    }}
                >
                    <Drawer.Screen name="HomeTV" component={HomeScreen} />
                </Drawer.Navigator>
            )}

            {isMobile && <MobileBottomBar />}
        </View>
    );
}

const styles = StyleSheet.create({
    drawerContainer: {
        height: '100%',
        borderRightWidth: 1.2,
        borderColor: THEME_COLORS.glassBorder,
        overflow: 'hidden',
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 20,
        paddingLeft: 22,
    },
    menuLabel: {
        marginLeft: 20,
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
    },
    mobileBarWrapper: {
        position: 'absolute',
        bottom: 30,
        alignSelf: 'center',
        width: '85%',
        height: 65,
        borderRadius: 30,
        borderWidth: 1.2,
        borderColor: THEME_COLORS.glassBorder,
        overflow: 'hidden',
    },
    mobileBarContent: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
    }
});