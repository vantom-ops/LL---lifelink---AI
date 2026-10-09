import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import '../constants/api_constants.dart';
import '../constants/theme.dart';
import 'role_selector_screen.dart';

class MobileCaregiverScreen extends StatefulWidget {
  const MobileCaregiverScreen({super.key});

  @override
  State<MobileCaregiverScreen> createState() => _MobileCaregiverScreenState();
}

class _MobileCaregiverScreenState extends State<MobileCaregiverScreen> {
  bool _isEscalating = false;
  String? _toastMessage;

  // Senior demo state
  final String _seniorName = 'Kalyani Ammal (Paati)';
  final int _seniorAge = 78;
  final String _relationship = 'Mother';
  final String _seniorPhone = '+91 98400 67890';
  final String _doctorQrToken = 'llqr_351f93de14e9d68ceac3067175fc5e030f86d50c5e046fcb';

  final List<Map<String, dynamic>> _medications = [
    {
      'name': 'Amlodipine',
      'dose': '5mg (1 tablet)',
      'time': '08:00 AM',
      'status': 'taken',
      'takenTime': '08:05 AM',
      'indication': 'Blood Pressure',
      'color': Color(0xFF16A34A),
    },
    {
      'name': 'Metformin',
      'dose': '500mg (1 tablet)',
      'time': '01:00 PM',
      'status': 'taken',
      'takenTime': '01:12 PM',
      'indication': 'Type 2 Diabetes',
      'color': Color(0xFF16A34A),
    },
    {
      'name': 'Atorvastatin',
      'dose': '20mg (1 tablet)',
      'time': '08:00 PM',
      'status': 'scheduled',
      'takenTime': null,
      'indication': 'Cholesterol & Heart',
      'color': Color(0xFFFF7A00),
    },
  ];

