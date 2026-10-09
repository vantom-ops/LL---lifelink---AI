import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';
import '../models/medication_event.dart';
import '../models/patient_profile.dart';

class MobileStorageService {
  static const String _keyToken = 'll_mobile_token';
  static const String _keyPatient = 'll_mobile_patient';
  static const String _keyTodayEvents = 'll_mobile_today_events';
  static const String _keyOfflineQueue = 'll_mobile_offline_queue';

  static Future<void> saveAuth(String token, PatientProfile patient) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_keyToken, token);
    await prefs.setString(_keyPatient, jsonEncode(patient.toJson()));
  }

  static Future<String?> getToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_keyToken);
  }

  static Future<PatientProfile?> getPatient() async {
    final prefs = await SharedPreferences.getInstance();
    final str = prefs.getString(_keyPatient);
    if (str == null) return null;
    try {
      return PatientProfile.fromJson(jsonDecode(str));
    } catch (_) {
      return null;
    }
  }

  static Future<void> cacheTodayEvents(List<MedicationEvent> events) async {
    final prefs = await SharedPreferences.getInstance();
    final jsonList = events.map((e) => e.toJson()).toList();
    await prefs.setString(_keyTodayEvents, jsonEncode(jsonList));
  }

  static Future<List<MedicationEvent>> getCachedTodayEvents() async {
    final prefs = await SharedPreferences.getInstance();
    final str = prefs.getString(_keyTodayEvents);
    if (str == null) return [];
    try {
      final List list = jsonDecode(str);
      return list.map((item) => MedicationEvent.fromJson(item)).toList();
    } catch (_) {
      return [];
    }
  }

  static Future<void> enqueueOfflineConfirmation(String eventId, String status) async {
    final prefs = await SharedPreferences.getInstance();
    final existingStr = prefs.getString(_keyOfflineQueue);
    List queue = existingStr != null ? jsonDecode(existingStr) : [];
    
    // Check if event already in queue
    queue.removeWhere((item) => item['eventId'] == eventId);
    queue.add({
      'eventId': eventId,
      'status': status,
      'clientTimestamp': DateTime.now().toIso8601String(),
    });

    await prefs.setString(_keyOfflineQueue, jsonEncode(queue));
  }

  static Future<List<Map<String, dynamic>>> getOfflineQueue() async {
    final prefs = await SharedPreferences.getInstance();
    final existingStr = prefs.getString(_keyOfflineQueue);
    if (existingStr == null) return [];
    try {
      final List list = jsonDecode(existingStr);
      return list.cast<Map<String, dynamic>>();
    } catch (_) {
      return [];
    }
  }

  static Future<void> clearOfflineQueue() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_keyOfflineQueue);
  }

  static Future<void> clearAll() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.clear();
  }
}
