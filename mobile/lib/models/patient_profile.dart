class PatientProfile {
  final String id;
  final String fullName;
  final String preferredName;
  final int age;
  final String gender;
  final String phone;
  final String email;
  final String address;
  final String bloodGroup;
  final String emergencyContactName;
  final String emergencyContactPhone;
  final String relationship;
  final String secondaryContactName;
  final String secondaryContactPhone;
  final String secondaryRelationship;
  final String languagePreference;
  final String mobilityStatus;
  final String visionStatus;
  final String hearingStatus;
  final String communicationPreference;
  final List<String> knownAllergies;
  final List<String> importantHealthConditions;
  final List<String> dietaryRestrictions;
  final String specialCareNotes;

  PatientProfile({
    required this.id,
    required this.fullName,
    required this.preferredName,
    required this.age,
    this.gender = 'female',
    this.phone = '',
    this.email = '',
    this.address = '',
    this.bloodGroup = 'B+',
    required this.emergencyContactName,
    required this.emergencyContactPhone,
    this.relationship = 'Primary Caregiver',
    this.secondaryContactName = '',
    this.secondaryContactPhone = '',
    this.secondaryRelationship = 'Secondary Contact',
    required this.languagePreference,
    this.mobilityStatus = 'Walks with support',
    this.visionStatus = 'Uses glasses',
    this.hearingStatus = 'Normal hearing',
    this.communicationPreference = 'Spoken / Friendly',
    this.knownAllergies = const [],
    this.importantHealthConditions = const [],
    this.dietaryRestrictions = const [],
    this.specialCareNotes = '',
  });

  factory PatientProfile.fromJson(Map<String, dynamic> json) {
    return PatientProfile(
      id: json['_id'] ?? json['id'] ?? '',
      fullName: json['fullName'] ?? 'Senior User',
      preferredName: json['preferredName'] ?? json['fullName'] ?? 'Paati',
      age: json['age'] is int ? json['age'] : 78,
      gender: json['gender'] ?? 'female',
      phone: json['phone'] ?? '',
      email: json['email'] ?? '',
      address: json['address'] ?? '',
      bloodGroup: json['bloodGroup'] ?? 'B+',
      emergencyContactName: json['emergencyContactName'] ?? 'Family Caregiver',
      emergencyContactPhone: json['emergencyContactPhone'] ?? '',
      relationship: json['relationship'] ?? 'Primary Caregiver',
      secondaryContactName: json['secondaryContactName'] ?? '',
      secondaryContactPhone: json['secondaryContactPhone'] ?? '',
      secondaryRelationship: json['secondaryRelationship'] ?? '',
      languagePreference: json['languagePreference'] ?? 'Tanglish',
      mobilityStatus: json['mobilityStatus'] ?? 'Walks with support',
      visionStatus: json['visionStatus'] ?? 'Uses glasses',
      hearingStatus: json['hearingStatus'] ?? 'Normal hearing',
      communicationPreference: json['communicationPreference'] ?? 'Spoken / Friendly',
      knownAllergies: json['knownAllergies'] != null ? List<String>.from(json['knownAllergies']) : [],
      importantHealthConditions: json['importantHealthConditions'] != null ? List<String>.from(json['importantHealthConditions']) : [],
      dietaryRestrictions: json['dietaryRestrictions'] != null ? List<String>.from(json['dietaryRestrictions']) : [],
      specialCareNotes: json['specialCareNotes'] ?? '',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      '_id': id,
      'fullName': fullName,
      'preferredName': preferredName,
      'age': age,
      'gender': gender,
      'phone': phone,
      'email': email,
      'address': address,
      'bloodGroup': bloodGroup,
      'emergencyContactName': emergencyContactName,
      'emergencyContactPhone': emergencyContactPhone,
      'relationship': relationship,
      'secondaryContactName': secondaryContactName,
      'secondaryContactPhone': secondaryContactPhone,
      'secondaryRelationship': secondaryRelationship,
      'languagePreference': languagePreference,
      'mobilityStatus': mobilityStatus,
      'visionStatus': visionStatus,
      'hearingStatus': hearingStatus,
      'communicationPreference': communicationPreference,
      'knownAllergies': knownAllergies,
      'importantHealthConditions': importantHealthConditions,
      'dietaryRestrictions': dietaryRestrictions,
      'specialCareNotes': specialCareNotes,
    };
  }
}
