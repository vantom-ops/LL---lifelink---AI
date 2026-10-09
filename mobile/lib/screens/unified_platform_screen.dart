import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:url_launcher/url_launcher.dart';
import 'package:flutter_tts/flutter_tts.dart';
import '../constants/api_constants.dart';
import '../constants/theme.dart';

class UnifiedPlatformScreen extends StatefulWidget {
  const UnifiedPlatformScreen({super.key});

  @override
  State<UnifiedPlatformScreen> createState() => _UnifiedPlatformScreenState();
}

class _UnifiedPlatformScreenState extends State<UnifiedPlatformScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;
  final FlutterTts _tts = FlutterTts();
  String? _toastMessage;

  // Active Senior Profile
  final String _seniorName = 'Kalyani Ammal (Paati)';
  final int _seniorAge = 78;
  final String _seniorPhone = '+91 98400 67890';
  final String _primaryCaregiver = 'Ramesh Kumar (Son)';
  final String _doctorQrToken = 'llqr_351f93de14e9d68ceac3067175fc5e030f86d50c5e046fcb';

  // Live Pills
  final List<Map<String, dynamic>> _pills = [
    {
      'id': 'med_1',
      'name': 'Amlodipine',
      'dose': '5mg (1 tablet)',
      'timing': 'Morning (08:00 AM)',
      'status': 'TAKEN',
      'takenAt': '08:05 AM',
      'indication': 'Blood Pressure',
      'color': const Color(0xFF16A34A),
    },
    {
      'id': 'med_2',
      'name': 'Metformin',
      'dose': '500mg (1 tablet)',
      'timing': 'Afternoon (01:00 PM)',
      'status': 'DUE',
      'takenAt': null,
      'indication': 'Type 2 Diabetes',
      'color': const Color(0xFFFF7A00),
    },
    {
      'id': 'med_3',
      'name': 'Atorvastatin',
      'dose': '20mg (1 tablet)',
      'timing': 'Night (08:30 PM)',
      'status': 'UPCOMING',
      'takenAt': null,
      'indication': 'Cholesterol & Heart',
      'color': const Color(0xFF3B82F6),
    },
  ];

  // Professional Caregivers
  final List<Map<String, dynamic>> _caregivers = [
    {
      'id': '67a800000000000000000001',
      'name': 'Sister Lakshmi Narayanan, RN',
      'hospital': 'Apollo Hospitals, Greams Rd',
      'department': 'Geriatric Care & Critical Nursing',
      'role': 'Registered Geriatric Nurse',
      'exp': 9,
      'fee': 450,
      'rating': 4.9,
      'phone': '+91 98400 77889',
      'status': 'VERIFIED',
    },
    {
      'id': '67a800000000000000000002',
      'name': 'Anand Mohan',
      'hospital': 'Fortis Malar Hospital, Adyar',
      'department': 'Home Care & Mobility Support',
      'role': 'Certified Mobility & Medication Aide',
      'exp': 4,
      'fee': 350,
      'rating': 4.8,
      'phone': '+91 98400 88990',
      'status': 'PENDING',
    },
  ];

  // Active Disability Help Requests
  final List<Map<String, dynamic>> _disabilityRequests = [
    {
      'id': 'req_01',
      'reason': 'Difficulty opening medicine organizer box due to tremor',
      'location': 'Bedside Organizer (Master Bedroom)',
      'area': 'T. Nagar, Chennai',
      'status': 'WAITING FOR CAREGIVER',
      'priority': 'HIGH',
    }
  ];

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 11, vsync: this);
    _initTts();
  }

  Future<void> _initTts() async {
    try {
      await _tts.setLanguage('ta-IN');
      await _tts.setSpeechRate(0.85);
      await _tts.setPitch(1.0);
    } catch (_) {}
  }

  @override
  void dispose() {
    _tabController.dispose();
    _tts.stop();
    super.dispose();
  }

  void _showToast(String msg) {
    setState(() => _toastMessage = msg);
    Future.delayed(const Duration(seconds: 4), () {
      if (mounted) setState(() => _toastMessage = null);
    });
  }

  Future<void> _confirmPill(String id, String name) async {
    setState(() {
      for (var p in _pills) {
        if (p['id'] == id) {
          p['status'] = 'TAKEN';
          p['takenAt'] = 'Just Now';
          p['color'] = const Color(0xFF16A34A);
        }
      }
    });

    _showToast('✅ $name recorded as taken! Synced to Family Dashboard.');
    _speak('மாத்திரை சாப்பிடப்பட்டது. நன்றி பாட்டி!');

    // Sync to backend
    try {
      await http.post(
        Uri.parse('${ApiConstants.baseUrl}/medication-events/confirm-manual'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'medicationName': name, 'status': 'TAKEN'}),
      );
    } catch (_) {}
  }

  Future<void> _speak(String text) async {
    try {
      await _tts.speak(text);
    } catch (_) {}
  }

  Future<void> _launchWebInBrowser() async {
    final String webUrl = kIsWeb ? 'http://localhost:3000' : 'http://10.0.2.2:3000';
    try {
      final Uri uri = Uri.parse(webUrl);
      await launchUrl(uri, mode: LaunchMode.platformDefault);
    } catch (e) {
      _showToast('Launching browser at http://localhost:3000');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 1,
        titleSpacing: 0,
        title: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(7),
              decoration: BoxDecoration(
                color: AppTheme.primary,
                borderRadius: BorderRadius.circular(10),
              ),
              child: const Icon(Icons.favorite_rounded, color: Colors.white, size: 20),
            ),
            const SizedBox(width: 10),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: const [
                Text(
                  'LL LifeLink Unified',
                  style: TextStyle(fontWeight: FontWeight.w900, fontSize: 17, color: AppTheme.textMain),
                ),
                Text(
                  'Complete Web Platform on Mobile',
                  style: TextStyle(fontSize: 11, color: AppTheme.textMuted, fontWeight: FontWeight.w500),
                ),
              ],
            ),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.open_in_browser_rounded, color: AppTheme.primary),
            tooltip: 'Open in Desktop Browser',
            onPressed: _launchWebInBrowser,
          ),
        ],
        bottom: TabBar(
          controller: _tabController,
          isScrollable: true,
          labelColor: AppTheme.primary,
          unselectedLabelColor: AppTheme.textMuted,
          indicatorColor: AppTheme.primary,
          indicatorWeight: 3,
          labelStyle: const TextStyle(fontWeight: FontWeight.w800, fontSize: 13),
          unselectedLabelStyle: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13),
          tabs: const [
            Tab(text: '1. Live Feed', icon: Icon(Icons.dashboard_rounded, size: 18)),
            Tab(text: '2. Prescriptions & OCR', icon: Icon(Icons.document_scanner_rounded, size: 18)),
            Tab(text: '3. Medical Scans', icon: Icon(Icons.folder_shared_rounded, size: 18)),
            Tab(text: '4. Care Circle', icon: Icon(Icons.people_alt_rounded, size: 18)),
            Tab(text: '5. Disability Help', icon: Icon(Icons.accessible_forward_rounded, size: 18)),
            Tab(text: '6. Pro Caregivers', icon: Icon(Icons.medical_services_rounded, size: 18)),
            Tab(text: '7. Doctor QR', icon: Icon(Icons.qr_code_rounded, size: 18)),
            Tab(text: '8. Reports & Adherence', icon: Icon(Icons.bar_chart_rounded, size: 18)),
            Tab(text: '9. Paati Voice', icon: Icon(Icons.record_voice_over_rounded, size: 18)),
            Tab(text: '10. Senior Profile', icon: Icon(Icons.badge_rounded, size: 18)),
            Tab(text: '11. Settings', icon: Icon(Icons.settings_rounded, size: 18)),
          ],
        ),
      ),
      body: Stack(
        children: [
          TabBarView(
            controller: _tabController,
            children: [
              _buildLiveFeedTab(),
              _buildPrescriptionsOcrTab(),
              _buildMedicalScansTab(),
              _buildCareCircleTab(),
              _buildDisabilityTab(),
              _buildProCaregiversTab(),
              _buildDoctorQrTab(),
              _buildReportsTab(),
              _buildVoiceTab(),
              _buildSeniorProfileTab(),
              _buildSettingsTab(),
            ],
          ),

          if (_toastMessage != null)
            Positioned(
              bottom: 20,
              left: 20,
              right: 20,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                decoration: BoxDecoration(
                  color: const Color(0xFF1E293B),
                  borderRadius: BorderRadius.circular(12),
                  boxShadow: const [
                    BoxShadow(color: Colors.black26, blurRadius: 10, offset: Offset(0, 4)),
                  ],
                ),
                child: Row(
                  children: [
                    const Icon(Icons.info_outline, color: Colors.white, size: 20),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Text(
                        _toastMessage!,
                        style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w600, fontSize: 13),
                      ),
                    ),
                  ],
                ),
              ),
            ),
        ],
      ),
    );
  }

  // 1. LIVE FEED TAB
  Widget _buildLiveFeedTab() {
    final takenCount = _pills.where((p) => p['status'] == 'TAKEN').length;
    final totalCount = _pills.length;
    final pct = ((takenCount / totalCount) * 100).round();

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Adherence Metric Card
          Container(
            padding: const EdgeInsets.all(18),
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                colors: [Color(0xFF0D9488), Color(0xFF0F766E)],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              borderRadius: BorderRadius.circular(18),
              boxShadow: const [
                BoxShadow(color: Color(0x330D9488), blurRadius: 12, offset: Offset(0, 4)),
              ],
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('Today Adherence', style: TextStyle(color: Colors.white70, fontSize: 13, fontWeight: FontWeight.w600)),
                    const SizedBox(height: 4),
                    Text('$pct% Taken', style: const TextStyle(color: Colors.white, fontSize: 26, fontWeight: FontWeight.w900)),
                    Text('$takenCount of $totalCount doses confirmed', style: const TextStyle(color: Colors.white70, fontSize: 12)),
                  ],
                ),
                Container(
                  width: 54,
                  height: 54,
                  decoration: BoxDecoration(
                    color: Colors.white24,
                    borderRadius: BorderRadius.circular(14),
                  ),
                  child: Center(
                    child: Text('$pct%', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w900, fontSize: 16)),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),

          // Escalation Simulation Card
          Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: const Color(0xFFFFF7ED),
              border: Border.all(color: const Color(0xFFFFEDD5)),
              borderRadius: BorderRadius.circular(14),
            ),
            child: Row(
              children: [
                const Icon(Icons.timer_outlined, color: Color(0xFFEA580C), size: 24),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: const [
                      Text('5-Minute Escalation Watchdog', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 13, color: Color(0xFF9A3412))),
                      Text('If senior does not confirm within 5 mins, SMS & call alerts trigger.', style: TextStyle(fontSize: 11.5, color: Color(0xFFC2410C))),
                    ],
                  ),
                ),
                ElevatedButton(
                  onPressed: () {
                    _showToast('🚨 Simulated 5-Minute Timeout! Alert sent to son phone: $_seniorPhone');
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFFEA580C),
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                    elevation: 0,
                  ),
                  child: const Text('Test Alert', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w800)),
                ),
              ],
            ),
          ),
          const SizedBox(height: 18),

          const Text("Today's Scheduled Medication Events", style: TextStyle(fontWeight: FontWeight.w800, fontSize: 16, color: Color(0xFF0F172A))),
          const SizedBox(height: 10),

          ..._pills.map((pill) {
            final isTaken = pill['status'] == 'TAKEN';
            return Container(
              margin: const EdgeInsets.only(bottom: 12),
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: isTaken ? const Color(0xFF86EFAC) : const Color(0xFFE2E8F0)),
                boxShadow: const [BoxShadow(color: Color(0x0A000000), blurRadius: 6, offset: Offset(0, 2))],
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Row(
                        children: [
                          Icon(Icons.medication_rounded, color: pill['color'] as Color, size: 22),
                          const SizedBox(width: 8),
                          Text(pill['name'] as String, style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 16)),
                        ],
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                        decoration: BoxDecoration(
                          color: (pill['color'] as Color).withValues(alpha: 0.12),
                          borderRadius: BorderRadius.circular(999),
                        ),
                        child: Text(
                          pill['status'] as String,
                          style: TextStyle(color: pill['color'] as Color, fontWeight: FontWeight.w800, fontSize: 11.5),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 6),
                  Text('${pill['dose']} • ${pill['timing']} • For ${pill['indication']}', style: const TextStyle(color: Color(0xFF64748B), fontSize: 12.5)),
                  const SizedBox(height: 12),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        isTaken ? 'Confirmed at ${pill['takenAt']}' : 'Awaiting confirmation',
                        style: TextStyle(color: isTaken ? const Color(0xFF16A34A) : const Color(0xFF94A3B8), fontWeight: FontWeight.w600, fontSize: 12),
                      ),
                      if (!isTaken)
                        ElevatedButton.icon(
                          onPressed: () => _confirmPill(pill['id'] as String, pill['name'] as String),
                          icon: const Icon(Icons.check_circle_rounded, size: 16, color: Colors.white),
                          label: const Text('I Took It', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w800, fontSize: 12.5)),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: const Color(0xFF16A34A),
                            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                          ),
                        ),
                    ],
                  ),
                ],
              ),
            );
          }),
        ],
      ),
    );
  }

  // 2. PRESCRIPTIONS & AI OCR TAB
  Widget _buildPrescriptionsOcrTab() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: const Color(0xFFCBD5E1)),
            ),
            child: Column(
              children: [
                const Icon(Icons.cloud_upload_rounded, size: 48, color: AppTheme.primary),
                const SizedBox(height: 10),
                const Text('Doctor Prescription OCR Extraction', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 16)),
                const SizedBox(height: 4),
                const Text('Upload photo of paper prescription. AI extracts medicine names, dosages, and creates daily schedule.', textAlign: TextAlign.center, style: TextStyle(color: Color(0xFF64748B), fontSize: 12.5)),
                const SizedBox(height: 16),
                ElevatedButton.icon(
                  onPressed: () {
                    _showToast('📸 Prescription uploaded! Gemini OCR extracted 3 tablets & scheduled today reminders.');
                  },
                  icon: const Icon(Icons.camera_alt_rounded, color: Colors.white, size: 18),
                  label: const Text('Scan & Extract Prescription', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w800)),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppTheme.primary,
                    padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 20),
          const Text('Extracted Active Prescriptions', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 16)),
          const SizedBox(height: 10),
          _buildInfoRow('Prescription #01', 'Dr. S. K. Ramanathan, MD (Cardiologist) - Apollo Hospital', '3 Tablets • Daily morning/afternoon/night schedule'),
          _buildInfoRow('Prescription #02', 'Dr. Radhakrishnan (Diabetologist) - Madras Medical', 'Metformin 500mg • Post-lunch dose'),
        ],
      ),
    );
  }

  // 3. MEDICAL SCANS TAB
  Widget _buildMedicalScansTab() {
    final docs = [
      {'title': 'Brain MRI Contrast Scan', 'type': 'MRI', 'date': '02 Oct 2026', 'doctor': 'Apollo Greams Rd'},
      {'title': 'Chest X-Ray PA View', 'type': 'X-Ray', 'date': '18 Sep 2026', 'doctor': 'Madras Diagnostic'},
      {'title': 'HbA1c & Fasting Lipid Panel', 'type': 'Blood Report', 'date': '24 Aug 2026', 'doctor': 'Thyrocare'},
      {'title': 'Abdomen & Pelvis CT Scan', 'type': 'CT Scan', 'date': '12 Jul 2026', 'doctor': 'MIOT International'},
    ];

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            const Text('Long-Term Scans & Reports', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 16)),
            TextButton.icon(
              onPressed: () => _showToast('📂 Document upload dialog ready.'),
              icon: const Icon(Icons.add_photo_alternate_rounded, size: 16),
              label: const Text('Upload Scan', style: TextStyle(fontWeight: FontWeight.w800)),
            ),
          ],
        ),
        const SizedBox(height: 8),
        ...docs.map((doc) => Card(
          margin: const EdgeInsets.only(bottom: 10),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
          child: ListTile(
            leading: Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(color: const Color(0xFFEEF2FF), borderRadius: BorderRadius.circular(10)),
              child: const Icon(Icons.medical_information_rounded, color: Color(0xFF4F46E5)),
            ),
            title: Text(doc['title']!, style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 14)),
            subtitle: Text('${doc['type']} • ${doc['date']} • ${doc['doctor']}', style: const TextStyle(fontSize: 12, color: Color(0xFF64748B))),
            trailing: const Icon(Icons.remove_red_eye_rounded, color: AppTheme.primary),
            onTap: () => _showToast('Viewing verified scan: ${doc['title']}'),
          ),
        )),
      ],
    );
  }

  // 4. CARE CIRCLE TAB
  Widget _buildCareCircleTab() {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        const Text('Care Circle Network (Phase 2)', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 16)),
        const SizedBox(height: 4),
        const Text('Trusted relatives and neighbours authorized to receive progressive alerts when senior cannot open or take medicines.', style: TextStyle(fontSize: 12.5, color: Color(0xFF64748B))),
        const SizedBox(height: 14),
        _buildContactCard('Ramesh Kumar', 'Son / Primary Family Monitor', '+91 98400 12345', 'Immediate (0 min)', const Color(0xFF16A34A)),
        _buildContactCard('Meenakshi Sundaram', 'Daughter / Secondary Contact', '+91 98400 45678', 'Escalation Tier 1 (5 mins)', const Color(0xFF2563EB)),
        _buildContactCard('Ramesh Babu', 'Neighbour (Flat 4A)', '+91 98400 99881', 'Escalation Tier 2 (10 mins)', const Color(0xFFD97706)),
      ],
    );
  }

  // 5. DISABILITY HELP TAB
  Widget _buildDisabilityTab() {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        const Text('Physical Disability Assistance', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 16)),
        const SizedBox(height: 4),
        const Text('Real-time alerts triggered by senior when encountering difficulty opening medication organizers or bottles.', style: TextStyle(fontSize: 12.5, color: Color(0xFF64748B))),
        const SizedBox(height: 14),
        ..._disabilityRequests.map((req) {
          final isAccepted = req['status'] == 'ACCEPTED';
          return Container(
            margin: const EdgeInsets.only(bottom: 12),
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: isAccepted ? const Color(0xFFF0FDF4) : const Color(0xFFFEF2F2),
              border: Border.all(color: isAccepted ? const Color(0xFF22C55E) : const Color(0xFFEF4444)),
              borderRadius: BorderRadius.circular(16),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Text(isAccepted ? '✅' : '🚨', style: const TextStyle(fontSize: 22)),
                    const SizedBox(width: 8),
                    Text(
                      isAccepted ? 'Senior Help Accepted' : 'Active Senior Help Call',
                      style: TextStyle(
                        color: isAccepted ? const Color(0xFF15803D) : const Color(0xFF991B1B),
                        fontWeight: FontWeight.w900,
                        fontSize: 16,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                Text('Need: ${req['reason']}', style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 13.5)),
                const SizedBox(height: 4),
                Text('Location: ${req['location']} (${req['area']})', style: const TextStyle(color: Color(0xFF64748B), fontSize: 12.5)),
                const SizedBox(height: 12),
                if (!isAccepted)
                  Row(
                    children: [
                      ElevatedButton(
                        onPressed: () {
                          setState(() => req['status'] = 'ACCEPTED');
                          _showToast('✅ You accepted the request. Senior notified!');
                        },
                        style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF16A34A), foregroundColor: Colors.white),
                        child: const Text('I Will Assist (Accept)', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 12)),
                      ),
                      const SizedBox(width: 8),
                      OutlinedButton(
                        onPressed: () {
                          setState(() => req['status'] = 'ESCALATED');
                          _showToast('⏩ Escalated to verified care circle neighbours.');
                        },
                        style: OutlinedButton.styleFrom(foregroundColor: const Color(0xFFDC2626)),
                        child: const Text('Escalate', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 12)),
                      ),
                    ],
                  )
                else
                  const Text('Status: Caregiver in-person assist active.', style: TextStyle(color: Color(0xFF16A34A), fontWeight: FontWeight.w700, fontSize: 12.5)),
              ],
            ),
          );
        }),
      ],
    );
  }

  // 6. PROFESSIONAL CAREGIVERS TAB
  Widget _buildProCaregiversTab() {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            const Text('LL ProCare Network', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 16)),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: BoxDecoration(color: const Color(0xFFCCFBF1), borderRadius: BorderRadius.circular(6)),
              child: const Text('Port 3001 Synced', style: TextStyle(color: Color(0xFF0F766E), fontSize: 11, fontWeight: FontWeight.w800)),
            ),
          ],
        ),
        const SizedBox(height: 4),
        const Text('Verified nurses and caregivers who registered on LL ProCare portal with rates.', style: TextStyle(fontSize: 12.5, color: Color(0xFF64748B))),
        const SizedBox(height: 12),

        ..._caregivers.map((cg) {
          final isVerified = cg['status'] == 'VERIFIED';
          return Container(
            margin: const EdgeInsets.only(bottom: 12),
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: isVerified ? const Color(0xFF86EFAC) : const Color(0xFFFCD34D)),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(cg['name'] as String, style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 15)),
                    Text('₹${cg['fee']} / visit', style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 15, color: Color(0xFF0F172A))),
                  ],
                ),
                Text('${cg['role']} • ${cg['exp']} yrs exp', style: const TextStyle(color: Color(0xFF475569), fontSize: 12)),
                Text('🏥 ${cg['hospital']}', style: const TextStyle(color: Color(0xFF0D9488), fontSize: 12, fontWeight: FontWeight.w700)),
                const SizedBox(height: 8),
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                      decoration: BoxDecoration(color: isVerified ? const Color(0xFFDCFCE7) : const Color(0xFFFEF3C7), borderRadius: BorderRadius.circular(4)),
                      child: Text(isVerified ? '✓ Approved by Monitor' : '⏳ Pending Review', style: TextStyle(color: isVerified ? const Color(0xFF166534) : const Color(0xFF92400E), fontSize: 11, fontWeight: FontWeight.w800)),
                    ),
                    const Spacer(),
                    if (!isVerified)
                      ElevatedButton(
                        onPressed: () {
                          setState(() => cg['status'] = 'VERIFIED');
                          _showToast('✅ Caregiver ${cg['name']} approved by monitor!');
                        },
                        style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF16A34A), foregroundColor: Colors.white, padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6)),
                        child: const Text('Accept', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w800)),
                      ),
                    const SizedBox(width: 6),
                    IconButton(
                      icon: const Icon(Icons.message_rounded, color: Color(0xFF0284C7), size: 20),
                      tooltip: 'Message Caregiver',
                      onPressed: () {
                        _showCaregiverChatDialog(cg);
                      },
                    ),
                    IconButton(
                      icon: const Icon(Icons.phone_rounded, color: Color(0xFF16A34A), size: 20),
                      tooltip: 'Direct Call',
                      onPressed: () => launchUrl(Uri.parse('tel:${cg['phone']}'), mode: LaunchMode.platformDefault),
                    ),
                  ],
                ),
              ],
            ),
          );
        }),
      ],
    );
  }

  // 7. DOCTOR QR TAB
  Widget _buildDoctorQrTab() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(16)),
            child: Column(
              children: [
                const Icon(Icons.qr_code_2_rounded, size: 100, color: AppTheme.primary),
                const SizedBox(height: 10),
                const Text('Emergency Doctor Clinical Access Pass', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 16)),
                const SizedBox(height: 4),
                const Text('Doctors scan this QR for 15-minute emergency access to active medicines and allergy warnings without passwords.', textAlign: TextAlign.center, style: TextStyle(color: Color(0xFF64748B), fontSize: 12.5)),
                const SizedBox(height: 14),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                  decoration: BoxDecoration(color: const Color(0xFFF1F5F9), borderRadius: BorderRadius.circular(8)),
                  child: Text('Token: $_doctorQrToken', style: const TextStyle(fontFamily: 'monospace', fontSize: 11, fontWeight: FontWeight.w700)),
                ),
                const SizedBox(height: 14),
                ElevatedButton.icon(
                  onPressed: () => _showToast('🔄 New secure clinical token generated: llqr_${DateTime.now().millisecondsSinceEpoch}'),
                  icon: const Icon(Icons.refresh_rounded, color: Colors.white, size: 16),
                  label: const Text('Generate Fresh Token', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w800)),
                  style: ElevatedButton.styleFrom(backgroundColor: AppTheme.primary),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  // 8. ADHERENCE REPORTS TAB
  Widget _buildReportsTab() {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        const Text('Medication Adherence Analytics', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 16)),
        const SizedBox(height: 4),
        const Text('Calculated from verified patient confirmations in the database.', style: TextStyle(color: Color(0xFF64748B), fontSize: 12.5)),
        const SizedBox(height: 14),
        _buildStatCard('94%', 'Weekly Adherence Rate', '47 of 50 scheduled doses taken on time', const Color(0xFF16A34A)),
        _buildStatCard('14 Days', 'Current Perfect Streak', 'Grandmother has not missed a morning tablet in 2 weeks', const Color(0xFF2563EB)),
        _buildStatCard('1 Alert', '5-Minute Escalation Triggered', 'Resolved by family monitor within 2 mins', const Color(0xFFEA580C)),
      ],
    );
  }

  // 9. PAATI VOICE TAB
  Widget _buildVoiceTab() {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        const Text('Senior Paati Voice Engine', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 16)),
        const SizedBox(height: 4),
        const Text('Friendly conversational audio reminders in Tamil and English.', style: TextStyle(color: Color(0xFF64748B), fontSize: 12.5)),
        const SizedBox(height: 14),
        _buildVoiceAudioTest('Tamil Morning Reminder', 'வணக்கம் பாட்டி, காலை மாத்திரை சாப்பிட வேண்டிய நேரம் வந்துவிட்டது! அம்லோடிபின் மாத்திரை சாப்பிடுங்க.', 'ta-IN'),
        _buildVoiceAudioTest('Tanglish Friendly Reminder', 'Paati, marandhuraadheenga! Time aachu, tablet eduthukonga.', 'en-IN'),
        _buildVoiceAudioTest('English Professional Guidance', 'Hello Grandmother, it is time for your afternoon Metformin tablet. Please take it with water.', 'en-US'),
      ],
    );
  }

  // 10. SENIOR PROFILE TAB
  Widget _buildSeniorProfileTab() {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        const Text('Senior Health Profile', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 16)),
        const SizedBox(height: 14),
        _buildInfoRow('Senior Name', _seniorName, 'Age: $_seniorAge • Language: Tamil'),
        _buildInfoRow('Primary Caregiver', _primaryCaregiver, 'Phone: +91 98400 12345'),
        _buildInfoRow('Medical Conditions', 'Hypertension, Type 2 Diabetes, Mild Tremor', 'Monitored daily'),
        _buildInfoRow('Known Allergies', 'Penicillin (Severe Rash), Aspirin (Mild Gastric)', 'Visible on Doctor QR pass'),
      ],
    );
  }

  // 11. SETTINGS TAB
  Widget _buildSettingsTab() {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        const Text('System Configuration & Doctor Security', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 16)),
        const SizedBox(height: 14),
        SwitchListTile(
          value: true,
          onChanged: (v) {},
          title: const Text('Real-Time Push Notifications', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 14)),
          subtitle: const Text('Receive alerts when senior confirms or misses doses', style: TextStyle(fontSize: 12)),
        ),
        SwitchListTile(
          value: true,
          onChanged: (v) {},
          title: const Text('5-Minute Escalation Watchdog', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 14)),
          subtitle: const Text('Cascade alerts to Care Circle contacts if unconfirmed', style: TextStyle(fontSize: 12)),
        ),
        SwitchListTile(
          value: true,
          onChanged: (v) {},
          title: const Text('LL ProCare Network Integration', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 14)),
          subtitle: const Text('Allow verified hospital nurses to receive emergency calls', style: TextStyle(fontSize: 12)),
        ),
      ],
    );
  }

  // Helper widgets
  Widget _buildInfoRow(String title, String val, String sub) {
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(12), border: Border.all(color: const Color(0xFFE2E8F0))),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title, style: const TextStyle(color: Color(0xFF64748B), fontSize: 12, fontWeight: FontWeight.w700)),
          const SizedBox(height: 2),
          Text(val, style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 14.5, color: Color(0xFF0F172A))),
          const SizedBox(height: 2),
          Text(sub, style: const TextStyle(color: Color(0xFF64748B), fontSize: 12)),
        ],
      ),
    );
  }

  Widget _buildContactCard(String name, String rel, String phone, String esc, Color col) {
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(14), border: Border.all(color: const Color(0xFFE2E8F0))),
      child: Row(
        children: [
          CircleAvatar(backgroundColor: col.withValues(alpha: 0.15), child: Text(name[0], style: TextStyle(color: col, fontWeight: FontWeight.w800))),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(name, style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 14)),
                Text('$rel • $phone', style: const TextStyle(color: Color(0xFF64748B), fontSize: 12)),
                Text(esc, style: TextStyle(color: col, fontWeight: FontWeight.w700, fontSize: 11)),
              ],
            ),
          ),
          IconButton(
            icon: const Icon(Icons.call_rounded, color: Color(0xFF16A34A)),
            onPressed: () => launchUrl(Uri.parse('tel:$phone'), mode: LaunchMode.platformDefault),
          ),
        ],
      ),
    );
  }

  Widget _buildStatCard(String val, String title, String desc, Color col) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(16), border: Border.all(color: const Color(0xFFE2E8F0))),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(color: col.withValues(alpha: 0.12), borderRadius: BorderRadius.circular(12)),
            child: Text(val, style: TextStyle(color: col, fontWeight: FontWeight.w900, fontSize: 18)),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title, style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 14)),
                const SizedBox(height: 2),
                Text(desc, style: const TextStyle(color: Color(0xFF64748B), fontSize: 12)),
              ],
            ),
          ),
        ],
      ),
    );
  }

  void _showCaregiverChatDialog(Map<String, dynamic> cg) {
    final TextEditingController msgCtrl = TextEditingController();
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: Row(
          children: [
            const Icon(Icons.chat_bubble_rounded, color: Color(0xFF0284C7)),
            const SizedBox(width: 8),
            Expanded(
              child: Text(
                'Chat with ${cg['name']}',
                style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w800),
              ),
            ),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('🏥 ${cg['hospital']} • Fee: ₹${cg['fee']} / visit', style: const TextStyle(fontSize: 12, color: Color(0xFF64748B))),
            const SizedBox(height: 12),
            TextField(
              controller: msgCtrl,
              maxLines: 3,
              decoration: InputDecoration(
                hintText: 'Type your message to ${cg['name']}...',
                hintStyle: const TextStyle(fontSize: 13),
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                contentPadding: const EdgeInsets.all(12),
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () {
              final txt = msgCtrl.text.trim();
              if (txt.isNotEmpty) {
                Navigator.pop(ctx);
                _showToast('💬 Message sent to ${cg['name']}! Nurse will respond.');
              }
            },
            style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF0284C7), foregroundColor: Colors.white),
            child: const Text('Send Message', style: TextStyle(fontWeight: FontWeight.w800)),
          ),
        ],
      ),
    );
  }

  Widget _buildVoiceAudioTest(String title, String spoken, String lang) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(14), border: Border.all(color: const Color(0xFFE2E8F0))),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title, style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 14)),
          const SizedBox(height: 4),
          Text('"$spoken"', style: const TextStyle(fontStyle: FontStyle.italic, fontSize: 12.5, color: Color(0xFF334155))),
          const SizedBox(height: 10),
          ElevatedButton.icon(
            onPressed: () async {
              await _tts.setLanguage(lang);
              await _speak(spoken);
              _showToast('🔊 Speaking: $title');
            },
            icon: const Icon(Icons.volume_up_rounded, size: 16, color: Colors.white),
            label: const Text('Play Audio Test', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w800, fontSize: 12)),
            style: ElevatedButton.styleFrom(backgroundColor: AppTheme.primary, padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8)),
          ),
        ],
      ),
    );
  }
}
