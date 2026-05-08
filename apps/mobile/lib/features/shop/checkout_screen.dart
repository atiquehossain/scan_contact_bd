import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/models/owner_models.dart';
import '../../core/network/api_client.dart';
import '../../core/services/owner_services.dart';
import '../../core/utils/bd_phone.dart';
import '../../core/widgets/app_widgets.dart';

class CheckoutScreen extends ConsumerStatefulWidget {
  const CheckoutScreen({super.key, required this.product});

  final Product? product;

  @override
  ConsumerState<CheckoutScreen> createState() => _CheckoutScreenState();
}

class _CheckoutScreenState extends ConsumerState<CheckoutScreen> {
  final formKey = GlobalKey<FormState>();
  final nameController = TextEditingController();
  final phoneController = TextEditingController();
  final addressController = TextEditingController();
  final cityController = TextEditingController();
  final districtController = TextEditingController();
  bool submitting = false;
  OwnerOrder? createdOrder;

  @override
  void initState() {
    super.initState();
    final owner = ref.read(ownerMeProvider).valueOrNull;
    if (owner != null) {
      nameController.text = owner.name;
      phoneController.text = owner.phone;
    }
  }

  @override
  void dispose() {
    nameController.dispose();
    phoneController.dispose();
    addressController.dispose();
    cityController.dispose();
    districtController.dispose();
    super.dispose();
  }

  Future<void> submit() async {
    if (widget.product == null ||
        !(formKey.currentState?.validate() ?? false) ||
        submitting) {
      return;
    }
    setState(() => submitting = true);
    try {
      final order = await ref
          .read(ownerServiceProvider)
          .createCodOrder(
            productId: widget.product!.id,
            receiverName: nameController.text.trim(),
            receiverPhone: normalizeBangladeshPhone(phoneController.text),
            deliveryAddress: addressController.text.trim(),
            city: cityController.text.trim(),
            district: districtController.text.trim(),
          );
      ref.invalidate(dashboardProvider);
      ref.invalidate(ordersProvider);
      setState(() => createdOrder = order);
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(const SnackBar(content: Text('Order created')));
      }
    } catch (error) {
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text(apiErrorMessage(error))));
      }
    } finally {
      if (mounted) setState(() => submitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (widget.product == null) {
      return Scaffold(
        appBar: AppBar(title: const Text('Checkout')),
        body: AppErrorView(
          message: 'Select a QR tag product before checkout.',
          onRetry: () => context.go('/shop'),
        ),
      );
    }
    if (createdOrder != null) {
      return Scaffold(
        appBar: AppBar(title: const Text('Order created')),
        body: ListView(
          padding: appPadding,
          children: [
            const AppEmptyState(
              icon: Icons.check_circle_outline,
              title: 'Order created',
              body:
                  'We will process your COD order. After your QR tag is printed and assigned to your phone number, it will appear in this app.',
            ),
            const SizedBox(height: 12),
            OrderStatusCard(
              order: createdOrder!,
              onTap: () => context.go('/orders'),
            ),
            const SizedBox(height: 12),
            FilledButton.icon(
              onPressed: () => context.go('/orders'),
              icon: const Icon(Icons.local_shipping_outlined),
              label: const Text('View order status'),
            ),
            const SizedBox(height: 8),
            OutlinedButton.icon(
              onPressed: () => context.go('/main'),
              icon: const Icon(Icons.home_outlined),
              label: const Text('Go home'),
            ),
          ],
        ),
      );
    }
    return Scaffold(
      appBar: AppBar(title: const Text('Checkout')),
      body: Form(
        key: formKey,
        child: ListView(
          padding: appPadding,
          children: [
            Text(
              'Cash on Delivery',
              style: Theme.of(
                context,
              ).textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.w900),
            ),
            const SizedBox(height: 8),
            Text(
              '${widget.product!.name} - ${formatBdt(widget.product!.priceBdt)}',
            ),
            const SizedBox(height: 16),
            const PrivacyNoticeCard(
              message:
                  'Your phone number is used for delivery, order updates, and QR assignment. It is not shown on your public QR tag.',
            ),
            const SizedBox(height: 16),
            TextFormField(
              controller: nameController,
              decoration: const InputDecoration(labelText: 'Receiver name'),
              validator: (value) => value == null || value.trim().isEmpty
                  ? 'Name is required.'
                  : null,
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: phoneController,
              keyboardType: TextInputType.phone,
              decoration: const InputDecoration(labelText: 'Receiver phone'),
              validator: (value) =>
                  value == null || !isValidBangladeshPhone(value)
                  ? 'Enter a valid Bangladesh mobile number.'
                  : null,
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: addressController,
              minLines: 2,
              maxLines: 3,
              decoration: const InputDecoration(labelText: 'Delivery address'),
              validator: (value) => value == null || value.trim().isEmpty
                  ? 'Address is required.'
                  : null,
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: cityController,
              decoration: const InputDecoration(labelText: 'City'),
              validator: (value) => value == null || value.trim().isEmpty
                  ? 'City is required.'
                  : null,
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: districtController,
              decoration: const InputDecoration(labelText: 'District'),
              validator: (value) => value == null || value.trim().isEmpty
                  ? 'District is required.'
                  : null,
            ),
            const SizedBox(height: 16),
            PrimaryButton(
              label: 'Place COD order',
              icon: Icons.check_circle_outline,
              loading: submitting,
              onPressed: submit,
            ),
          ],
        ),
      ),
    );
  }
}
