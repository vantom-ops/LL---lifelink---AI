import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../constants/theme.dart';
import '../models/medical_document.dart';

class DocumentsScreen extends StatelessWidget {
  final String patientId;

  const DocumentsScreen({super.key, required this.patientId});

  @override
  Widget build(BuildContext context) {
    // Sample documents list for senior view
    final sampleDocs = [
      MedicalDocumentItem(
        id: '1',
        type: 'Blood Report',
        fileName: 'Comprehensive_Metabolic_Profile_Oct2026.pdf',
        hospitalName: 'Apollo Diagnostics Laboratory',
        doctorName: 'Dr. S. Meenakshi',
        documentDate: DateTime.now().subtract(const Duration(days: 6)),
        aiSummaryText: 'Blood sugar HbA1c level is 6.8% showing fair diabetic management. Kidney markers are within normal range.',
      ),
      MedicalDocumentItem(
        id: '2',
        type: 'ECG',
        fileName: 'Resting_12_Lead_ECG_Sep2026.pdf',
        hospitalName: 'Apollo Heart Centre',
        doctorName: 'Dr. V. Chandrasekhar',
        documentDate: DateTime.now().subtract(const Duration(days: 20)),
        aiSummaryText: 'Normal sinus heart rhythm at 72 beats per minute. Electrical conduction is steady.',
      ),
      MedicalDocumentItem(
        id: '3',
        type: 'Prescription',
        fileName: 'Apollo_Prescription_DrRamanathan_Oct2026.pdf',
        hospitalName: 'Apollo Hospitals Greams Road',
        doctorName: 'Dr. K. Ramanathan',
        documentDate: DateTime.now().subtract(const Duration(days: 7)),
        aiSummaryText: 'Ongoing prescription for Metformin, Amlodipine, and Pantoprazole.',
      ),
    ];

    return Scaffold(
      backgroundColor: AppTheme.background,
      body: ListView.builder(
        padding: const EdgeInsets.all(20.0),
        itemCount: sampleDocs.length,
        itemBuilder: (context, index) {
          final doc = sampleDocs[index];

          return Card(
            margin: const EdgeInsets.only(bottom: 16),
            child: Padding(
              padding: const EdgeInsets.all(18.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(10),
                        decoration: BoxDecoration(
                          color: AppTheme.primaryLight,
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: const Icon(Icons.description_rounded, color: AppTheme.primary, size: 28),
                      ),
                      const SizedBox(width: 14),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              doc.type,
                              style: const TextStyle(
                                fontSize: 20,
                                fontWeight: FontWeight.bold,
                                color: AppTheme.textMain,
                              ),
                            ),
                            Text(
                              DateFormat('d MMMM yyyy').format(doc.documentDate),
                              style: const TextStyle(fontSize: 14, color: AppTheme.textMuted),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  if (doc.hospitalName != null)
                    Text(
                      '🏥 ${doc.hospitalName}',
                      style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w600, color: AppTheme.textMain),
                    ),
                  if (doc.doctorName != null)
                    Text(
                      '👨‍⚕️ ${doc.doctorName}',
                      style: const TextStyle(fontSize: 15, color: AppTheme.textMuted),
                    ),
                  const SizedBox(height: 12),
                  if (doc.aiSummaryText != null)
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: AppTheme.background,
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Text(
                        '💡 Summary: ${doc.aiSummaryText}',
                        style: const TextStyle(fontSize: 15, color: AppTheme.textMain, height: 1.3),
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
