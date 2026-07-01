import 'package:flutter/material.dart';

class AppColors {
  const AppColors._();

  static const ink = Color(0xFF1E293B);
  static const charcoal = Color(0xFF111C2D);
  static const slate = Color(0xFF475569);
  static const muted = Color(0xFF64748B);
  static const page = Color(0xFFF8FAFC);
  static const surface = Color(0xFFFFFFFF);
  static const surfaceSoft = Color(0xFFF1F5F9);
  static const border = Color(0xFFE2E8F0);
  static const emerald = Color(0xFF006A61);
  static const emeraldDark = Color(0xFF004D43);
  static const emeraldSoft = Color(0xFFE6F7F3);
  static const tealSoft = Color(0xFFCCFBF1);
  static const info = Color(0xFF2563EB);
  static const infoSoft = Color(0xFFEAF1FF);
  static const amber = Color(0xFFF59E0B);
  static const amberSoft = Color(0xFFFFF7E8);
  static const red = Color(0xFFBA1A1A);
  static const redSoft = Color(0xFFFFDAD6);
}

class AppSpacing {
  const AppSpacing._();

  static const xs = 4.0;
  static const sm = 8.0;
  static const md = 12.0;
  static const lg = 16.0;
  static const xl = 20.0;
  static const xxl = 24.0;
  static const section = 32.0;
}

class AppRadii {
  const AppRadii._();

  static const xs = 4.0;
  static const sm = 8.0;
  static const md = 12.0;
  static const lg = 16.0;
  static const xl = 24.0;
  static const pill = 999.0;
}

class AppShadows {
  const AppShadows._();

  static const card = [
    BoxShadow(color: Color(0x0A0F172A), blurRadius: 12, offset: Offset(0, 4)),
  ];

  static const nav = [
    BoxShadow(color: Color(0x100F172A), blurRadius: 18, offset: Offset(0, -6)),
  ];
}

class AppTheme {
  static const seedColor = AppColors.emerald;
  static const pageColor = AppColors.page;

