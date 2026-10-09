import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import '../constants/theme.dart';
import '../models/patient_profile.dart';
import '../services/api_service.dart';
import '../services/storage_service.dart';
import '../services/voice_service.dart';
import 'pairing_screen.dart';

class ProfileScreen extends StatefulWidget {
  final PatientProfile patient;
  final VoidCallback? onProfileUpdated;

  const ProfileScreen({super.key, required this.patient, this.onProfileUpdated});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  late PatientProfile _patient;
  bool _isLoading = false;

  // Subpage states
  Map<String, dynamic>? _healthCondition;
  Map<String, dynamic>? _doctorQr;
  Map<String, dynamic>? _privacySettings;

  @override
  void initState() {
    super.initState();
    _patient = widget.patient;
    _loadProfileDetails();
  }

  Future<void> _loadProfileDetails() async {
    setState(() => _isLoading = true);
    final profile = await mobileApi.getPatientProfile(_patient.id);
    final health = await mobileApi.getHealthCondition(_patient.id);
    final qr = await mobileApi.getDoctorQr(_patient.id);
    final privacy = await mobileApi.getPrivacySettings(_patient.id);

    if (mounted) {
      setState(() {
        if (profile != null) _patient = profile;
        _healthCondition = health;
        _doctorQr = qr;
        _privacySettings = privacy;
        _isLoading = false;
      });
    }
  }

