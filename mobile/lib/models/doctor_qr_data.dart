class DoctorQrData {
  final bool hasActiveToken;
  final String? token;
  final String? qrDataUrl;
  final String? qrUrl;
  final String status;
  final int version;
  final DateTime? expiresAt;
  final DateTime? lastAccessedAt;

  DoctorQrData({
    required this.hasActiveToken,
    this.token,
    this.qrDataUrl,
    this.qrUrl,
    this.status = 'ACTIVE',
    this.version = 1,
    this.expiresAt,
    this.lastAccessedAt,
  });

  factory DoctorQrData.fromJson(Map<String, dynamic> json) {
    return DoctorQrData(
      hasActiveToken: json['hasActiveToken'] ?? true,
      token: json['token'],
      qrDataUrl: json['qrDataUrl'],
      qrUrl: json['qrUrl'],
      status: json['status'] ?? 'ACTIVE',
      version: json['version'] ?? 1,
      expiresAt: json['expiresAt'] != null ? DateTime.tryParse(json['expiresAt']) : null,
      lastAccessedAt: json['lastAccessedAt'] != null ? DateTime.tryParse(json['lastAccessedAt']) : null,
    );
  }
}
