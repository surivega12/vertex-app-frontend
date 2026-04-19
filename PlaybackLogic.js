import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal } from 'react-native'; // Mock Native imports

/*
 * Especialista Frontend Task: Playback Logic
 * Handles checking continue watching vs playing from the start.
 */
const PlaybackManager = ({ videoId, initialProgress, onPlay }) => {
    const [showResumePrompt, setShowResumePrompt] = useState(initialProgress > 0);

    const handlePlayFromStart = () => {
        setShowResumePrompt(false);
        onPlay(0); // Pass start position (0 seconds)
    };

    const handleResume = () => {
        setShowResumePrompt(false);
        onPlay(initialProgress); 
    };

    return (
        <View>
            <Modal visible={showResumePrompt} transparent={true} animationType="fade">
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.8)' }}>
                    <View style={{ width: 300, padding: 20, backgroundColor: '#1e1e1e', borderRadius: 10 }}>
                        <Text style={{ color: '#fff', fontSize: 18, marginBottom: 20, textAlign: 'center' }}>
                            Parece que dejaste este video a medias.
                        </Text>
                        
                        <TouchableOpacity 
                            style={{ backgroundColor: '#00ff88', padding: 12, borderRadius: 8, marginBottom: 10 }}
                            onPress={handleResume}
                        >
                            <Text style={{ color: '#000', textAlign: 'center', fontWeight: 'bold' }}>Continuar Viendo</Text>
                        </TouchableOpacity>

                        <TouchableOpacity 
                            style={{ backgroundColor: 'transparent', borderWidth: 1, borderColor: '#fff', padding: 12, borderRadius: 8 }}
                            onPress={handlePlayFromStart}
                        >
                            <Text style={{ color: '#fff', textAlign: 'center' }}>Reproducir desde el inicio</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

export default PlaybackManager;
