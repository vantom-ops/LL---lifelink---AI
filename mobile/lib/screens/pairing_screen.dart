import 'package:flutter/material.dart';
import '../constants/theme.dart';
import '../services/api_service.dart';
import 'senior_home_screen.dart';
import 'role_selector_screen.dart';

class PairingScreen extends StatefulWidget {
  const PairingScreen({super.key});

  @override
  State<PairingScreen> createState() => _PairingScreenState();
}

class _PairingScreenState extends State<PairingScreen> {
  final TextEditingController _codeController = TextEditingController();
  bool _isLoading = false;
  String? _errorMessage;

  Future<void> _handlePair(String code) async {
    if (code.trim().isEmpty) {
      setState(() => _errorMessage = 'Please enter the 6-digit code');
      return;
    }

    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    final patient = await mobileApi.pairDevice(code);

    if (!mounted) return;
    setState(() => _isLoading = false);

    if (patient != null) {
      // Success modal
      showDialog(
        context: context,
        barrierDismissible: false,
        builder: (ctx) => AlertDialog(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
          title: Row(
            children: const [
              Icon(Icons.check_circle_rounded, color: AppTheme.success, size: 28),
              SizedBox(width: 8),
              Text('Device Paired!'),
            ],
          ),
          content: Text(
            'Welcome ${patient.preferredName}! Your phone is now securely connected to your caregiver.',
            style: const TextStyle(fontSize: 18),
          ),
          actions: [
            ElevatedButton(
              onPressed: () {
                Navigator.pop(ctx);
                Navigator.pushReplacement(
                  context,
                  MaterialPageRoute(builder: (_) => SeniorHomeScreen(patient: patient)),
                );
              },
              child: const Text('Start Using App'),
            )
          ],
        ),
      );
    } else {
      setState(() {
        _errorMessage = 'Invalid or expired code. Please verify with your caregiver.';
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.background,
      appBar: AppBar(
        title: const Text('Patient Login'),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_rounded),
          onPressed: () {
            Navigator.pushReplacement(
              context,
              MaterialPageRoute(builder: (_) => const RoleSelectorScreen()),
            );
          },
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
          const SizedBox(width: 6),
        ],
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const SizedBox(height: 16),
              Center(
                child: Container(
                  width: 80,
                  height: 80,
                  decoration: BoxDecoration(
                    color: AppTheme.primaryLight,
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(
                    Icons.qr_code_scanner_rounded,
                    size: 42,
                    color: AppTheme.primary,
                  ),
                ),
              ),
              const SizedBox(height: 24),
              const Text(
                'Enter Pairing Code',
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 26,
                  fontWeight: FontWeight.w800,
                  color: AppTheme.textMain,
                ),
              ),
              const SizedBox(height: 12),
              const Text(
                'Ask your son, daughter or caregiver for the 6-digit code shown on their web dashboard.',
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 16,
                  color: AppTheme.textMuted,
                  height: 1.4,
                ),
              ),
              const SizedBox(height: 32),

              if (_errorMessage != null)
                Container(
                  margin: const EdgeInsets.only(bottom: 16),
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: AppTheme.dangerBg,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: AppTheme.danger.withValues(alpha: 0.3)),
                  ),
                  child: Text(
                    _errorMessage!,
                    textAlign: TextAlign.center,
                    style: const TextStyle(
                      color: AppTheme.danger,
                      fontSize: 15,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),

              // Code Input Box
              TextField(
                controller: _codeController,
                textAlign: TextAlign.center,
                textCapitalization: TextCapitalization.characters,
                style: const TextStyle(
                  fontSize: 28,
                  fontWeight: FontWeight.w800,
                  letterSpacing: 6,
                  color: AppTheme.primary,
                ),
                decoration: InputDecoration(
                  hintText: 'LL-882200',
                  hintStyle: TextStyle(
                    color: Colors.grey.shade400,
                    letterSpacing: 4,
                  ),
                  fillColor: Colors.white,
                  filled: true,
                  contentPadding: const EdgeInsets.symmetric(vertical: 20),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(16),
                    borderSide: const BorderSide(color: AppTheme.border, width: 2),
                  ),
                  focusedBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(16),
                    borderSide: const BorderSide(color: AppTheme.primary, width: 2.5),
                  ),
                ),
              ),
              const SizedBox(height: 24),

              ElevatedButton(
                onPressed: _isLoading ? null : () => _handlePair(_codeController.text),
                child: _isLoading
                    ? const CircularProgressIndicator(color: Colors.white)
                    : const Text('Confirm & Link Phone'),
              ),
              const SizedBox(height: 24),

              // Hackathon Quick Demo Button
              OutlinedButton.icon(
                onPressed: _isLoading
                    ? null
                    : () {
                        _codeController.text = 'LL-882200';
                        _handlePair('LL-882200');
                      },
                icon: const Icon(Icons.bolt_rounded, color: AppTheme.primary),
                label: const Text(
                  'Use Demo Code: LL-882200 (Paati)',
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                    color: AppTheme.primary,
                  ),
                ),
                style: OutlinedButton.styleFrom(
                  minimumSize: const Size(double.infinity, 54),
                  side: const BorderSide(color: AppTheme.primary, width: 1.5),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(16),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
