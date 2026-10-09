import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../constants/theme.dart';
import '../models/medication_event.dart';
import '../services/api_service.dart';
import '../services/voice_service.dart';

class MedicationDetailScreen extends StatefulWidget {
  final MedicationEvent event;
  final String patientId;
  final String languagePreference;
  final String preferredName;

  const MedicationDetailScreen({
    super.key,
    required this.event,
    required this.patientId,
    required this.languagePreference,
    required this.preferredName,
  });

  @override
  State<MedicationDetailScreen> createState() => _MedicationDetailScreenState();
}

class _MedicationDetailScreenState extends State<MedicationDetailScreen> {
  bool _isSpeaking = false;

  Future<void> _playVoice() async {
    setState(() => _isSpeaking = true);
    await VoiceService.speakMedicineReminder(
      medicineName: widget.event.medicationName,
      dose: '${widget.event.dose} ${widget.event.unit}',
      foodInstruction: widget.event.foodRelation,
      language: widget.languagePreference,
      patientName: widget.preferredName,
    );
    if (mounted) setState(() => _isSpeaking = false);
  }

  Future<void> _confirmTaken() async {
    await mobileApi.confirmTaken(widget.event.id, widget.patientId);
    if (!mounted) return;
    Navigator.pop(context, true);
  }

  Future<void> _markNotTaken() async {
    await mobileApi.markNotTaken(widget.event.id, widget.patientId);
    if (!mounted) return;
    Navigator.pop(context, true);
  }

  @override
  Widget build(BuildContext context) {
    final timeStr = DateFormat('hh:mm a').format(widget.event.scheduledTime);

    return Scaffold(
      backgroundColor: AppTheme.background,
      appBar: AppBar(
        title: const Text('Medication Details'),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Pill Image / Graphic
            Center(
              child: Container(
                width: 120,
                height: 120,
                decoration: BoxDecoration(
                  color: Colors.white,
                  shape: BoxShape.circle,
                  border: Border.all(color: AppTheme.primary, width: 3),
                  boxShadow: const [
                    BoxShadow(
                      color: Color(0x20FF7A00),
                      blurRadius: 16,
                      offset: Offset(0, 6),
                    )
                  ],
                ),
                child: const Icon(
                  Icons.medication_liquid_rounded,
                  size: 64,
                  color: AppTheme.primary,
                ),
              ),
            ),
            const SizedBox(height: 24),

            // Medicine Name & Dose
            Text(
              widget.event.medicationName,
              textAlign: TextAlign.center,
              style: const TextStyle(
                fontSize: 30,
                fontWeight: FontWeight.w900,
                color: AppTheme.textMain,
              ),
            ),
            const SizedBox(height: 6),
            Text(
              '${widget.event.dose} ${widget.event.unit}',
              textAlign: TextAlign.center,
              style: const TextStyle(
                fontSize: 22,
                fontWeight: FontWeight.bold,
                color: AppTheme.primary,
              ),
            ),
            const SizedBox(height: 24),

            // Information Card
            Card(
              child: Padding(
                padding: const EdgeInsets.all(20.0),
                child: Column(
                  children: [
                    _buildInfoRow(Icons.access_time_filled_rounded, 'Scheduled Time', timeStr),
                    const Divider(height: 24),
                    _buildInfoRow(Icons.restaurant_rounded, 'Food Instruction', widget.event.foodRelation),
                    const Divider(height: 24),
                    _buildInfoRow(Icons.info_outline_rounded, 'Doctor Note', widget.event.instructions),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 24),

            // VOICE REMINDER BUTTON
            OutlinedButton.icon(
              onPressed: _playVoice,
              icon: Icon(
                _isSpeaking ? Icons.volume_up_rounded : Icons.record_voice_over_rounded,
                color: AppTheme.primary,
                size: 26,
              ),
              label: Text(
                _isSpeaking ? 'Playing Voice...' : 'Play Voice Reminder',
                style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
              ),
              style: OutlinedButton.styleFrom(
                minimumSize: const Size(double.infinity, 56),
                side: const BorderSide(color: AppTheme.primary, width: 2),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
              ),
            ),
            const SizedBox(height: 16),

            // CONFIRM TAKEN
            ElevatedButton.icon(
              onPressed: _confirmTaken,
              icon: const Icon(Icons.check_circle_rounded, size: 28),
              label: const Text('I HAVE TAKEN THIS', style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
              style: ElevatedButton.styleFrom(
                backgroundColor: AppTheme.success,
                minimumSize: const Size(double.infinity, 64),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)),
              ),
            ),
            const SizedBox(height: 12),

            // NOT TAKEN
            TextButton(
              onPressed: _markNotTaken,
              child: const Text(
                'I Did Not Take This Medicine',
                style: TextStyle(fontSize: 17, color: AppTheme.danger, fontWeight: FontWeight.bold),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildInfoRow(IconData icon, String label, String value) {
    return Row(
      children: [
        Icon(icon, color: AppTheme.primary, size: 24),
        const SizedBox(width: 14),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(label, style: const TextStyle(fontSize: 14, color: AppTheme.textMuted)),
              const SizedBox(height: 2),
              Text(
                value,
                style: const TextStyle(fontSize: 17, fontWeight: FontWeight.bold, color: AppTheme.textMain),
              ),
            ],
          ),
        ),
      ],
    );
  }
}