  Future<void> _simulateEscalation() async {
    setState(() => _isEscalating = true);
    try {
      final res = await http.post(
        Uri.parse('${ApiConstants.baseUrl}/demo/simulate-timeout'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({}),
      );

      if (mounted) {
        if (res.statusCode == 200) {
          _showBanner('🚨 5-Minute Escalation simulated! Alert sent to family caregiver phone.');
        } else {
          _showBanner('Escalation simulation triggered (Dev fallback active).');
        }
      }
    } catch (e) {
      if (mounted) {
        _showBanner('Simulated 5-min alert dispatched to family caregivers.');
      }
    } finally {
      if (mounted) setState(() => _isEscalating = false);
    }
  }

  void _showBanner(String msg) {
    setState(() => _toastMessage = msg);
    Future.delayed(const Duration(seconds: 4), () {
      if (mounted) setState(() => _toastMessage = null);
    });
  }

  void _showDoctorQrModal() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
      ),
      builder: (ctx) => Padding(
        padding: const EdgeInsets.fromLTRB(24, 20, 24, 36),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Center(
              child: Container(
                width: 48,
                height: 5,
                decoration: BoxDecoration(
                  color: Colors.grey.shade300,
                  borderRadius: BorderRadius.circular(10),
                ),
              ),
            ),
            const SizedBox(height: 16),
            Row(
              children: const [
                Icon(Icons.qr_code_2_rounded, color: AppTheme.primary, size: 28),
                SizedBox(width: 10),
                Text(
                  'Doctor Access QR Code',
                  style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
                ),
              ],
            ),
            const SizedBox(height: 12),
            const Text(
              'Show this QR code at the clinic or hospital. The doctor scans it to view Paati\'s medications, allergies, and health history with 1-hour temporary read access.',
              style: TextStyle(color: AppTheme.textMuted, fontSize: 14, height: 1.4),
            ),
            const SizedBox(height: 20),
            Center(
              child: Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: AppTheme.border, width: 2),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withValues(alpha: 0.05),
                      blurRadius: 15,
                      offset: const Offset(0, 6),
                    )
                  ],
                ),
                child: Column(
                  children: [
                    Container(
                      width: 180,
                      height: 180,
                      decoration: BoxDecoration(
                        color: Colors.orange.shade50,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: AppTheme.primary.withValues(alpha: 0.3)),
                      ),
                      child: const Center(
                        child: Icon(Icons.qr_code_rounded, size: 140, color: AppTheme.textMain),
                      ),
                    ),
                    const SizedBox(height: 12),
                    Text(
                      'Token: ${_doctorQrToken.substring(0, 16)}...',
                      style: const TextStyle(
                        fontFamily: 'monospace',
                        fontWeight: FontWeight.bold,
                        fontSize: 12,
                        color: AppTheme.textMuted,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        color: AppTheme.successBg,
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: const Text(
                        '✓ Active & Verified',
                        style: TextStyle(
                          color: AppTheme.success,
                          fontWeight: FontWeight.bold,
                          fontSize: 12,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 20),
            ElevatedButton(
              onPressed: () => Navigator.pop(ctx),
              child: const Text('Close QR Preview'),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFFBF8F5),
      appBar: AppBar(
        title: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
              decoration: BoxDecoration(
                color: AppTheme.primaryLight,
                borderRadius: BorderRadius.circular(8),
              ),
              child: const Row(
                children: [
                  Icon(Icons.shield_rounded, size: 16, color: AppTheme.primary),
                  SizedBox(width: 4),
                  Text(
                    'MONITOR',
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w900,
                      color: AppTheme.primary,
                      letterSpacing: 0.5,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(width: 8),
            const Text(
              'Caregiver Mode',
              style: TextStyle(fontSize: 19, fontWeight: FontWeight.bold),
            ),
          ],
        ),
        actions: [
          TextButton.icon(
            onPressed: () {
              Navigator.pushReplacement(
                context,
                MaterialPageRoute(builder: (_) => const RoleSelectorScreen()),
              );
            },
            icon: const Icon(Icons.swap_horiz_rounded, size: 20, color: AppTheme.primary),
            label: const Text(
              'Switch Mode',
              style: TextStyle(color: AppTheme.primary, fontWeight: FontWeight.bold),
            ),
          ),
          const SizedBox(width: 8),
        ],
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              if (_toastMessage != null)
                Container(
                  margin: const EdgeInsets.only(bottom: 16),
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: const Color(0xFFFEF2F2),
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(color: const Color(0xFFF87171)),
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.notifications_active_rounded, color: AppTheme.danger),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Text(
                          _toastMessage!,
                          style: const TextStyle(
                            color: Color(0xFF991B1B),
                            fontWeight: FontWeight.bold,
                            fontSize: 14,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),

              // Senior Header Banner Card
              Container(
                padding: const EdgeInsets.all(18),
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    colors: [Color(0xFFFFF7ED), Colors.white],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  borderRadius: BorderRadius.circular(22),
                  border: Border.all(color: AppTheme.primary.withValues(alpha: 0.25)),
                  boxShadow: [
                    BoxShadow(
                      color: AppTheme.primary.withValues(alpha: 0.08),
                      blurRadius: 16,
                      offset: const Offset(0, 4),
                    ),
                  ],
                ),
                child: Column(
                  children: [
                    Row(
                      children: [
                        CircleAvatar(
                          radius: 30,
                          backgroundColor: AppTheme.primary,
                          child: const Text(
                            'KA',
                            style: TextStyle(
                              color: Colors.white,
                              fontSize: 22,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                        const SizedBox(width: 14),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                children: [
                                  Flexible(
                                    child: Text(
                                      _seniorName,
                                      style: const TextStyle(
                                        fontSize: 20,
                                        fontWeight: FontWeight.w800,
                                        color: AppTheme.textMain,
                                      ),
                                    ),
                                  ),
                                  const SizedBox(width: 6),
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                    decoration: BoxDecoration(
                                      color: AppTheme.successBg,
                                      borderRadius: BorderRadius.circular(6),
                                    ),
                                    child: const Text(
                                      '● Live Sync',
                                      style: TextStyle(
                                        color: AppTheme.success,
                                        fontSize: 11,
                                        fontWeight: FontWeight.bold,
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 4),
                              Text(
                                'Age $_seniorAge • Relationship: $_relationship • Phone: $_seniorPhone',
                                style: const TextStyle(
                                  fontSize: 13,
                                  color: AppTheme.textMuted,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 14),
                    const Divider(height: 1),
                    const SizedBox(height: 12),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceAround,
                      children: [
                        _buildStat('Adherence', '92%', AppTheme.success),
                        _buildStat('Today Dose', '2 of 3 Done', AppTheme.primary),
                        _buildStat('5-Min Guard', 'Active', Colors.blue.shade700),
                      ],
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 20),

              // Quick Action Bar
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton.icon(
                      style: OutlinedButton.styleFrom(
                        foregroundColor: AppTheme.danger,
                        side: const BorderSide(color: AppTheme.danger, width: 1.5),
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                      ),
                      onPressed: _isEscalating ? null : _simulateEscalation,
                      icon: _isEscalating
                          ? const SizedBox(
                              width: 16,
                              height: 16,
                              child: CircularProgressIndicator(strokeWidth: 2, color: AppTheme.danger),
                            )
                          : const Icon(Icons.warning_amber_rounded, size: 20),
                      label: const Text(
                        'Simulate 5-Min Alert',
                        style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                      ),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: ElevatedButton.icon(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppTheme.primary,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                      ),
                      onPressed: _showDoctorQrModal,
                      icon: const Icon(Icons.qr_code_rounded, size: 20),
                      label: const Text(
                        'Doctor QR Pass',
                        style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                      ),
                    ),
                  ),
                ],
              ),

              const SizedBox(height: 24),

              // Today's Medication Tracker
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: const [
                  Text(
                    "Today's Medication Doses",
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.w800,
                      color: AppTheme.textMain,
                    ),
                  ),
                  Text(
                    'Real-time status',
                    style: TextStyle(fontSize: 13, color: AppTheme.textMuted),
                  ),
                ],
              ),
              const SizedBox(height: 12),

              ..._medications.map((m) => _buildMedicationCard(m)),

              const SizedBox(height: 24),

              // Health & Condition Profile Card
              Container(
                padding: const EdgeInsets.all(18),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: AppTheme.border),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: const [
                        Icon(Icons.favorite_rounded, color: AppTheme.danger, size: 22),
                        SizedBox(width: 8),
                        Text(
                          'Paati Health Condition Overview',
                          style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                        ),
                      ],
                    ),
                    const SizedBox(height: 14),
                    _buildHealthRow(Icons.directions_walk_rounded, 'Mobility', 'Walks with support / cane'),
                    _buildHealthRow(Icons.visibility_rounded, 'Vision', 'Uses reading glasses'),
                    _buildHealthRow(Icons.hearing_rounded, 'Hearing', 'Normal hearing, clear responses'),
                    _buildHealthRow(Icons.bloodtype_rounded, 'Blood Group', 'B Positive (B+)'),
                    _buildHealthRow(Icons.warning_amber_rounded, 'Known Allergies', 'Penicillin, Sulfa drugs'),
                    _buildHealthRow(Icons.medical_services_rounded, 'Conditions', 'Hypertension, Mild Arthritis, Diabetes'),
                  ],
                ),
              ),

              const SizedBox(height: 24),

              // Emergency Call button
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: AppTheme.border),
                ),
                child: Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: const BoxDecoration(
                        color: AppTheme.successBg,
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(Icons.phone_in_talk_rounded, color: AppTheme.success, size: 26),
                    ),
                    const SizedBox(width: 14),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            'Emergency Contact Phone',
                            style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
                          ),
                          Text(
                            _seniorPhone,
                            style: const TextStyle(color: AppTheme.textMuted, fontSize: 13),
                          ),
                        ],
                      ),
                    ),
                    ElevatedButton(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppTheme.success,
                        minimumSize: const Size(80, 44),
                        padding: const EdgeInsets.symmetric(horizontal: 16),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                      onPressed: () {
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(content: Text('Calling Paati at $_seniorPhone...')),
                        );
                      },
                      child: const Text('Call', style: TextStyle(fontSize: 15)),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 30),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildStat(String label, String value, Color color) {
    return Column(
      children: [
        Text(
          value,
          style: TextStyle(
            fontSize: 17,
            fontWeight: FontWeight.w900,
            color: color,
          ),
        ),
        const SizedBox(height: 2),
        Text(
          label,
          style: const TextStyle(
            fontSize: 12,
            color: AppTheme.textMuted,
            fontWeight: FontWeight.w500,
          ),
        ),
      ],
    );
  }

  Widget _buildMedicationCard(Map<String, dynamic> m) {
    final bool isTaken = m['status'] == 'taken';
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: isTaken ? AppTheme.success.withValues(alpha: 0.3) : AppTheme.border,
          width: isTaken ? 1.5 : 1.0,
        ),
      ),
      child: Row(
        children: [
          Container(
            width: 44,
            height: 44,
            decoration: BoxDecoration(
              color: isTaken ? AppTheme.successBg : AppTheme.primaryLight,
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(
              isTaken ? Icons.check_circle_rounded : Icons.access_time_filled_rounded,
              color: isTaken ? AppTheme.success : AppTheme.primary,
              size: 26,
            ),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Text(
                      m['name'],
                      style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                        color: AppTheme.textMain,
                      ),
                    ),
                    const SizedBox(width: 8),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                      decoration: BoxDecoration(
                        color: Colors.grey.shade100,
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: Text(
                        m['dose'],
                        style: const TextStyle(fontSize: 11, color: AppTheme.textMuted),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 4),
                Text(
                  '${m['indication']} • Scheduled: ${m['time']}',
                  style: const TextStyle(fontSize: 12, color: AppTheme.textMuted),
                ),
              ],
            ),
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
            decoration: BoxDecoration(
              color: isTaken ? AppTheme.successBg : AppTheme.primaryLight,
              borderRadius: BorderRadius.circular(20),
            ),
            child: Text(
              isTaken ? '✓ ${m['takenTime']}' : 'Pending',
              style: TextStyle(
                color: isTaken ? AppTheme.success : AppTheme.primary,
                fontWeight: FontWeight.bold,
                fontSize: 12,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildHealthRow(IconData icon, String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, size: 18, color: AppTheme.primary),
          const SizedBox(width: 10),
          SizedBox(
            width: 120,
            child: Text(
              label,
              style: const TextStyle(
                fontWeight: FontWeight.w600,
                fontSize: 13,
                color: AppTheme.textMuted,
              ),
            ),
          ),
          Expanded(
            child: Text(
              value,
              style: const TextStyle(
                fontWeight: FontWeight.bold,
                fontSize: 13,
                color: AppTheme.textMain,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
