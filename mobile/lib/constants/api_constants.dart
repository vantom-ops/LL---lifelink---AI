import 'package:flutter/foundation.dart';

class ApiConstants {
  // Use localhost on web/desktop, and 10.0.2.2 on Android emulator
  static String get baseUrl => kIsWeb ? 'http://localhost:5000/api' : 'http://10.0.2.2:5000/api';
  static const String localFallbackUrl = 'http://127.0.0.1:5000/api';

  static const String pairEndpoint = '/pairing/pair';
  static const String todayEventsEndpoint = '/medication-events/today';
  static const String confirmTakenEndpoint = '/medication-events';
  static const String syncOfflineEndpoint = '/medication-events/sync-offline';
  static const String requestContactEndpoint = '/notifications/request-contact';
  static const String documentsEndpoint = '/documents/patient';
}
