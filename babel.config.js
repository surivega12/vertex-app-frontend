module.exports = function (api) {
    api.cache(true);
    return {
        presets: ['babel-preset-expo'],
        // ESTA ES LA LÍNEA QUE FALTABA (OBLIGATORIA PARA ANIMACIONES HBO)
        plugins: ['react-native-reanimated/plugin'],
    };
};