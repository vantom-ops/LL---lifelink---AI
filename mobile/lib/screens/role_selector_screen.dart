import 'package:flutter/material.dart';
import '../constants/theme.dart';
import '../services/storage_service.dart';
import 'mobile_caregiver_screen.dart';
import 'pairing_screen.dart';
import 'senior_home_screen.dart';
import 'unified_platform_screen.dart';

class RoleSelectorScreen extends StatefulWidget {
  const RoleSelectorScreen({super.key});

  @override
  State<RoleSelectorScreen> createState() => _RoleSelectorScreenState();
}

class _RoleSelectorScreenState extends State<RoleSelectorScreen> {
  dynamic _pairedPatient;

  @override
  void initState() {
    super.initState();
    _checkPairedStatus();
  }

  Future<void> _checkPairedStatus() async {
    final patient = await MobileStorageService.getPatient();
    if (mounted) {
      setState(() {
        _pairedPatient = patient;
      });
    }
  }

  void _navigateToPatient() {
    if (_pairedPatient != null) {
      Navigator.push(
        context,
        MaterialPageRoute(builder: (_) => SeniorHomeScreen(patient: _pairedPatient)),
      );
    } else {
      Navigator.push(
        context,
        MaterialPageRoute(builder: (_) => const PairingScreen()),
      );
    }
  }

  void _navigateToMonitor() {
    Navigator.push(
      context,
      MaterialPageRoute(builder: (_) => const MobileCaregiverScreen()),
    );
  }

