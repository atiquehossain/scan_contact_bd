final _bdPhoneRegex = RegExp(r'^(?:\+?880|0)?1[3-9]\d{8}$');

bool isValidBangladeshPhone(String value) {
  return _bdPhoneRegex.hasMatch(value.trim());
}

String normalizeBangladeshPhone(String value) {
  final digits = value.trim().replaceAll(RegExp(r'[\s-]'), '');
  if (digits.startsWith('+880')) return digits;
  if (digits.startsWith('880')) return '+$digits';
  if (digits.startsWith('0')) return '+88$digits';
  return '+880$digits';
}
