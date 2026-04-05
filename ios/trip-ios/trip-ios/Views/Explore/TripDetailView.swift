import SwiftUI
import PayPalMessages

struct TripDetailView: View {
    let trip: Trip
    @State private var pickupDate = Date()
    @State private var dropoffDate = Calendar.current.date(byAdding: .day, value: 3, to: Date())!
    @State private var selectedCabinIndex = 0

    private let cabinTiers = [
        ("Interior", 1.0),
        ("Ocean View", 1.14),
        ("Balcony", 1.36),
    ]

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 0) {
                heroImage
                contentSection
            }
        }
        .background(Color.terraAlpineOat)
        .navigationTitle(trip.name)
        .navigationBarTitleDisplayMode(.inline)
    }

    // MARK: - Hero Image

    private var heroImage: some View {
        ZStack(alignment: .bottomLeading) {
            ZStack {
                gradientForCategory
                if trip.hasImage {
                    Image(trip.imageName)
                        .resizable()
                        .aspectRatio(contentMode: .fill)
                }
            }
            .frame(height: 220)
            .clipped()
            LinearGradient(colors: [.clear, .black.opacity(0.6)], startPoint: .center, endPoint: .bottom)
            VStack(alignment: .leading, spacing: 4) {
                Text(trip.name)
                    .font(.terraLargeTitle)
                    .foregroundStyle(.white)
                Text(subtitleText)
                    .font(.terraCaption)
                    .foregroundStyle(.white.opacity(0.85))
            }
            .padding(TerraSpacing.screenEdge)
        }
    }

    // MARK: - Content by Category

    private var contentSection: some View {
        VStack(alignment: .leading, spacing: TerraSpacing.md) {
            // Info chips
            infoChips
                .padding(.horizontal, TerraSpacing.screenEdge)
                .padding(.top, TerraSpacing.md)

            // Category-specific content
            switch trip.category {
            case .tour:
                tourContent
            case .carRental:
                carRentalContent
            case .cruise:
                cruiseContent
            }
        }
    }

    // MARK: - Info Chips

    private var infoChips: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: TerraSpacing.xs) {
                chipView(icon: "clock", text: trip.durationLabel)
                chipView(icon: "dollarsign.circle", text: trip.basePrice.asCurrency)
                if trip.depositAmount > 0 {
                    chipView(icon: "shield", text: "\(trip.depositAmount.asCurrency) Deposit")
                }
                chipView(icon: "creditcard", text: trip.flowBadgeLabel)
            }
        }
    }

    private func chipView(icon: String, text: String) -> some View {
        HStack(spacing: 4) {
            Image(systemName: icon)
                .font(.system(size: 11))
            Text(text)
                .font(.system(size: 12, weight: .medium))
        }
        .foregroundStyle(Color.terraText)
        .padding(.horizontal, 10)
        .padding(.vertical, 6)
        .background(Color.terraAlpineOat)
        .clipShape(RoundedRectangle(cornerRadius: 8))
        .overlay(RoundedRectangle(cornerRadius: 8).stroke(Color.terraBorder, lineWidth: 1))
    }

    // MARK: - Tour Content

    private var tourContent: some View {
        VStack(alignment: .leading, spacing: TerraSpacing.md) {
            // Itinerary
            SectionHeader(title: "Day-by-Day Itinerary")
                .padding(.horizontal, TerraSpacing.screenEdge)
            TerraCard {
                VStack(alignment: .leading, spacing: 0) {
                    ForEach(trip.itinerary) { day in
                        HStack(alignment: .top, spacing: 10) {
                            Text("Day \(day.day)")
                                .font(.system(size: 10, weight: .bold))
                                .foregroundStyle(Color.terraTerracotta)
                                .padding(.horizontal, 6)
                                .padding(.vertical, 4)
                                .background(Color(hex: "#FFF5EE"))
                                .clipShape(RoundedRectangle(cornerRadius: 6))
                            VStack(alignment: .leading, spacing: 2) {
                                Text(day.title)
                                    .font(.system(size: 12, weight: .semibold))
                                Text(day.details)
                                    .font(.terraCaption)
                                    .foregroundStyle(Color.terraTextMuted)
                            }
                        }
                        .padding(.vertical, 6)
                        if day.day != trip.itinerary.last?.day {
                            Divider()
                        }
                    }
                }
            }
            .padding(.horizontal, TerraSpacing.screenEdge)

            // Itemized fee breakdown
            SectionHeader(title: "Package Includes")
                .padding(.horizontal, TerraSpacing.screenEdge)
            TerraCard {
                VStack(spacing: 6) {
                    ForEach(trip.feeBreakdown, id: \.item) { item, amount in
                        feeRow(label: item, value: amount.asCurrency, bold: false)
                    }
                    Divider().padding(.vertical, 4)
                    feeRow(label: "Total", value: trip.basePrice.asCurrency, bold: true)
                }
            }
            .padding(.horizontal, TerraSpacing.screenEdge)

            // Payment schedule
            if trip.depositAmount > 0 {
                SectionHeader(title: "Payment Schedule")
                    .padding(.horizontal, TerraSpacing.screenEdge)
                TerraCard {
                    VStack(spacing: 6) {
                        feeRow(label: "Deposit (due now)", value: trip.depositAmount.asCurrency, bold: true)
                        feeRow(label: "Balance (after trip)", value: (trip.basePrice - trip.depositAmount).asCurrency, bold: false)
                    }
                }
                .padding(.horizontal, TerraSpacing.screenEdge)
            }

            // CTA
            NavigationLink(value: NavigationDestination.checkout(slug: trip.slug)) {
                Label("Reserve with Deposit", systemImage: "lock")
                    .font(.terraHeadline)
                    .foregroundStyle(.white)
                    .frame(maxWidth: .infinity, minHeight: 44)
                    .background(Color.terraTerracotta)
                    .clipShape(RoundedRectangle(cornerRadius: 12))
            }
            .padding(.horizontal, TerraSpacing.screenEdge)
            .padding(.bottom, TerraSpacing.xxl)
        }
    }

    // MARK: - Car Rental Content

    private var carRentalContent: some View {
        VStack(alignment: .leading, spacing: TerraSpacing.md) {
            // Date pickers
            SectionHeader(title: "Trip Dates")
                .padding(.horizontal, TerraSpacing.screenEdge)
            VStack(spacing: TerraSpacing.xs) {
                DatePicker("Pickup Date", selection: $pickupDate, displayedComponents: .date)
                    .datePickerStyle(.compact)
                DatePicker("Dropoff Date", selection: $dropoffDate, in: pickupDate..., displayedComponents: .date)
                    .datePickerStyle(.compact)
            }
            .padding(.horizontal, TerraSpacing.screenEdge)

            // Duration + total
            if let rate = trip.dailyRate {
                let days = max(Calendar.current.dateComponents([.day], from: pickupDate, to: dropoffDate).day ?? 1, 1)
                let subtotal = rate * Double(days)
                let tax = subtotal * 0.08
                let total = subtotal + tax

                Text("\(days) days x \(rate.asCurrency)/day")
                    .font(.terraCaption)
                    .foregroundStyle(Color.terraTextMuted)
                    .frame(maxWidth: .infinity)

                TerraCard {
                    VStack(spacing: 6) {
                        feeRow(label: "Subtotal", value: subtotal.asCurrency, bold: false)
                        feeRow(label: "Tax", value: tax.asCurrency, bold: false)
                        Divider().padding(.vertical, 4)
                        feeRow(label: "Total", value: total.asCurrency, bold: true)
                    }
                }
                .padding(.horizontal, TerraSpacing.screenEdge)

                // PayPal Pay Later message
                PayPalMessageBanner(amount: total, pageType: .productDetails)
                    .frame(height: 44)
                    .padding(.horizontal, TerraSpacing.screenEdge)
            }

            NavigationLink(value: NavigationDestination.checkout(slug: trip.slug, pickupDate: pickupDate, dropoffDate: dropoffDate)) {
                Label("Continue to Checkout", systemImage: "cart")
                    .font(.terraHeadline)
                    .foregroundStyle(.white)
                    .frame(maxWidth: .infinity, minHeight: 44)
                    .background(Color.terraTerracotta)
                    .clipShape(RoundedRectangle(cornerRadius: 12))
            }
            .padding(.horizontal, TerraSpacing.screenEdge)
            .padding(.bottom, TerraSpacing.xxl)
        }
    }

    // MARK: - Cruise Content

    private var cruiseContent: some View {
        VStack(alignment: .leading, spacing: TerraSpacing.md) {
            // Cabin selector
            SectionHeader(title: "Select Cabin")
                .padding(.horizontal, TerraSpacing.screenEdge)
            HStack(spacing: TerraSpacing.xs) {
                ForEach(Array(cabinTiers.enumerated()), id: \.offset) { index, tier in
                    Button {
                        selectedCabinIndex = index
                    } label: {
                        VStack(spacing: 2) {
                            Text(tier.0)
                                .font(.system(size: 12, weight: selectedCabinIndex == index ? .semibold : .regular))
                            Text((trip.basePrice * tier.1).asCurrency)
                                .font(.system(size: 10))
                        }
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 10)
                        .foregroundStyle(selectedCabinIndex == index ? .white : Color.terraText)
                        .background(selectedCabinIndex == index ? Color.terraTerracotta : Color.terraIvory)
                        .clipShape(RoundedRectangle(cornerRadius: 10))
                        .overlay(RoundedRectangle(cornerRadius: 10).stroke(Color.terraBorder, lineWidth: selectedCabinIndex == index ? 0 : 1))
                    }
                }
            }
            .padding(.horizontal, TerraSpacing.screenEdge)

            // Itinerary (ports)
            if !trip.itinerary.isEmpty {
                SectionHeader(title: "Itinerary")
                    .padding(.horizontal, TerraSpacing.screenEdge)
                VStack(alignment: .leading, spacing: 0) {
                    ForEach(trip.itinerary) { day in
                        HStack(spacing: 10) {
                            Circle()
                                .fill(Color.terraTerracotta)
                                .frame(width: 8, height: 8)
                            Text("Day \(day.day)")
                                .font(.system(size: 10, weight: .semibold))
                                .foregroundStyle(Color.terraTerracotta)
                                .frame(width: 44, alignment: .leading)
                            Text(day.title)
                                .font(.terraCaption)
                        }
                        .padding(.vertical, 6)
                    }
                }
                .padding(.horizontal, TerraSpacing.screenEdge)
            }

            // Price breakdown
            let cabinMultiplier = cabinTiers[selectedCabinIndex].1
            let cabinPrice = trip.basePrice * cabinMultiplier
            let portFees = 150.0
            let tax = cabinPrice * 0.075
            let total = cabinPrice + portFees + tax

            TerraCard {
                VStack(spacing: 6) {
                    feeRow(label: "\(cabinTiers[selectedCabinIndex].0) Cabin", value: cabinPrice.asCurrency, bold: false)
                    feeRow(label: "Port Fees", value: portFees.asCurrency, bold: false)
                    feeRow(label: "Tax", value: tax.asCurrency, bold: false)
                    Divider().padding(.vertical, 4)
                    feeRow(label: "Total", value: total.asCurrency, bold: true)
                }
            }
            .padding(.horizontal, TerraSpacing.screenEdge)

            NavigationLink(value: NavigationDestination.checkout(slug: trip.slug)) {
                Label("Book Now", systemImage: "wave.3.right")
                    .font(.terraHeadline)
                    .foregroundStyle(.white)
                    .frame(maxWidth: .infinity, minHeight: 44)
                    .background(Color.terraTerracotta)
                    .clipShape(RoundedRectangle(cornerRadius: 12))
            }
            .padding(.horizontal, TerraSpacing.screenEdge)
            .padding(.bottom, TerraSpacing.xxl)
        }
    }

    // MARK: - Helpers

    private func feeRow(label: String, value: String, bold: Bool) -> some View {
        HStack {
            Text(label)
                .font(bold ? .terraHeadline : .terraBody)
                .foregroundStyle(bold ? Color.terraText : Color.terraTextMuted)
            Spacer()
            Text(value)
                .font(bold ? .terraHeadline : .terraBody)
                .foregroundStyle(bold ? Color.terraMocha : Color.terraText)
        }
    }

    private var gradientForCategory: some View {
        LinearGradient(colors: trip.gradientColors, startPoint: .topLeading, endPoint: .bottomTrailing)
    }

    private var subtitleText: String {
        switch trip.category {
        case .tour: "\(trip.durationDays) Days / Guided Tour"
        case .carRental: "Daily Rental"
        case .cruise: "\(trip.durationDays) Days Cruise"
        }
    }

    // durationLabel and flowBadgeLabel are on Trip+Helpers.swift
}