  Future<void> _makeCall(String phone) async {
    if (phone.isEmpty) return;
    final uri = Uri.parse('tel:$phone');
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri);
    } else {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Calling $phone')),
      );
    }
  }

  // Subpage 1: Edit Basic Personal Info
  void _openPersonalInfoSubpage() {
    final nameCtrl = TextEditingController(text: _patient.fullName);
    final prefCtrl = TextEditingController(text: _patient.preferredName);
    final phoneCtrl = TextEditingController(text: _patient.phone);
    final addrCtrl = TextEditingController(text: _patient.address);

    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (ctx) => Scaffold(
          appBar: AppBar(
            title: const Text('My Profile Details', style: TextStyle(fontWeight: FontWeight.bold)),
            backgroundColor: AppTheme.surface,
          ),
          body: SingleChildScrollView(
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                const Text('Personal Information', style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: AppTheme.primary)),
                const SizedBox(height: 16),
                TextField(
                  controller: nameCtrl,
                  decoration: const InputDecoration(labelText: 'Full Name', border: OutlineInputBorder()),
                  style: const TextStyle(fontSize: 18),
                ),
                const SizedBox(height: 16),
                TextField(
                  controller: prefCtrl,
                  decoration: const InputDecoration(labelText: 'Preferred Name (Paati / Thatha)', border: OutlineInputBorder()),
                  style: const TextStyle(fontSize: 18),
                ),
                const SizedBox(height: 16),
                TextField(
                  controller: phoneCtrl,
                  decoration: const InputDecoration(labelText: 'Phone Number', border: OutlineInputBorder()),
                  style: const TextStyle(fontSize: 18),
                  keyboardType: TextInputType.phone,
                ),
                const SizedBox(height: 16),
                TextField(
                  controller: addrCtrl,
                  decoration: const InputDecoration(labelText: 'Home Address', border: OutlineInputBorder()),
                  style: const TextStyle(fontSize: 18),
                  maxLines: 2,
                ),
                const SizedBox(height: 24),
                ElevatedButton(
                  onPressed: () async {
                    final success = await mobileApi.updatePatientProfile(_patient.id, {
                      'fullName': nameCtrl.text.trim(),
                      'preferredName': prefCtrl.text.trim(),
                      'phone': phoneCtrl.text.trim(),
                      'address': addrCtrl.text.trim(),
                    });
                    if (success) {
                      if (ctx.mounted) Navigator.pop(ctx);
                      _loadProfileDetails();
                      if (mounted) {
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(content: Text('Profile updated successfully!'), backgroundColor: AppTheme.success),
                        );
                      }
                    }
                  },
                  style: ElevatedButton.styleFrom(backgroundColor: AppTheme.primary, padding: const EdgeInsets.all(16)),
                  child: const Text('Save Details', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.white)),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  // Subpage 2: Health Condition
  void _openHealthConditionSubpage() {
    String mobility = _healthCondition?['mobilityStatus'] ?? _patient.mobilityStatus;
    String vision = _healthCondition?['visionStatus'] ?? _patient.visionStatus;
    String hearing = _healthCondition?['hearingStatus'] ?? _patient.hearingStatus;
    final notesCtrl = TextEditingController(text: _healthCondition?['specialCareNotes'] ?? _patient.specialCareNotes);

    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (ctx) => StatefulBuilder(
          builder: (ctx, setSubState) => Scaffold(
            appBar: AppBar(
              title: const Text('Health & Body Condition', style: TextStyle(fontWeight: FontWeight.bold)),
              backgroundColor: AppTheme.surface,
            ),
            body: SingleChildScrollView(
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  const Text('Descriptive Care Needs', style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: AppTheme.primary)),
                  const SizedBox(height: 8),
                  const Text('Helps caregivers and doctors understand your day-to-day comfort. (Non-diagnostic).', style: TextStyle(color: AppTheme.textMuted, fontSize: 15)),
                  const SizedBox(height: 20),

                  // Mobility
                  const Text('Mobility Status', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 8),
                  DropdownButtonFormField<String>(
                    initialValue: mobility,
                    decoration: const InputDecoration(border: OutlineInputBorder()),
                    items: [
                      'Independent',
                      'Walks with support',
                      'Uses walking stick',
                      'Uses walker',
                      'Uses wheelchair',
                      'Mostly bedbound',
                    ].map((opt) => DropdownMenuItem(value: opt, child: Text(opt))).toList(),
                    onChanged: (val) {
                      if (val != null) setSubState(() => mobility = val);
                    },
                  ),
                  const SizedBox(height: 16),

                  // Vision
                  const Text('Vision Status', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 8),
                  DropdownButtonFormField<String>(
                    initialValue: vision,
                    decoration: const InputDecoration(border: OutlineInputBorder()),
                    items: [
                      'Normal vision',
                      'Uses glasses',
                      'Low vision',
                    ].map((opt) => DropdownMenuItem(value: opt, child: Text(opt))).toList(),
                    onChanged: (val) {
                      if (val != null) setSubState(() => vision = val);
                    },
                  ),
                  const SizedBox(height: 16),

                  // Hearing
                  const Text('Hearing Status', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 8),
                  DropdownButtonFormField<String>(
                    initialValue: hearing,
                    decoration: const InputDecoration(border: OutlineInputBorder()),
                    items: [
                      'Normal hearing',
                      'Uses hearing aid',
                      'Difficulty hearing',
                    ].map((opt) => DropdownMenuItem(value: opt, child: Text(opt))).toList(),
                    onChanged: (val) {
                      if (val != null) setSubState(() => hearing = val);
                    },
                  ),
                  const SizedBox(height: 16),

                  // Known Allergies Warning Box
                  if (_patient.knownAllergies.isNotEmpty) ...[
                    Container(
                      padding: const EdgeInsets.all(14),
                      decoration: BoxDecoration(
                        color: Colors.red.shade50,
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(color: Colors.red.shade300),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Row(
                            children: [
                              Icon(Icons.warning_amber_rounded, color: Colors.red, size: 22),
                              SizedBox(width: 8),
                              Text('Known Allergies', style: TextStyle(fontWeight: FontWeight.bold, color: Colors.red, fontSize: 16)),
                            ],
                          ),
                          const SizedBox(height: 6),
                          Text(_patient.knownAllergies.join(', '), style: const TextStyle(fontSize: 15, color: Colors.black87)),
                        ],
                      ),
                    ),
                    const SizedBox(height: 16),
                  ],

                  // Special Daily Notes
                  const Text('Special Care & Daily Routines', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 8),
                  TextField(
                    controller: notesCtrl,
                    decoration: const InputDecoration(hintText: 'e.g. Needs warm water with morning pills', border: OutlineInputBorder()),
                    maxLines: 3,
                    style: const TextStyle(fontSize: 16),
                  ),
                  const SizedBox(height: 24),

                  ElevatedButton(
                    onPressed: () async {
                      final success = await mobileApi.updateHealthCondition(_patient.id, {
                        'mobilityStatus': mobility,
                        'visionStatus': vision,
                        'hearingStatus': hearing,
                        'specialCareNotes': notesCtrl.text.trim(),
                      });
                      if (success) {
                        if (ctx.mounted) Navigator.pop(ctx);
                        _loadProfileDetails();
                        if (mounted) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(content: Text('Health condition updated!'), backgroundColor: AppTheme.success),
                          );
                        }
                      }
                    },
                    style: ElevatedButton.styleFrom(backgroundColor: AppTheme.primary, padding: const EdgeInsets.all(16)),
                    child: const Text('Save Health Information', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.white)),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  // Subpage 3: Emergency Contacts
  void _openEmergencyContactsSubpage() {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (ctx) => Scaffold(
          appBar: AppBar(
            title: const Text('Emergency Contacts', style: TextStyle(fontWeight: FontWeight.bold)),
            backgroundColor: AppTheme.surface,
          ),
          body: Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                // Primary Contact
                Card(
                  elevation: 2,
                  child: Padding(
                    padding: const EdgeInsets.all(20),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            const Icon(Icons.star_rounded, color: AppTheme.primary, size: 28),
                            const SizedBox(width: 8),
                            Text(_patient.emergencyContactName, style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold)),
                          ],
                        ),
                        const SizedBox(height: 6),
                        Text('Relationship: ${_patient.relationship}', style: const TextStyle(fontSize: 16, color: AppTheme.textMuted)),
                        const SizedBox(height: 4),
                        Text('Phone: ${_patient.emergencyContactPhone}', style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: AppTheme.primary)),
                        const SizedBox(height: 16),
                        ElevatedButton.icon(
                          onPressed: () => _makeCall(_patient.emergencyContactPhone),
                          icon: const Icon(Icons.call, color: Colors.white),
                          label: const Text('Call Primary Contact Now', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.white)),
                          style: ElevatedButton.styleFrom(backgroundColor: AppTheme.success, padding: const EdgeInsets.all(14)),
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 16),

                // Secondary Contact
                if (_patient.secondaryContactName.isNotEmpty) ...[
                  Card(
                    elevation: 1,
                    child: Padding(
                      padding: const EdgeInsets.all(20),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(_patient.secondaryContactName, style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
                          const SizedBox(height: 4),
                          Text('Relationship: ${_patient.secondaryRelationship}', style: const TextStyle(fontSize: 15, color: AppTheme.textMuted)),
                          const SizedBox(height: 4),
                          Text('Phone: ${_patient.secondaryContactPhone}', style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                          const SizedBox(height: 12),
                          OutlinedButton.icon(
                            onPressed: () => _makeCall(_patient.secondaryContactPhone),
                            icon: const Icon(Icons.call, color: AppTheme.primary),
                            label: const Text('Call Secondary Contact', style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold)),
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ],
            ),
          ),
        ),
      ),
    );
  }

  // Subpage 4: Doctor QR
  void _openDoctorQrSubpage() {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (ctx) => StatefulBuilder(
          builder: (ctx, setSubState) {
            final qrDataUrl = _doctorQr?['qrDataUrl'] as String?;
            final status = _doctorQr?['status'] ?? 'ACTIVE';
            final version = _doctorQr?['version'] ?? 1;

            ImageProvider? qrImage;
            if (qrDataUrl != null && qrDataUrl.contains('base64,')) {
              final clean = qrDataUrl.split('base64,').last;
              qrImage = MemoryImage(base64Decode(clean));
            }

            return Scaffold(
              appBar: AppBar(
                title: const Text('Doctor QR Code', style: TextStyle(fontWeight: FontWeight.bold)),
                backgroundColor: AppTheme.surface,
              ),
              body: SingleChildScrollView(
                padding: const EdgeInsets.all(24),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.center,
                  children: [
                    const Icon(Icons.verified_user_rounded, color: AppTheme.primary, size: 48),
                    const SizedBox(height: 12),
                    Text(
                      _patient.preferredName,
                      style: const TextStyle(fontSize: 26, fontWeight: FontWeight.w900, color: AppTheme.textMain),
                    ),
                    const SizedBox(height: 4),
                    const Text(
                      'Show this QR only to a trusted and authorized healthcare professional.',
                      textAlign: TextAlign.center,
                      style: TextStyle(fontSize: 16, color: AppTheme.textMuted),
                    ),
                    const SizedBox(height: 24),

                    // Centered Large QR Box
                    Container(
                      padding: const EdgeInsets.all(20),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(16),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withValues(alpha: 0.08),
                            blurRadius: 20,
                            offset: const Offset(0, 6),
                          ),
                        ],
                        border: Border.all(color: Colors.orange.shade200, width: 2),
                      ),
                      child: Column(
                        children: [
                          if (qrImage != null)
                            Image(image: qrImage, width: 220, height: 220, fit: BoxFit.contain)
                          else
                            const SizedBox(
                              width: 220,
                              height: 220,
                              child: Center(child: CircularProgressIndicator(color: AppTheme.primary)),
                            ),
                          const SizedBox(height: 12),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Container(
                                width: 10,
                                height: 10,
                                decoration: const BoxDecoration(color: Colors.green, shape: BoxShape.circle),
                              ),
                              const SizedBox(width: 6),
                              Text('Status: $status (v$version)', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15, color: Colors.green)),
                            ],
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 20),

                    // Privacy notice
                    Container(
                      padding: const EdgeInsets.all(14),
                      decoration: BoxDecoration(
                        color: const Color(0xFFFFF7ED),
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(color: const Color(0xFFFFB45E)),
                      ),
                      child: const Row(
                        children: [
                          Icon(Icons.lock_rounded, color: AppTheme.primary, size: 24),
                          SizedBox(width: 10),
                          Expanded(
                            child: Text(
                              'Private Token Security: No name or medical files are saved inside this image. Access automatically expires.',
                              style: TextStyle(fontSize: 13, color: AppTheme.textMuted),
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 24),

                    // Regenerate QR Action
                    OutlinedButton.icon(
                      onPressed: () async {
                        final confirm = await showDialog<bool>(
                          context: ctx,
                          builder: (c) => AlertDialog(
                            title: const Text('Issue New QR?'),
                            content: const Text('This will invalidate the previous Doctor QR code.'),
                            actions: [
                              TextButton(onPressed: () => Navigator.pop(c, false), child: const Text('Cancel')),
                              ElevatedButton(onPressed: () => Navigator.pop(c, true), child: const Text('Regenerate')),
                            ],
                          ),
                        );
                        if (confirm == true) {
                          final newQr = await mobileApi.regenerateDoctorQr(_patient.id);
                          if (newQr != null) {
                            setSubState(() => _doctorQr = newQr);
                            setState(() => _doctorQr = newQr);
                            if (mounted) {
                              ScaffoldMessenger.of(context).showSnackBar(
                                const SnackBar(content: Text('Doctor QR code updated!'), backgroundColor: AppTheme.success),
                              );
                            }
                          }
                        }
                      },
                      icon: const Icon(Icons.refresh_rounded, color: AppTheme.primary),
                      label: const Text('Regenerate QR Code', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                      style: OutlinedButton.styleFrom(padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14)),
                    ),
                  ],
                ),
              ),
            );
          },
        ),
      ),
    );
  }

  // Subpage 5: Privacy & Sharing
  void _openPrivacySubpage() {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (ctx) => StatefulBuilder(
          builder: (ctx, setSubState) {
            bool allowDoc = _privacySettings?['allowDoctorAccess'] ?? true;
            bool allowMeds = _privacySettings?['allowMedicationAccess'] ?? true;
            bool allowHealth = _privacySettings?['allowHealthConditionAccess'] ?? true;
            bool allowRx = _privacySettings?['allowPrescriptionAccess'] ?? true;

            return Scaffold(
              appBar: AppBar(
                title: const Text('Privacy & Sharing', style: TextStyle(fontWeight: FontWeight.bold)),
                backgroundColor: AppTheme.surface,
              ),
              body: ListView(
                padding: const EdgeInsets.all(20),
                children: [
                  const Text('Doctor QR Visibility Controls', style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: AppTheme.primary)),
                  const SizedBox(height: 6),
                  const Text('Choose what authorized doctors can inspect when scanning your QR code.', style: TextStyle(color: AppTheme.textMuted, fontSize: 14)),
                  const SizedBox(height: 16),

                  SwitchListTile(
                    title: const Text('Allow Doctor QR Access', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 17)),
                    subtitle: const Text('Master switch for healthcare scanning'),
                    value: allowDoc,
                    activeThumbColor: AppTheme.primary,
                    onChanged: (val) async {
                      setSubState(() => allowDoc = val);
                      await mobileApi.updatePrivacySettings(_patient.id, {'allowDoctorAccess': val});
                      _loadProfileDetails();
                    },
                  ),
                  const Divider(),

                  SwitchListTile(
                    title: const Text('Share Active Medications', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 17)),
                    subtitle: const Text('Allow viewing active prescriptions and doses'),
                    value: allowMeds,
                    activeThumbColor: AppTheme.primary,
                    onChanged: (val) async {
                      setSubState(() => allowMeds = val);
                      await mobileApi.updatePrivacySettings(_patient.id, {'allowMedicationAccess': val});
                      _loadProfileDetails();
                    },
                  ),
                  const Divider(),

                  SwitchListTile(
                    title: const Text('Share Health & Care Needs', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 17)),
                    subtitle: const Text('Allow viewing mobility, hearing and vision notes'),
                    value: allowHealth,
                    activeThumbColor: AppTheme.primary,
                    onChanged: (val) async {
                      setSubState(() => allowHealth = val);
                      await mobileApi.updatePrivacySettings(_patient.id, {'allowHealthConditionAccess': val});
                      _loadProfileDetails();
                    },
                  ),
                  const Divider(),

                  SwitchListTile(
                    title: const Text('Share Prescription History', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 17)),
                    subtitle: const Text('Allow viewing past clinic and hospital records'),
                    value: allowRx,
                    activeThumbColor: AppTheme.primary,
                    onChanged: (val) async {
                      setSubState(() => allowRx = val);
                      await mobileApi.updatePrivacySettings(_patient.id, {'allowPrescriptionAccess': val});
                      _loadProfileDetails();
                    },
                  ),
                ],
              ),
            );
          },
        ),
      ),
    );
  }

  // Subpage 6: Accessibility (Font size & Voice Speed)
  void _openAccessibilitySubpage() {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (ctx) => Scaffold(
          appBar: AppBar(
            title: const Text('Accessibility Settings', style: TextStyle(fontWeight: FontWeight.bold)),
            backgroundColor: AppTheme.surface,
          ),
          body: Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                const Text('Senior-Friendly Display', style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: AppTheme.primary)),
                const SizedBox(height: 12),
                const ListTile(
                  leading: Icon(Icons.format_size_rounded, color: AppTheme.primary, size: 28),
                  title: Text('Large High-Contrast Text', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 17)),
                  subtitle: Text('Optimized for low-vision reading (Enabled)'),
                  trailing: Icon(Icons.check_circle_rounded, color: AppTheme.success),
                ),
                const Divider(),
                const ListTile(
                  leading: Icon(Icons.volume_up_rounded, color: AppTheme.primary, size: 28),
                  title: Text('Slow & Clear Voice Reminders', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 17)),
                  subtitle: Text('Friendly speed 0.9x for easy listening'),
                  trailing: Icon(Icons.check_circle_rounded, color: AppTheme.success),
                ),
                const SizedBox(height: 20),
                ElevatedButton.icon(
                  onPressed: () {
                    VoiceService.speakMedicineReminder(
                      medicineName: 'Amlodipine',
                      dose: '5 mg',
                      foodInstruction: 'After breakfast',
                      language: _patient.languagePreference,
                      patientName: _patient.preferredName,
                    );
                  },
                  icon: const Icon(Icons.volume_up_rounded, color: Colors.white),
                  label: const Text('Test Clear Audio Reminder', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.white)),
                  style: ElevatedButton.styleFrom(backgroundColor: AppTheme.primary, padding: const EdgeInsets.all(16)),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  // Subpage 7: Language Preference
  void _openLanguageSubpage() {
    String selectedLang = _patient.languagePreference;

    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (ctx) => StatefulBuilder(
          builder: (ctx, setSubState) => Scaffold(
            appBar: AppBar(
              title: const Text('Voice Language', style: TextStyle(fontWeight: FontWeight.bold)),
              backgroundColor: AppTheme.surface,
            ),
            body: ListView(
              padding: const EdgeInsets.all(20),
              children: [
                const Text('Spoken Medication Reminders', style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: AppTheme.primary)),
                const SizedBox(height: 16),
                ...['Tanglish', 'Tamil', 'English', 'Hindi', 'Telugu'].map((lang) {
                  final isSelected = selectedLang == lang;
                  return Card(
                    elevation: 0,
                    margin: const EdgeInsets.only(bottom: 8),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(10),
                      side: BorderSide(color: isSelected ? AppTheme.primary : AppTheme.border, width: isSelected ? 2 : 1),
                    ),
                    child: ListTile(
                      title: Text(lang, style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: isSelected ? AppTheme.primary : AppTheme.textMain)),
                      trailing: isSelected ? const Icon(Icons.check_circle, color: AppTheme.primary) : null,
                      onTap: () async {
                        setSubState(() => selectedLang = lang);
                        await mobileApi.updatePatientProfile(_patient.id, {'languagePreference': lang});
                        _loadProfileDetails();
                      },
                    ),
                  );
                }),
                const SizedBox(height: 20),
                ElevatedButton(
                  onPressed: () {
                    VoiceService.speakMedicineReminder(
                      medicineName: 'Metformin',
                      dose: '500 mg',
                      foodInstruction: 'After food',
                      language: selectedLang,
                      patientName: _patient.preferredName,
                    );
                  },
                  style: ElevatedButton.styleFrom(backgroundColor: AppTheme.primary, padding: const EdgeInsets.all(16)),
                  child: Text('Test Audio in $selectedLang', style: const TextStyle(fontSize: 17, fontWeight: FontWeight.bold, color: Colors.white)),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  // Subpage 8: Notification Settings
  void _openNotificationsSubpage() {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (ctx) => Scaffold(
          appBar: AppBar(
            title: const Text('Notification Settings', style: TextStyle(fontWeight: FontWeight.bold)),
            backgroundColor: AppTheme.surface,
          ),
          body: ListView(
            padding: const EdgeInsets.all(20),
            children: [
              const Text('Reminder Channels', style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: AppTheme.primary)),
              const SizedBox(height: 16),
              SwitchListTile(
                title: const Text('Full Screen Voice Alert', style: TextStyle(fontSize: 17, fontWeight: FontWeight.bold)),
                subtitle: const Text('Speaks medicine name aloud upon schedule time'),
                value: true,
                activeThumbColor: AppTheme.primary,
                onChanged: (_) {},
              ),
              const Divider(),
              SwitchListTile(
                title: const Text('Vibration and Ringing', style: TextStyle(fontSize: 17, fontWeight: FontWeight.bold)),
                subtitle: const Text('Rings until medicine dose is confirmed'),
                value: true,
                activeThumbColor: AppTheme.primary,
                onChanged: (_) {},
              ),
              const Divider(),
              SwitchListTile(
                title: const Text('5-Minute Caregiver Alert', style: TextStyle(fontSize: 17, fontWeight: FontWeight.bold)),
                subtitle: const Text('Notifies daughter if dose is unconfirmed after 5 mins'),
                value: true,
                activeThumbColor: AppTheme.primary,
                onChanged: (_) {},
              ),
            ],
          ),
        ),
      ),
    );
  }

  Future<void> _unpairDevice() async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Unpair This Phone?'),
        content: const Text('This will disconnect your device from the caregiver. You will need a new code to reconnect.'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
          ElevatedButton(
            onPressed: () => Navigator.pop(ctx, true),
            style: ElevatedButton.styleFrom(backgroundColor: AppTheme.danger),
            child: const Text('Unpair Phone'),
          ),
        ],
      ),
    );

    if (confirm == true) {
      await MobileStorageService.clearAll();
      if (!mounted) return;
      Navigator.pushAndRemoveUntil(
        context,
        MaterialPageRoute(builder: (_) => const PairingScreen()),
        (route) => false,
      );
    }
  }

  Widget _buildSubpageItem({
    required IconData icon,
    required String title,
    required String subtitle,
    required VoidCallback onTap,
    Color? iconColor,
  }) {
    return Card(
      elevation: 0,
      margin: const EdgeInsets.only(bottom: 12),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: BorderSide(color: Colors.orange.shade100),
      ),
      child: ListTile(
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        leading: Container(
          padding: const EdgeInsets.all(10),
          decoration: BoxDecoration(
            color: (iconColor ?? AppTheme.primary).withValues(alpha: 0.12),
            borderRadius: BorderRadius.circular(10),
          ),
          child: Icon(icon, color: iconColor ?? AppTheme.primary, size: 26),
        ),
        title: Text(title, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 17, color: AppTheme.textMain)),
        subtitle: Text(subtitle, style: const TextStyle(fontSize: 13, color: AppTheme.textMuted)),
        trailing: const Icon(Icons.arrow_forward_ios_rounded, size: 16, color: AppTheme.textMuted),
        onTap: onTap,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.background,
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: AppTheme.primary))
          : SingleChildScrollView(
              padding: const EdgeInsets.all(20.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  // Senior Hero Profile Header
                  Card(
                    elevation: 2,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                    child: Padding(
                      padding: const EdgeInsets.all(20.0),
                      child: Column(
                        children: [
                          CircleAvatar(
                            radius: 46,
                            backgroundColor: AppTheme.primary,
                            child: Text(
                              _patient.preferredName[0],
                              style: const TextStyle(fontSize: 40, fontWeight: FontWeight.bold, color: Colors.white),
                            ),
                          ),
                          const SizedBox(height: 12),
                          Text(
                            _patient.preferredName,
                            style: const TextStyle(fontSize: 26, fontWeight: FontWeight.w900, color: AppTheme.textMain),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            '${_patient.fullName} • ${_patient.age} years',
                            style: const TextStyle(fontSize: 15, color: AppTheme.textMuted),
                          ),
                          const SizedBox(height: 8),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                            decoration: BoxDecoration(
                              color: AppTheme.primaryLight,
                              borderRadius: BorderRadius.circular(20),
                            ),
                            child: Text(
                              'Blood Group: ${_patient.bloodGroup}',
                              style: const TextStyle(fontWeight: FontWeight.bold, color: AppTheme.primary, fontSize: 13),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 20),

                  const Text(
                    'Profile Management',
                    style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: AppTheme.primary),
                  ),
                  const SizedBox(height: 12),

                  // 8 Subpages Inventory
                  _buildSubpageItem(
                    icon: Icons.person_rounded,
                    title: 'My Profile',
                    subtitle: 'Full name, phone number and home address',
                    onTap: _openPersonalInfoSubpage,
                  ),

                  _buildSubpageItem(
                    icon: Icons.health_and_safety_rounded,
                    title: 'Health Condition',
                    subtitle: 'Mobility status, vision, hearing and allergies',
                    onTap: _openHealthConditionSubpage,
                  ),

                  _buildSubpageItem(
                    icon: Icons.phone_in_talk_rounded,
                    title: 'Emergency Contacts',
                    subtitle: '${_patient.emergencyContactName} (${_patient.relationship})',
                    onTap: _openEmergencyContactsSubpage,
                  ),

                  _buildSubpageItem(
                    icon: Icons.qr_code_2_rounded,
                    title: 'Doctor QR',
                    subtitle: 'Show secure QR to visiting doctor or clinic',
                    iconColor: Colors.deepOrange,
                    onTap: _openDoctorQrSubpage,
                  ),

                  _buildSubpageItem(
                    icon: Icons.security_rounded,
                    title: 'Privacy & Sharing',
                    subtitle: 'Control what information doctors can view',
                    onTap: _openPrivacySubpage,
                  ),

                  _buildSubpageItem(
                    icon: Icons.accessibility_new_rounded,
                    title: 'Accessibility',
                    subtitle: 'High contrast display and voice speed',
                    onTap: _openAccessibilitySubpage,
                  ),

                  _buildSubpageItem(
                    icon: Icons.translate_rounded,
                    title: 'Language',
                    subtitle: 'Voice reminders in ${_patient.languagePreference}',
                    onTap: _openLanguageSubpage,
                  ),

                  _buildSubpageItem(
                    icon: Icons.notifications_active_rounded,
                    title: 'Notification Settings',
                    subtitle: 'Voice reminders, alarms, and 5-min escalation',
                    onTap: _openNotificationsSubpage,
                  ),

                  const SizedBox(height: 16),

                  // Unpair Button
                  OutlinedButton.icon(
                    onPressed: _unpairDevice,
                    icon: const Icon(Icons.link_off_rounded, color: AppTheme.danger),
                    label: const Text('Unpair This Phone', style: TextStyle(color: AppTheme.danger, fontSize: 16, fontWeight: FontWeight.bold)),
                    style: OutlinedButton.styleFrom(
                      padding: const EdgeInsets.all(16),
                      side: const BorderSide(color: AppTheme.danger),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                  ),
                  const SizedBox(height: 30),
                ],
              ),
            ),
    );
  }
}
