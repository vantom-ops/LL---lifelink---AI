class MedicationEvent {
  final String id;
  final String medicationName;
  final String dose;
  final String unit;
  final String foodRelation;
  final String instructions;
  final String? imageUrl;
  final DateTime scheduledTime;
  String status; // UPCOMING, DUE, PENDING_CONFIRMATION, TAKEN, LATE, MISSED, NOT_TAKEN
  DateTime? takenAt;

  MedicationEvent({
    required this.id,
    required this.medicationName,
    required this.dose,
    required this.unit,
    required this.foodRelation,
    required this.instructions,
    this.imageUrl,
    required this.scheduledTime,
    required this.status,
    this.takenAt,
  });

  factory MedicationEvent.fromJson(Map<String, dynamic> json) {
    final med = json['medicationId'] is Map<String, dynamic> ? json['medicationId'] : {};
    return MedicationEvent(
      id: json['_id'] ?? '',
      medicationName: med['name'] ?? 'Prescribed Medicine',
      dose: med['dose'] ?? '1',
      unit: med['unit'] ?? 'tablet',
      foodRelation: med['foodRelation'] ?? 'AFTER_MEAL',
      instructions: med['instructions'] ?? 'Take with water',
      imageUrl: med['imageUrl'],
      scheduledTime: DateTime.tryParse(json['scheduledTime'] ?? '') ?? DateTime.now(),
      status: json['status'] ?? 'UPCOMING',
      takenAt: json['takenAt'] != null ? DateTime.tryParse(json['takenAt']) : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      '_id': id,
      'status': status,
      'scheduledTime': scheduledTime.toIso8601String(),
      'takenAt': takenAt?.toIso8601String(),
      'medicationId': {
        'name': medicationName,
        'dose': dose,
        'unit': unit,
        'foodRelation': foodRelation,
        'instructions': instructions,
        'imageUrl': imageUrl,
      }
    };
  }

  bool get isTaken => status == 'TAKEN' || status == 'LATE';
}
