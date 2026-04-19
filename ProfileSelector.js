import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, KeyboardAvoidingView, Modal, TextInput } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const COLORS = {
    bg: '#000000',
    oro: '#d4af37',
    textLight: '#ffffff',
    textMuted: '#888888',
    avatarBorder: 'rgba(212, 175, 55, 0.4)',
    focusBg: 'rgba(212, 175, 55, 0.1)',
    subtleGold: '#0a0802', // El dorado casi invisible para el fondo
};

const ProfileSelector = ({ onSelectProfile }) => {

    // Lista de Perfiles VIP
    const [profiles, setProfiles] = useState([
        { id: '1', name: 'Master', pin: '0000' },
        { id: '2', name: 'Visita Cine', pin: null },
        { id: '3', name: 'Kids Hub', pin: '1234' }
    ]);

    const [focusedProfile, setFocusedProfile] = useState(null);
    const [isEditingMode, setIsEditingMode] = useState(false);

    // Estados para los Modales (Ventanas emergentes)
    const [modalVisible, setModalVisible] = useState(false);
    const [modalType, setModalType] = useState(''); // 'add' o 'edit'
    const [editingProfile, setEditingProfile] = useState(null);
    const [tempName, setTempName] = useState('');

    const handleProfileClick = (profile) => {
        if (isEditingMode) {
            openEditModal(profile);
            return;
        }
        if (profile.pin) {
            alert(`Ingrese PIN para ${profile.name} (Próximamente conectaremos la base de datos)`);
        } else {
            onSelectProfile(profile);
        }
    };

    // Funciones de Edición y Creación
    const openAddModal = () => {
        setModalType('add');
        setTempName('');
        setModalVisible(true);
    };

    const openEditModal = (profile) => {
        setModalType('edit');
        setEditingProfile(profile);
        setTempName(profile.name);
        setModalVisible(true);
    };

    const saveProfile = () => {
        if (tempName.trim() === '') return;

        if (modalType === 'add') {
            const newProfile = { id: Date.now().toString(), name: tempName, pin: null };
            setProfiles([...profiles, newProfile]);
        } else if (modalType === 'edit' && editingProfile) {
            const updatedProfiles = profiles.map(p =>
                p.id === editingProfile.id ? { ...p, name: tempName } : p
            );
            setProfiles(updatedProfiles);
        }
        setModalVisible(false);
    };

    const deleteProfile = () => {
        if (editingProfile) {
            const filteredProfiles = profiles.filter(p => p.id !== editingProfile.id);
            setProfiles(filteredProfiles);
            setModalVisible(false);
        }
    };

    const getInitial = (name) => name ? name.charAt(0).toUpperCase() : 'V';

    return (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
            {/* Degradado de fondo con el toque dorado sutil que pediste */}
            <LinearGradient colors={[COLORS.subtleGold, '#000000', COLORS.subtleGold]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFillObject} />

            <View style={styles.content}>
                <Text style={styles.greeting}>Oh, hola de nuevo...</Text>
                <Text style={styles.title}>{isEditingMode ? 'Modo Edición' : '¿Quién está viendo?'}</Text>

                <View style={styles.profilesWrapper}>
                    {profiles.map((profile) => (
                        <View key={profile.id} style={styles.profileItemContainer}>
                            <TouchableOpacity
                                style={styles.profileContainer}
                                onPress={() => handleProfileClick(profile)}
                                onPressIn={() => setFocusedProfile(profile.id)}
                                onPressOut={() => setFocusedProfile(null)}
                                activeOpacity={0.9}
                            >
                                <View style={[styles.avatarBorder, (focusedProfile === profile.id || isEditingMode) && styles.avatarFocus]}>
                                    <View style={styles.avatarFallback}>
                                        <Text style={styles.avatarInitial}>{getInitial(profile.name)}</Text>
                                    </View>

                                    {/* Mostrar ícono de candado o un lápiz gigante si está en modo edición */}
                                    {isEditingMode ? (
                                        <View style={styles.editOverlay}>
                                            <Ionicons name="pencil" size={30} color="#000" />
                                        </View>
                                    ) : (
                                        profile.pin && (
                                            <View style={styles.lockBadge}>
                                                <Ionicons name="lock-closed" size={14} color="#000" />
                                            </View>
                                        )
                                    )}
                                </View>
                            </TouchableOpacity>

                            {/* EL NOMBRE Y EL LÁPIZ SUTIL DEBAJO */}
                            <TouchableOpacity style={styles.nameEditContainer} onPress={() => openEditModal(profile)}>
                                <Text style={[styles.profileName, focusedProfile === profile.id && { color: COLORS.oro }]}>
                                    {profile.name}
                                </Text>
                                <Ionicons name="create-outline" size={14} color={COLORS.textMuted} style={styles.editIcon} />
                            </TouchableOpacity>
                        </View>
                    ))}

                    {/* Botón Añadir */}
                    <View style={styles.profileItemContainer}>
                        <TouchableOpacity style={styles.profileContainer} onPress={openAddModal}>
                            <View style={[styles.avatarBorder, styles.addAvatar]}>
                                <Ionicons name="add" size={32} color={COLORS.oro} />
                            </View>
                        </TouchableOpacity>
                        <Text style={styles.profileName}>Añadir</Text>
                    </View>
                </View>

                {/* Botón Administrar Perfiles y Avatares */}
                <TouchableOpacity
                    style={[styles.manageBtn, isEditingMode && styles.manageBtnActive]}
                    onPress={() => setIsEditingMode(!isEditingMode)}
                >
                    <Ionicons name={isEditingMode ? "checkmark-circle" : "settings-outline"} size={18} color={isEditingMode ? "#000" : COLORS.oro} />
                    <Text style={[styles.manageText, isEditingMode && { color: '#000' }]}>
                        {isEditingMode ? "LISTO" : "EDITAR PERFILES Y AVATARES"}
                    </Text>
                </TouchableOpacity>

            </View>

            {/* Logo inferior Vertex Premium */}
            <View style={styles.footerLogo}>
                <Text style={styles.footerBrand}>Vertex<Text style={{ fontWeight: '300', color: '#fff' }}>Premium</Text></Text>
            </View>

            {/* MODAL (Ventana emergente para Añadir/Editar) */}
            <Modal visible={modalVisible} transparent={true} animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>{modalType === 'add' ? 'Añadir Perfil' : 'Editar Perfil'}</Text>

                        <TextInput
                            style={styles.modalInput}
                            placeholder="Nombre del perfil"
                            placeholderTextColor={COLORS.textMuted}
                            value={tempName}
                            onChangeText={setTempName}
                            autoFocus
                        />

                        {modalType === 'edit' && (
                            <TouchableOpacity style={styles.changeAvatarBtn} onPress={() => alert('Pronto podrás subir una foto desde tu galería')}>
                                <Ionicons name="image-outline" size={20} color={COLORS.oro} />
                                <Text style={styles.changeAvatarText}>Cambiar Avatar</Text>
                            </TouchableOpacity>
                        )}

                        <View style={styles.modalActions}>
                            <TouchableOpacity style={styles.modalBtnCancel} onPress={() => setModalVisible(false)}>
                                <Text style={styles.modalBtnTextCancel}>Cancelar</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.modalBtnSave} onPress={saveProfile}>
                                <Text style={styles.modalBtnTextSave}>Guardar</Text>
                            </TouchableOpacity>
                        </View>

                        {modalType === 'edit' && (
                            <TouchableOpacity style={styles.deleteBtn} onPress={deleteProfile}>
                                <Ionicons name="trash-outline" size={16} color="#ff4444" />
                                <Text style={styles.deleteBtnText}>Eliminar Perfil</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
            </Modal>

        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.bg, justifyContent: 'center', alignItems: 'center' },
    content: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingBottom: 50 },

    greeting: { color: COLORS.textMuted, fontSize: 16, fontStyle: 'italic', marginBottom: 5 },
    title: { color: COLORS.textLight, fontSize: 32, fontWeight: 'bold', marginBottom: 50, letterSpacing: 0.5 },

    profilesWrapper: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 20, flexWrap: 'wrap' },
    profileItemContainer: { alignItems: 'center', marginHorizontal: 15, marginBottom: 20 },
    profileContainer: { alignItems: 'center' },

    avatarBorder: { width: 110, height: 110, borderRadius: 55, padding: 3, backgroundColor: 'transparent', borderWidth: 2, borderColor: COLORS.avatarBorder },
    avatarFallback: { flex: 1, borderRadius: 50, justifyContent: 'center', alignItems: 'center', backgroundColor: '#111' },
    avatarInitial: { fontSize: 40, fontWeight: 'bold', color: COLORS.oro },

    avatarFocus: {
        width: 130, height: 110, borderRadius: 20, backgroundColor: COLORS.focusBg, borderColor: COLORS.oro
    },

    lockBadge: { position: 'absolute', bottom: 0, right: 0, backgroundColor: COLORS.oro, padding: 5, borderRadius: 12, borderWidth: 2, borderColor: COLORS.bg },
    editOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(212, 175, 55, 0.7)', borderRadius: 50, justifyContent: 'center', alignItems: 'center' },

    nameEditContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 15, gap: 5 },
    profileName: { color: COLORS.textLight, fontSize: 16, fontWeight: '600' },
    editIcon: { marginLeft: 2 },

    addAvatar: { borderColor: COLORS.oro, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(212, 175, 55, 0.05)' },

    manageBtn: { flexDirection: 'row', alignItems: 'center', marginTop: 40, backgroundColor: 'transparent', paddingHorizontal: 25, paddingVertical: 12, borderRadius: 30, borderWidth: 1, borderColor: COLORS.oro, gap: 10 },
    manageBtnActive: { backgroundColor: COLORS.oro },
    manageText: { color: COLORS.oro, fontSize: 14, fontWeight: 'bold', letterSpacing: 1 },

    footerLogo: { position: 'absolute', bottom: 30, alignSelf: 'center' },
    footerBrand: { color: COLORS.oro, fontSize: 16, fontWeight: 'bold', letterSpacing: 1 },

    // Estilos del Modal (Ventana Emergente)
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center' },
    modalContent: { width: 350, backgroundColor: '#111', borderRadius: 20, padding: 25, borderWidth: 1, borderColor: COLORS.oro, alignItems: 'center' },
    modalTitle: { color: COLORS.oro, fontSize: 20, fontWeight: 'bold', marginBottom: 20 },
    modalInput: { width: '100%', backgroundColor: '#000', color: '#fff', fontSize: 16, padding: 15, borderRadius: 10, borderWidth: 1, borderColor: '#333', marginBottom: 20 },
    changeAvatarBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 25, padding: 10, backgroundColor: 'rgba(212, 175, 55, 0.1)', borderRadius: 10, width: '100%', justifyContent: 'center' },
    changeAvatarText: { color: COLORS.oro, fontWeight: 'bold' },
    modalActions: { flexDirection: 'row', gap: 15, width: '100%' },
    modalBtnCancel: { flex: 1, padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#444', alignItems: 'center' },
    modalBtnSave: { flex: 1, padding: 12, borderRadius: 10, backgroundColor: COLORS.oro, alignItems: 'center' },
    modalBtnTextCancel: { color: '#ccc', fontWeight: 'bold' },
    modalBtnTextSave: { color: '#000', fontWeight: 'bold' },
    deleteBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 25 },
    deleteBtnText: { color: '#ff4444', fontWeight: 'bold' }
});

export default ProfileSelector;