import 'package:flutter/material.dart';

class AppTheme {
  // Brand Colors
  static const Color primary = Color(0xFFFF7A00);
  static const Color primaryDark = Color(0xFFE06900);
  static const Color primaryLight = Color(0xFFFFF0DE);
  static const Color secondary = Color(0xFFFFB45E);
  static const Color background = Color(0xFFFFF7ED);
  static const Color surface = Color(0xFFFFFFFF);
  
  static const Color textMain = Color(0xFF1F2937);
  static const Color textMuted = Color(0xFF4B5563);
  static const Color border = Color(0xFFF3E8DC);

  // Status Colors (High Contrast)
  static const Color success = Color(0xFF16A34A);
  static const Color successBg = Color(0xFFDCFCE7);
  static const Color warning = Color(0xFFD97706);
  static const Color warningBg = Color(0xFFFEF3C7);
  static const Color danger = Color(0xFFDC2626);
  static const Color dangerBg = Color(0xFFFEE2E2);

  static ThemeData get seniorTheme {
    return ThemeData(
      useMaterial3: true,
      scaffoldBackgroundColor: background,
      colorScheme: ColorScheme.fromSeed(
        seedColor: primary,
        primary: primary,
        secondary: secondary,
        surface: surface,
      ),
      fontFamily: 'Roboto',
      appBarTheme: const AppBarTheme(
        backgroundColor: surface,
        foregroundColor: textMain,
        elevation: 0,
        centerTitle: true,
        titleTextStyle: TextStyle(
          fontSize: 22,
          fontWeight: FontWeight.bold,
          color: textMain,
        ),
      ),
      cardTheme: CardThemeData(
        color: surface,
        elevation: 3,
        shadowColor: const Color(0x1AFF7A00),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(20),
          side: const BorderSide(color: border, width: 1.5),
        ),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: primary,
          foregroundColor: Colors.white,
          minimumSize: const Size(double.infinity, 60), // >= 48dp senior touch target
          textStyle: const TextStyle(
            fontSize: 20,
            fontWeight: FontWeight.bold,
          ),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
          ),
          elevation: 2,
        ),
      ),
    );
  }
}
