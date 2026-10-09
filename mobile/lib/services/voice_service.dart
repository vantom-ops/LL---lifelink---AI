import 'package:flutter_tts/flutter_tts.dart';

class VoiceService {
  static final FlutterTts _flutterTts = FlutterTts();
  static bool _isInitialized = false;

  static Future<void> init() async {
    if (_isInitialized) return;
    try {
      await _flutterTts.setSpeechRate(0.45); // Slower, clearer speech rate for older adults
      await _flutterTts.setVolume(1.0);
      await _flutterTts.setPitch(1.0);
      _isInitialized = true;
    } catch (_) {
      // Ignore if TTS engine unavailable on desktop/mock
    }
  }

  static Future<void> speakMedicineReminder({
    required String medicineName,
    required String dose,
    required String foodInstruction,
    String language = 'English',
    String? patientName,
  }) async {
    await init();
    final script = getReminderText(
      medicineName: medicineName,
      dose: dose,
      foodInstruction: foodInstruction,
      language: language,
      patientName: patientName,
    );

    try {
      if (language == 'Tamil') {
        await _flutterTts.setLanguage('ta-IN');
      } else if (language == 'Hindi') {
        await _flutterTts.setLanguage('hi-IN');
      } else if (language == 'Telugu') {
        await _flutterTts.setLanguage('te-IN');
      } else {
        await _flutterTts.setLanguage('en-IN');
      }
      await _flutterTts.speak(script);
    } catch (_) {
      // Fallback
    }
  }

  static Future<void> stop() async {
    try {
      await _flutterTts.stop();
    } catch (_) {}
  }

  static String getReminderText({
    required String medicineName,
    required String dose,
    required String foodInstruction,
    String language = 'English',
    String? patientName,
  }) {
    final name = patientName ?? 'Paati';

    switch (language) {
      case 'Tamil':
        return 'வணக்கம். உங்கள் மருந்து $medicineName ($dose) எடுத்துக்கொள்ளும் நேரம் வந்துவிட்டது. $foodInstruction. தயவுசெய்து திரையை சரிபார்த்து உறுதி செய்யவும்.';

      case 'Tanglish':
        return 'Good morning $name. Unga $medicineName $dose tablet time vandhuruchu. $foodInstruction. Tablet potutu green button amukunga.';

      case 'Hindi':
        return 'नमस्ते $name जी। आपकी दवाई $medicineName ($dose) लेने का समय हो गया है। $foodInstruction। दवा लेकर स्क्रीन पर हरे बटन को दबाएं।';

      case 'Telugu':
        return 'నమస్కారం $name గారు. మీ మందు $medicineName ($dose) తీసుకునే సమయం అయింది. $foodInstruction. దయచేసి మందు వేసుకుని బటన్ నొక్కండి.';

      case 'English':
      default:
        return 'Good morning $name. It is time for your medicine: $medicineName, dose $dose. Please take it $foodInstruction, then tap the green Taken button.';
    }
  }
}