  static ThemeData light() {
    final scheme = ColorScheme.fromSeed(seedColor: seedColor).copyWith(
      primary: AppColors.emerald,
      onPrimary: Colors.white,
      primaryContainer: AppColors.emeraldSoft,
      onPrimaryContainer: AppColors.emeraldDark,
      secondary: AppColors.info,
      secondaryContainer: AppColors.infoSoft,
      surface: AppColors.surface,
      surfaceContainerHighest: AppColors.surfaceSoft,
      outline: AppColors.border,
      outlineVariant: AppColors.border,
      error: AppColors.red,
      errorContainer: AppColors.redSoft,
      onError: Colors.white,
      onErrorContainer: AppColors.red,
      shadow: const Color(0x1A0F172A),
    );
    final base = ThemeData(useMaterial3: true, colorScheme: scheme);
    final textTheme = _withZeroLetterSpacing(
      _buildTextTheme(base.textTheme),
    ).apply(bodyColor: AppColors.ink, displayColor: AppColors.ink);
    return ThemeData(
      useMaterial3: true,
      colorScheme: scheme,
      textTheme: textTheme,
      scaffoldBackgroundColor: pageColor,
      visualDensity: VisualDensity.standard,
      dividerColor: AppColors.border,
      appBarTheme: AppBarTheme(
        centerTitle: true,
        elevation: 0,
        scrolledUnderElevation: 0,
        surfaceTintColor: Colors.transparent,
        backgroundColor: pageColor,
        foregroundColor: AppColors.ink,
        titleTextStyle: textTheme.titleLarge?.copyWith(
          color: AppColors.ink,
          fontWeight: FontWeight.w700,
        ),
        iconTheme: const IconThemeData(color: AppColors.emeraldDark),
      ),
      cardTheme: CardThemeData(
        elevation: 0,
        color: AppColors.surface,
        surfaceTintColor: Colors.transparent,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(AppRadii.lg),
          side: const BorderSide(color: AppColors.border),
        ),
        margin: EdgeInsets.zero,
      ),
      inputDecorationTheme: InputDecorationTheme(
        contentPadding: const EdgeInsets.symmetric(
          horizontal: AppSpacing.lg,
          vertical: AppSpacing.md,
        ),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(AppRadii.md),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(AppRadii.md),
          borderSide: const BorderSide(color: AppColors.border),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(AppRadii.md),
          borderSide: const BorderSide(color: AppColors.emerald, width: 1.6),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(AppRadii.md),
          borderSide: const BorderSide(color: AppColors.red),
        ),
        focusedErrorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(AppRadii.md),
          borderSide: const BorderSide(color: AppColors.red, width: 1.6),
        ),
        filled: true,
        fillColor: AppColors.surface,
        labelStyle: const TextStyle(color: AppColors.slate),
        helperStyle: const TextStyle(color: AppColors.muted),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          minimumSize: const Size(48, 52),
          backgroundColor: AppColors.emerald,
          foregroundColor: Colors.white,
          elevation: 0,
          shadowColor: Colors.transparent,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(AppRadii.md),
          ),
          textStyle: textTheme.labelLarge?.copyWith(
            fontWeight: FontWeight.w700,
          ),
        ),
      ),
      filledButtonTheme: FilledButtonThemeData(
        style: FilledButton.styleFrom(
          minimumSize: const Size(48, 52),
          backgroundColor: AppColors.emerald,
          foregroundColor: Colors.white,
          disabledBackgroundColor: AppColors.surfaceSoft,
          disabledForegroundColor: AppColors.muted,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(AppRadii.md),
          ),
          textStyle: textTheme.labelLarge?.copyWith(
            fontWeight: FontWeight.w700,
          ),
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          minimumSize: const Size(48, 52),
          foregroundColor: AppColors.emeraldDark,
          side: const BorderSide(color: AppColors.border),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(AppRadii.md),
          ),
          textStyle: textTheme.labelLarge?.copyWith(
            fontWeight: FontWeight.w700,
          ),
        ),
      ),
      textButtonTheme: TextButtonThemeData(
        style: TextButton.styleFrom(
          minimumSize: const Size(48, 48),
          foregroundColor: AppColors.emeraldDark,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(AppRadii.md),
          ),
          textStyle: textTheme.labelLarge?.copyWith(
            fontWeight: FontWeight.w700,
          ),
        ),
      ),
      chipTheme: ChipThemeData(
        backgroundColor: AppColors.surfaceSoft,
        selectedColor: AppColors.emeraldSoft,
        disabledColor: AppColors.surfaceSoft,
        side: const BorderSide(color: AppColors.border),
        shape: const StadiumBorder(),
        labelStyle: textTheme.labelLarge,
        secondaryLabelStyle: textTheme.labelLarge?.copyWith(
          color: AppColors.emeraldDark,
          fontWeight: FontWeight.w800,
        ),
      ),
      navigationBarTheme: NavigationBarThemeData(
        height: 74,
        backgroundColor: AppColors.surface,
        elevation: 0,
        shadowColor: Colors.transparent,
        surfaceTintColor: Colors.transparent,
        indicatorColor: AppColors.emeraldSoft,
        indicatorShape: const StadiumBorder(),
        labelBehavior: NavigationDestinationLabelBehavior.alwaysShow,
        labelTextStyle: WidgetStateProperty.resolveWith((states) {
          final selected = states.contains(WidgetState.selected);
          return textTheme.labelMedium?.copyWith(
            color: selected ? AppColors.emeraldDark : AppColors.slate,
            fontWeight: selected ? FontWeight.w800 : FontWeight.w600,
          );
        }),
        iconTheme: WidgetStateProperty.resolveWith((states) {
          final selected = states.contains(WidgetState.selected);
          return IconThemeData(
            color: selected ? AppColors.emeraldDark : AppColors.slate,
          );
        }),
      ),
      bottomNavigationBarTheme: const BottomNavigationBarThemeData(
        backgroundColor: AppColors.surface,
        selectedItemColor: AppColors.emeraldDark,
        unselectedItemColor: AppColors.slate,
        elevation: 0,
        type: BottomNavigationBarType.fixed,
      ),
      badgeTheme: const BadgeThemeData(
        backgroundColor: AppColors.red,
        textColor: Colors.white,
      ),
      dialogTheme: DialogThemeData(
        backgroundColor: AppColors.surface,
        surfaceTintColor: Colors.transparent,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(AppRadii.xl),
        ),
      ),
      bottomSheetTheme: const BottomSheetThemeData(
        backgroundColor: AppColors.surface,
        modalBackgroundColor: AppColors.surface,
        showDragHandle: true,
      ),
      snackBarTheme: SnackBarThemeData(
        backgroundColor: AppColors.ink,
        contentTextStyle: textTheme.bodyMedium?.copyWith(color: Colors.white),
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(AppRadii.md),
        ),
      ),
    );
  }

  static TextTheme _buildTextTheme(TextTheme base) {
    return base.copyWith(
      displaySmall: base.displaySmall?.copyWith(
        fontSize: 30,
        height: 38 / 30,
        fontWeight: FontWeight.w700,
      ),
      headlineMedium: base.headlineMedium?.copyWith(
        fontSize: 24,
        height: 32 / 24,
        fontWeight: FontWeight.w600,
      ),
      headlineSmall: base.headlineSmall?.copyWith(
        fontSize: 20,
        height: 28 / 20,
        fontWeight: FontWeight.w600,
      ),
      titleLarge: base.titleLarge?.copyWith(
        fontSize: 18,
        height: 24 / 18,
        fontWeight: FontWeight.w600,
      ),
      titleMedium: base.titleMedium?.copyWith(
        fontSize: 16,
        height: 24 / 16,
        fontWeight: FontWeight.w600,
      ),
      titleSmall: base.titleSmall?.copyWith(
        fontSize: 14,
        height: 20 / 14,
        fontWeight: FontWeight.w700,
      ),
      bodyLarge: base.bodyLarge?.copyWith(
        fontSize: 16,
        height: 24 / 16,
        fontWeight: FontWeight.w400,
      ),
      bodyMedium: base.bodyMedium?.copyWith(
        fontSize: 14,
        height: 20 / 14,
        fontWeight: FontWeight.w400,
      ),
      bodySmall: base.bodySmall?.copyWith(
        fontSize: 12,
        height: 16 / 12,
        fontWeight: FontWeight.w500,
      ),
      labelLarge: base.labelLarge?.copyWith(
        fontSize: 14,
        height: 20 / 14,
        fontWeight: FontWeight.w700,
      ),
      labelMedium: base.labelMedium?.copyWith(
        fontSize: 12,
        height: 16 / 12,
        fontWeight: FontWeight.w700,
      ),
      labelSmall: base.labelSmall?.copyWith(
        fontSize: 11,
        height: 16 / 11,
        fontWeight: FontWeight.w700,
      ),
    );
  }

  static TextTheme _withZeroLetterSpacing(TextTheme theme) {
    TextStyle? zero(TextStyle? style) => style?.copyWith(letterSpacing: 0);
    return theme.copyWith(
      displayLarge: zero(theme.displayLarge),
      displayMedium: zero(theme.displayMedium),
      displaySmall: zero(theme.displaySmall),
      headlineLarge: zero(theme.headlineLarge),
      headlineMedium: zero(theme.headlineMedium),
      headlineSmall: zero(theme.headlineSmall),
      titleLarge: zero(theme.titleLarge),
      titleMedium: zero(theme.titleMedium),
      titleSmall: zero(theme.titleSmall),
      bodyLarge: zero(theme.bodyLarge),
      bodyMedium: zero(theme.bodyMedium),
      bodySmall: zero(theme.bodySmall),
      labelLarge: zero(theme.labelLarge),
      labelMedium: zero(theme.labelMedium),
      labelSmall: zero(theme.labelSmall),
    );
  }
}
