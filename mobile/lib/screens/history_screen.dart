import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../constants/theme.dart';
import '../models/medication_event.dart';
import '../services/storage_service.dart';

class HistoryScreen extends StatefulWidget {
  final String patientId;

  const HistoryScreen({super.key, required this.patientId});

  @override
  State<HistoryScreen> createState() => _HistoryScreenState();
}

class _HistoryScreenState extends State<HistoryScreen> {
  List<MedicationEvent> _history = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadHistory();
  }

  Future<void> _loadHistory() async {
    // Load cached events
    final events = await MobileStorageService.getCachedTodayEvents();
    setState(() {
      _history = events;
      _isLoading = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.background,
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: AppTheme.primary))
          : _history.isEmpty
              ? const Center(
                  child: Text(
                    'No dose history yet.',
                    style: TextStyle(fontSize: 18, color: AppTheme.textMuted),
                  ),
                )
              : ListView.builder(
                  padding: const EdgeInsets.all(20.0),
                  itemCount: _history.length,
                  itemBuilder: (context, index) {
                    final item = _history[index];
                    final isTaken = item.isTaken;

                    Color statusColor = AppTheme.warning;
                    String statusText = 'Pending';

                    if (item.status == 'TAKEN') {
                      statusColor = AppTheme.success;
                      statusText = 'Taken on Time';
                    } else if (item.status == 'LATE') {
                      statusColor = AppTheme.warning;
                      statusText = 'Taken Late';
                    } else if (item.status == 'MISSED' || item.status == 'NOT_TAKEN') {
                      statusColor = AppTheme.danger;
                      statusText = 'Missed';
                    }

                    return Card(
                      margin: const EdgeInsets.only(bottom: 14),
                      child: Padding(
                        padding: const EdgeInsets.all(18.0),
                        child: Row(
                          children: [
                            Container(
                              width: 50,
                              height: 50,
                              decoration: BoxDecoration(
                                color: statusColor.withValues(alpha: 0.15),
                                shape: BoxShape.circle,
                              ),
                              child: Icon(
                                isTaken ? Icons.check_circle_rounded : Icons.pending_actions_rounded,
                                color: statusColor,
                                size: 30,
                              ),
                            ),
                            const SizedBox(width: 16),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    item.medicationName,
                                    style: const TextStyle(
                                      fontSize: 20,
                                      fontWeight: FontWeight.bold,
                                      color: AppTheme.textMain,
                                    ),
                                  ),
                                  const SizedBox(height: 4),
                                  Text(
                                    '${item.dose} ${item.unit} • ${DateFormat('hh:mm a').format(item.scheduledTime)}',
                                    style: const TextStyle(
                                      fontSize: 16,
                                      color: AppTheme.textMuted,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                              decoration: BoxDecoration(
                                color: statusColor.withValues(alpha: 0.15),
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: Text(
                                statusText,
                                style: TextStyle(
                                  fontSize: 14,
                                  fontWeight: FontWeight.bold,
                                  color: statusColor,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    );
                  },
                ),
    );
  }
}
