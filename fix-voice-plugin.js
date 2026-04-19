const fs = require('fs');
const path = require('path');

// Ruta hacia el archivo problemático en node_modules
const voiceGradlePath = path.join(__dirname, 'node_modules', '@react-native-voice', 'voice', 'android', 'build.gradle');

if (fs.existsSync(voiceGradlePath)) {
    let content = fs.readFileSync(voiceGradlePath, 'utf8');

    // 1. Eliminar el método jcenter() que ya no existe en Gradle 9
    content = content.replace(/jcenter\(\)/g, 'mavenCentral()');

    // 2. Inyectar el compileSdk y el namespace que faltan (obligatorios ahora)
    if (!content.includes('compileSdk')) {
        content = content.replace(/android \{/, 'android {\n    compileSdk 34\n    namespace "com.wenkesj.voice"');
    }

    fs.writeFileSync(voiceGradlePath, content);
    console.log('✅ @react-native-voice parcheado exitosamente para Gradle 9.');
} else {
    console.log('⚠️ No se encontró la librería para parchear. Asegúrate de haber corrido npm install.');
}