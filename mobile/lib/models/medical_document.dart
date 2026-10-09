class MedicalDocumentItem {
  final String id;
  final String type;
  final String fileName;
  final String? hospitalName;
  final String? doctorName;
  final DateTime documentDate;
  final String? aiSummaryText;

  MedicalDocumentItem({
    required this.id,
    required this.type,
    required this.fileName,
    this.hospitalName,
    this.doctorName,
    required this.documentDate,
    this.aiSummaryText,
  });

  factory MedicalDocumentItem.fromJson(Map<String, dynamic> json) {
    final ai = json['aiSummary'] is Map<String, dynamic> ? json['aiSummary'] : {};
    return MedicalDocumentItem(
      id: json['_id'] ?? '',
      type: json['type'] ?? 'Report',
      fileName: json['fileName'] ?? 'Document.pdf',
      hospitalName: json['hospitalName'],
      doctorName: json['doctorName'],
      documentDate: DateTime.tryParse(json['documentDate'] ?? '') ?? DateTime.now(),
      aiSummaryText: ai['summary'],
    );
  }
}
