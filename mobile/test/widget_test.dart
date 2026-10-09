import 'package:flutter_test/flutter_test.dart';
import 'package:ll_lifelink/main.dart';
import 'package:shared_preferences/shared_preferences.dart';

void main() {
  setUp(() {
    SharedPreferences.setMockInitialValues({});
  });

  testWidgets('LL LifeLink App launches with splash screen', (WidgetTester tester) async {
    // Build our app and trigger a frame.
    await tester.pumpWidget(const LLLifeLinkApp());

    // Verify LL LifeLink branding appears immediately on splash screen
    expect(find.text('LL LifeLink'), findsOneWidget);
    expect(find.text('Connected care. Clear medication.'), findsOneWidget);

    // Pump past the 1500ms delay timer and transition
    await tester.pump(const Duration(milliseconds: 1600));
    await tester.pump(const Duration(milliseconds: 500));
  });
}
