import 'package:flutter/material.dart';
import 'constants/theme.dart';
import 'screens/splash_screen.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const LLLifeLinkApp());
}

class LLLifeLinkApp extends StatelessWidget {
  const LLLifeLinkApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'LL LifeLink',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.seniorTheme,
      home: const SplashScreen(),
    );
  }
}