  void _openFullUnifiedPlatform() {
    Navigator.push(
      context,
      MaterialPageRoute(builder: (_) => const UnifiedPlatformScreen()),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFFFF9F2),
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        title: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 34,
              height: 34,
              decoration: BoxDecoration(
                color: AppTheme.primary,
                borderRadius: BorderRadius.circular(10),
              ),
              child: const Icon(Icons.favorite_rounded, color: Colors.white, size: 20),
            ),
            const SizedBox(width: 8),
            const Text(
              'LL LifeLink',
              style: TextStyle(
                fontWeight: FontWeight.w900,
                fontSize: 22,
                color: AppTheme.textMain,
              ),
            ),
          ],
        ),
        centerTitle: true,
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // UNIFIED WEB + MOBILE EXPERIENCE CARD
              Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    colors: [Color(0xFFFF7A00), Color(0xFFFF9533)],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  borderRadius: BorderRadius.circular(20),
                  boxShadow: const [
                    BoxShadow(
                      color: Color(0x4DFF7A00),
                      blurRadius: 16,
                      offset: Offset(0, 6),
                    ),
                  ],
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.all(10),
                          decoration: BoxDecoration(
                            color: const Color(0x40FFFFFF),
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: const Icon(Icons.devices_rounded, color: Colors.white, size: 26),
                        ),
                        const SizedBox(width: 14),
                        const Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'COMPLETE UNIFIED PLATFORM',
                                style: TextStyle(
                                  color: Colors.white,
                                  fontWeight: FontWeight.w900,
                                  fontSize: 14.5,
                                  letterSpacing: 0.5,
                                ),
                              ),
                              SizedBox(height: 2),
                              Text(
                                'Exact same website features on mobile',
                                style: TextStyle(
                                  color: Colors.white70,
                                  fontSize: 12,
                                  fontWeight: FontWeight.w500,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    const Text(
                      'Includes all 11 tabs: Live Feed, Prescriptions AI OCR, Medical Scans upload, Care Circle, Disability Assistance, Verified Caregivers, Doctor QR, Reports, and Senior Paati Voice.',
                      style: TextStyle(color: Colors.white, fontSize: 12.5, height: 1.4),
                    ),
                    const SizedBox(height: 16),
                    ElevatedButton.icon(
                      onPressed: _openFullUnifiedPlatform,
                      icon: const Icon(Icons.open_in_browser_rounded, color: AppTheme.primary, size: 18),
                      label: const Text(
                        'Open Full Experience (Same as Web)',
                        style: TextStyle(
                          color: AppTheme.primary,
                          fontWeight: FontWeight.w800,
                          fontSize: 13.5,
                        ),
                      ),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.white,
                        foregroundColor: AppTheme.primary,
                        padding: const EdgeInsets.symmetric(vertical: 13),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                        elevation: 0,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 20),
              const Center(
                child: Text(
                  'Or Select Native Mobile Mode',
                  style: TextStyle(
                    fontSize: 22,
                    fontWeight: FontWeight.w900,
                    color: AppTheme.textMain,
                    letterSpacing: -0.5,
                  ),
                ),
              ),
              const SizedBox(height: 6),
              const Center(
                child: Text(
                  'Choose your role to enter the appropriate dashboard',
                  style: TextStyle(
                    fontSize: 14,
                    color: AppTheme.textMuted,
                  ),
                ),
              ),
              const SizedBox(height: 20),

              // OPTION 1: MONITOR (Caregiver)
              _buildRoleCard(
                title: '1. MONITOR',
                badgeText: 'Caregiver / Family',
                subtitle: 'Son, Daughter or Family Caregiver',
                description:
                    'Monitor senior adherence in real time, configure medications, trigger 5-minute escalation test, and manage Doctor QR passes.',
                icon: Icons.monitor_heart_rounded,
                accentColor: AppTheme.primary,
                buttonText: 'Open Monitor Dashboard',
                isPrimary: true,
                onTap: _navigateToMonitor,
                features: const [
                  'Live pill status & adherence alerts',
                  'Simulate 5-minute escalation SMS',
                  'Doctor QR clinical access engine',
                  'Health condition & allergy records',
                ],
              ),

              const SizedBox(height: 24),

              // OPTION 2: PATIENT (Senior)
              _buildRoleCard(
                title: '2. PATIENT',
                badgeText: 'Senior / Grandparent',
                subtitle: 'Grandmother or Grandfather (Paati)',
                description:
                    'Simple code login with LL-882200. High-contrast large text, friendly voice guidance, and single-tap medication confirmations.',
                icon: Icons.person_rounded,
                accentColor: const Color(0xFF16A34A),
                buttonText: _pairedPatient != null
                    ? 'Open Patient Screen (${_pairedPatient.preferredName})'
                    : 'Code Login (LL-882200)',
                isPrimary: false,
                onTap: _navigateToPatient,
                features: const [
                  'Login with 6-digit code: LL-882200',
                  'Extra-large touch targets (≥60dp)',
                  'One-tap "I Took It" confirmation',
                  'Instant voice & audio reminders',
                ],
              ),

              const SizedBox(height: 24),

              // Connected Care Info
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: AppTheme.border),
                ),
                child: Row(
                  children: const [
                    Icon(Icons.info_outline_rounded, color: AppTheme.primary, size: 24),
                    SizedBox(width: 12),
                    Expanded(
                      child: Text(
                        'Connected Care: Monitor (Son) and Patient (Grandparent) modes are synchronized in real-time. Changes made in one instantly reflect in the other.',
                        style: TextStyle(
                          fontSize: 12.5,
                          color: AppTheme.textMuted,
                          height: 1.35,
                        ),
                      ),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 20),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildRoleCard({
    required String title,
    required String badgeText,
    required String subtitle,
    required String description,
    required IconData icon,
    required Color accentColor,
    required String buttonText,
    required bool isPrimary,
    required VoidCallback onTap,
    required List<String> features,
  }) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(
          color: accentColor.withValues(alpha: 0.35),
          width: 2.0,
        ),
        boxShadow: [
          BoxShadow(
            color: accentColor.withValues(alpha: 0.08),
            blurRadius: 18,
            offset: const Offset(0, 6),
          ),
        ],
      ),
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                width: 54,
                height: 54,
                decoration: BoxDecoration(
                  color: accentColor.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(16),
                ),
                child: Icon(icon, color: accentColor, size: 30),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Text(
                          title,
                          style: TextStyle(
                            fontSize: 19,
                            fontWeight: FontWeight.w900,
                            color: accentColor,
                          ),
                        ),
                        const SizedBox(width: 8),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                          decoration: BoxDecoration(
                            color: accentColor.withValues(alpha: 0.1),
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Text(
                            badgeText,
                            style: TextStyle(
                              fontSize: 11,
                              fontWeight: FontWeight.w800,
                              color: accentColor,
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 3),
                    Text(
                      subtitle,
                      style: const TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w600,
                        color: AppTheme.textMuted,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Text(
            description,
            style: const TextStyle(
              fontSize: 13.5,
              color: AppTheme.textMain,
              height: 1.4,
            ),
          ),
          const SizedBox(height: 14),
          const Divider(height: 1),
          const SizedBox(height: 12),
          // Features
          ...features.map(
            (f) => Padding(
              padding: const EdgeInsets.only(bottom: 6),
              child: Row(
                children: [
                  Icon(Icons.check_circle_rounded, color: accentColor, size: 16),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      f,
                      style: const TextStyle(
                        fontSize: 12.5,
                        fontWeight: FontWeight.w600,
                        color: AppTheme.textMuted,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: accentColor,
              foregroundColor: Colors.white,
              minimumSize: const Size(double.infinity, 52),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(14),
              ),
              elevation: 0,
            ),
            onPressed: onTap,
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text(
                  buttonText,
                  style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                ),
                const SizedBox(width: 8),
                const Icon(Icons.arrow_forward_rounded, size: 18),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
