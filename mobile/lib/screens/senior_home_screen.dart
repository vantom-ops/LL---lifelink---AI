import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../constants/theme.dart';
import '../models/patient_profile.dart';
import '../models/medication_event.dart';
import '../services/api_service.dart';
import '../services/voice_service.dart';
import 'history_screen.dart';
import 'documents_screen.dart';
import 'profile_screen.dart';
import 'role_selector_screen.dart';

class SeniorHomeScreen extends StatefulWidget {
  final PatientProfile patient;

  const SeniorHomeScreen({super.key, required this.patient});

  @override
  State<SeniorHomeScreen> createState() => _SeniorHomeScreenState();
}

class _SeniorHomeScreenState extends State<SeniorHomeScreen> {
  int _currentTabIndex = 0;
  List<MedicationEvent> _todayEvents = [];
  bool _isLoading = true;
  bool _isSpeaking = false;

  @override
  void initState() {
    super.initState();
    _loadSchedule();
  }

  Future<void> _loadSchedule() async {
    setState(() => _isLoading = true);
    final events = await mobileApi.getTodayEvents(widget.patient.id);
    if (mounted) {
      setState(() {
        _todayEvents = events;
        _isLoading = false;
      });
    }
  }

  Future<void> _confirmTaken(MedicationEvent event) async {
    // Optimistic UI update
    setState(() {
      event.status = 'TAKEN';
      event.takenAt = DateTime.now();
    });

    await mobileApi.confirmTaken(event.id, widget.patient.id);
    if (!mounted) return;

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        backgroundColor: AppTheme.success,
        content: Row(
          children: const [
            Icon(Icons.check_circle_rounded, color: Colors.white, size: 28),
            SizedBox(width: 12),
            Expanded(
              child: Text(
                'Good job! Medication recorded as TAKEN.',
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
              ),
            ),
          ],
        ),
        duration: const Duration(seconds: 3),
      ),
    );
  }

  Future<void> _playVoice(MedicationEvent event) async {
    setState(() => _isSpeaking = true);
    await VoiceService.speakMedicineReminder(
      medicineName: event.medicationName,
      dose: '${event.dose} ${event.unit}',
      foodInstruction: event.foodRelation,
      language: widget.patient.languagePreference,
      patientName: widget.patient.preferredName,
    );
    if (mounted) setState(() => _isSpeaking = false);
  }

  Widget _buildHomeContent() {
    final now = DateTime.now();
    final greeting = now.hour < 12
        ? 'Good morning'
        : now.hour < 17
            ? 'Good afternoon'
            : 'Good evening';

    final takenCount = _todayEvents.where((e) => e.isTaken).length;
    final totalCount = _todayEvents.length;
    final pendingCount = totalCount - takenCount;

    // Determine NEXT medication to show prominently
    final nextMed = _todayEvents.firstWhere(
      (e) => !e.isTaken,
      orElse: () => _todayEvents.isNotEmpty
          ? _todayEvents.last
          : MedicationEvent(
              id: '',
              medicationName: 'All Done for Today!',
              dose: '',
              unit: '',
              foodRelation: '',
              instructions: 'Great job! You have taken all scheduled doses.',
              scheduledTime: DateTime.now(),
              status: 'TAKEN',
            ),
    );

    final isAllTaken = totalCount > 0 && pendingCount == 0;

    return RefreshIndicator(
      onRefresh: _loadSchedule,
      color: AppTheme.primary,
      child: SingleChildScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.all(20.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Friendly Senior Greeting
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        '$greeting,',
                        style: const TextStyle(
                          fontSize: 22,
                          color: AppTheme.textMuted,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                      Text(
                        '${widget.patient.preferredName}!',
                        style: const TextStyle(
                          fontSize: 32,
                          fontWeight: FontWeight.w900,
                          color: AppTheme.textMain,
                          letterSpacing: -0.5,
                        ),
                      ),
                    ],
                  ),
                ),
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: AppTheme.primaryLight,
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Text(
                    DateFormat('EEE, d MMM').format(now),
                    style: const TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                      color: AppTheme.primary,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),

            // Profile Home Card (Tap opens My Profile)
            InkWell(
              onTap: () => setState(() => _currentTabIndex = 4),
              borderRadius: BorderRadius.circular(16),
              child: Card(
                elevation: 1,
                color: const Color(0xFFFFF7ED),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(16),
                  side: BorderSide(color: Colors.orange.shade200),
                ),
                child: Padding(
                  padding: const EdgeInsets.all(16.0),
                  child: Row(
                    children: [
                      CircleAvatar(
                        radius: 28,
                        backgroundColor: AppTheme.primary,
                        child: Text(
                          widget.patient.preferredName[0],
                          style: const TextStyle(fontSize: 26, fontWeight: FontWeight.bold, color: Colors.white),
                        ),
                      ),
                      const SizedBox(width: 14),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              widget.patient.preferredName,
                              style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: AppTheme.textMain),
                            ),
                            const SizedBox(height: 2),
                            Text(
                              isAllTaken
                                  ? 'All doses taken for today! 🎉'
                                  : 'Next: ${nextMed.medicationName} (${nextMed.dose} ${nextMed.unit})',
                              style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: AppTheme.primary),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                            const SizedBox(height: 2),
                            Text(
                              'Status: $takenCount of $totalCount taken (${widget.patient.mobilityStatus})',
                              style: const TextStyle(fontSize: 13, color: AppTheme.textMuted),
                            ),
                          ],
                        ),
                      ),
                      const Icon(Icons.arrow_forward_ios_rounded, size: 16, color: AppTheme.primary),
                    ],
                  ),
                ),
              ),
            ),
            const SizedBox(height: 16),

            // Today's Progress Strip
            Card(
              child: Padding(
                padding: const EdgeInsets.all(18.0),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceAround,
                  children: [
                    Column(
                      children: [
                        Text(
                          '$totalCount',
                          style: const TextStyle(
                            fontSize: 28,
                            fontWeight: FontWeight.w900,
                            color: AppTheme.textMain,
                          ),
                        ),
                        const SizedBox(height: 4),
                        const Text('Total Today', style: TextStyle(fontSize: 15, color: AppTheme.textMuted)),
                      ],
                    ),
                    Container(height: 40, width: 1.5, color: AppTheme.border),
                    Column(
                      children: [
                        Text(
                          '$takenCount',
                          style: const TextStyle(
                            fontSize: 28,
                            fontWeight: FontWeight.w900,
                            color: AppTheme.success,
                          ),
                        ),
                        const SizedBox(height: 4),
                        const Text('Taken', style: TextStyle(fontSize: 15, color: AppTheme.textMuted)),
                      ],
                    ),
                    Container(height: 40, width: 1.5, color: AppTheme.border),
                    Column(
                      children: [
                        Text(
                          '$pendingCount',
                          style: const TextStyle(
                            fontSize: 28,
                            fontWeight: FontWeight.w900,
                            color: AppTheme.warning,
                          ),
                        ),
                        const SizedBox(height: 4),
                        const Text('Remaining', style: TextStyle(fontSize: 15, color: AppTheme.textMuted)),
                      ],
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 24),

            // PROMINENT "NEXT MEDICATION" CARD
            const Text(
              'Next Medication Reminder',
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.bold,
                color: AppTheme.textMain,
              ),
            ),
            const SizedBox(height: 12),

            Card(
              color: isAllTaken ? AppTheme.successBg : Colors.white,
              child: Padding(
                padding: const EdgeInsets.all(22.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    // Time and Status
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                          decoration: BoxDecoration(
                            color: AppTheme.primaryLight,
                            borderRadius: BorderRadius.circular(30),
                          ),
                          child: Row(
                            children: [
                              const Icon(Icons.access_time_filled_rounded, size: 20, color: AppTheme.primary),
                              const SizedBox(width: 6),
                              Text(
                                DateFormat('hh:mm a').format(nextMed.scheduledTime),
                                style: const TextStyle(
                                  fontSize: 18,
                                  fontWeight: FontWeight.bold,
                                  color: AppTheme.primary,
                                ),
                              ),
                            ],
                          ),
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                          decoration: BoxDecoration(
                            color: nextMed.isTaken ? AppTheme.successBg : AppTheme.warningBg,
                            borderRadius: BorderRadius.circular(30),
                            border: Border.all(
                              color: nextMed.isTaken ? AppTheme.success : AppTheme.warning,
                              width: 1.5,
                            ),
                          ),
                          child: Text(
                            nextMed.isTaken ? 'COMPLETED' : 'DUE NOW',
                            style: TextStyle(
                              fontSize: 14,
                              fontWeight: FontWeight.w900,
                              color: nextMed.isTaken ? AppTheme.success : AppTheme.warning,
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 20),

                    // Pill Icon and Name
                    Row(
                      children: [
                        Container(
                          width: 72,
                          height: 72,
                          decoration: BoxDecoration(
                            color: AppTheme.primaryLight,
                            borderRadius: BorderRadius.circular(22),
                          ),
                          child: const Icon(
                            Icons.medication_rounded,
                            size: 44,
                            color: AppTheme.primary,
                          ),
                        ),
                        const SizedBox(width: 18),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                nextMed.medicationName,
                                style: const TextStyle(
                                  fontSize: 26,
                                  fontWeight: FontWeight.w900,
                                  color: AppTheme.textMain,
                                  height: 1.2,
                                ),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                '${nextMed.dose} ${nextMed.unit}',
                                style: const TextStyle(
                                  fontSize: 19,
                                  fontWeight: FontWeight.w600,
                                  color: AppTheme.primary,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),

                    // Food Instructions Badge
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: AppTheme.background,
                        borderRadius: BorderRadius.circular(14),
                      ),
                      child: Text(
                        '💡 Instructions: ${nextMed.foodRelation} • ${nextMed.instructions}',
                        style: const TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w600,
                          color: AppTheme.textMain,
                          height: 1.3,
                        ),
                      ),
                    ),
                    const SizedBox(height: 20),

                    // VOICE REMINDER BUTTON
                    OutlinedButton.icon(
                      onPressed: () => _playVoice(nextMed),
                      icon: Icon(
                        _isSpeaking ? Icons.volume_up_rounded : Icons.record_voice_over_rounded,
                        color: AppTheme.primary,
                        size: 26,
                      ),
                      label: Text(
                        _isSpeaking ? 'Speaking in ${widget.patient.languagePreference}...' : 'Hear Voice Reminder',
                        style: const TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                          color: AppTheme.primary,
                        ),
                      ),
                      style: OutlinedButton.styleFrom(
                        minimumSize: const Size(double.infinity, 56),
                        side: const BorderSide(color: AppTheme.primary, width: 2),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                      ),
                    ),
                    const SizedBox(height: 14),

                    // HUGE GREEN "TAKEN" CONFIRMATION BUTTON
                    if (!nextMed.isTaken)
                      ElevatedButton.icon(
                        onPressed: () => _confirmTaken(nextMed),
                        icon: const Icon(Icons.check_circle_rounded, size: 30, color: Colors.white),
                        label: const Text(
                          'I HAVE TAKEN THIS',
                          style: TextStyle(
                            fontSize: 22,
                            fontWeight: FontWeight.w900,
                            letterSpacing: 0.5,
                          ),
                        ),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppTheme.success,
                          minimumSize: const Size(double.infinity, 68), // Extra large senior touch target
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(20),
                          ),
                          elevation: 4,
                        ),
                      )
                    else
                      Container(
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: AppTheme.successBg,
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(color: AppTheme.success),
                        ),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: const [
                            Icon(Icons.check_circle_rounded, color: AppTheme.success, size: 26),
                            SizedBox(width: 8),
                            Text(
                              'Dose Confirmed Taken!',
                              style: TextStyle(
                                fontSize: 18,
                                fontWeight: FontWeight.bold,
                                color: AppTheme.success,
                              ),
                            ),
                          ],
                        ),
                      ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 24),

            // Today's Remaining Schedule Overview
            const Text(
              'All Scheduled Doses Today',
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.bold,
                color: AppTheme.textMain,
              ),
            ),
            const SizedBox(height: 12),

            ..._todayEvents.map((ev) => Card(
                  margin: const EdgeInsets.only(bottom: 12),
                  child: ListTile(
                    contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                    leading: CircleAvatar(
                      backgroundColor: ev.isTaken ? AppTheme.successBg : AppTheme.primaryLight,
                      child: Icon(
                        ev.isTaken ? Icons.check_rounded : Icons.medication_rounded,
                        color: ev.isTaken ? AppTheme.success : AppTheme.primary,
                      ),
                    ),
                    title: Text(
                      ev.medicationName,
                      style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                    ),
                    subtitle: Text(
                      '${DateFormat('hh:mm a').format(ev.scheduledTime)} • ${ev.dose} ${ev.unit}',
                      style: const TextStyle(fontSize: 15),
                    ),
                    trailing: ev.isTaken
                        ? const Icon(Icons.check_circle_rounded, color: AppTheme.success, size: 28)
                        : TextButton(
                            onPressed: () => _confirmTaken(ev),
                            child: const Text('Take', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                          ),
                  ),
                )),
          ],
        ),
      ),
    );
  }

  Widget _buildMedicationsListContent() {
    return RefreshIndicator(
      onRefresh: _loadSchedule,
      color: AppTheme.primary,
      child: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'My Medications',
                style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: AppTheme.textMain),
              ),
              IconButton(
                icon: const Icon(Icons.refresh, color: AppTheme.primary),
                onPressed: _loadSchedule,
              ),
            ],
          ),
          const SizedBox(height: 12),
          if (_todayEvents.isEmpty)
            const Card(
              child: Padding(
                padding: EdgeInsets.all(24.0),
                child: Text('No medications scheduled for today.', textAlign: TextAlign.center, style: TextStyle(fontSize: 16)),
              ),
            )
          else
            ..._todayEvents.map((event) {
              return Card(
                elevation: 2,
                margin: const EdgeInsets.only(bottom: 16),
                child: Padding(
                  padding: const EdgeInsets.all(18),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Expanded(
                            child: Text(
                              event.medicationName,
                              style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: AppTheme.textMain),
                            ),
                          ),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                            decoration: BoxDecoration(
                              color: event.isTaken ? Colors.green.shade50 : AppTheme.primaryLight,
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: Text(
                              event.status,
                              style: TextStyle(
                                fontWeight: FontWeight.bold,
                                color: event.isTaken ? Colors.green.shade800 : AppTheme.primary,
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 6),
                      Text(
                        '${event.dose} ${event.unit} • ${event.foodRelation.replaceAll('_', ' ')}',
                        style: const TextStyle(fontSize: 16, color: AppTheme.textMuted),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        'Scheduled: ${DateFormat('hh:mm a').format(event.scheduledTime)}',
                        style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w600, color: AppTheme.primary),
                      ),
                      const SizedBox(height: 14),
                      Row(
                        children: [
                          IconButton(
                            onPressed: () => _playVoice(event),
                            icon: const Icon(Icons.volume_up_rounded, color: AppTheme.primary, size: 28),
                            tooltip: 'Hear reminder voice',
                          ),
                          const Spacer(),
                          if (!event.isTaken)
                            ElevatedButton.icon(
                              onPressed: () => _confirmTaken(event),
                              icon: const Icon(Icons.check, color: Colors.white),
                              label: const Text('I Took This', style: TextStyle(fontWeight: FontWeight.bold, color: Colors.white)),
                              style: ElevatedButton.styleFrom(backgroundColor: AppTheme.success),
                            )
                          else
                            const Row(
                              children: [
                                Icon(Icons.check_circle_rounded, color: Colors.green, size: 20),
                                SizedBox(width: 4),
                                Text('Taken', style: TextStyle(color: Colors.green, fontWeight: FontWeight.bold, fontSize: 16)),
                              ],
                            ),
                        ],
                      ),
                    ],
                  ),
                ),
              );
            }),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.background,
      appBar: AppBar(
        title: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(6),
              decoration: BoxDecoration(
                color: AppTheme.primary,
                borderRadius: BorderRadius.circular(8),
              ),
              child: const Text('LL', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
            ),
            const SizedBox(width: 10),
            const Text('LifeLink', style: TextStyle(fontWeight: FontWeight.w900)),
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
          IconButton(
            icon: const Icon(Icons.support_agent_rounded, size: 28),
            onPressed: () async {
              final ok = await mobileApi.requestCaregiverContact(widget.patient.id);
              if (!context.mounted) return;
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  backgroundColor: AppTheme.primary,
                  content: Text(
                    ok ? 'Call request sent to caregiver!' : 'Contacting caregiver...',
                    style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                  ),
                ),
              );
            },
            tooltip: 'Call Caregiver',
          ),
          const SizedBox(width: 4),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: AppTheme.primary))
          : IndexedStack(
              index: _currentTabIndex,
              children: [
                _buildHomeContent(),
                _buildMedicationsListContent(),
                HistoryScreen(patientId: widget.patient.id),
                DocumentsScreen(patientId: widget.patient.id),
                ProfileScreen(patient: widget.patient),
              ],
            ),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _currentTabIndex,
        onDestinationSelected: (index) => setState(() => _currentTabIndex = index),
        indicatorColor: AppTheme.primaryLight,
        height: 72, // Senior friendly height
        destinations: const [
          NavigationDestination(
            icon: Icon(Icons.home_rounded, size: 28),
            selectedIcon: Icon(Icons.home_rounded, color: AppTheme.primary, size: 30),
            label: 'Home',
          ),
          NavigationDestination(
            icon: Icon(Icons.medication_rounded, size: 28),
            selectedIcon: Icon(Icons.medication_rounded, color: AppTheme.primary, size: 30),
            label: 'Medications',
          ),
          NavigationDestination(
            icon: Icon(Icons.calendar_month_rounded, size: 28),
            selectedIcon: Icon(Icons.calendar_month_rounded, color: AppTheme.primary, size: 30),
            label: 'History',
          ),
          NavigationDestination(
            icon: Icon(Icons.folder_shared_rounded, size: 28),
            selectedIcon: Icon(Icons.folder_shared_rounded, color: AppTheme.primary, size: 30),
            label: 'Documents',
          ),
          NavigationDestination(
            icon: Icon(Icons.person_rounded, size: 28),
            selectedIcon: Icon(Icons.person_rounded, color: AppTheme.primary, size: 30),
            label: 'Profile',
          ),
        ],
      ),
    );
  }
}
