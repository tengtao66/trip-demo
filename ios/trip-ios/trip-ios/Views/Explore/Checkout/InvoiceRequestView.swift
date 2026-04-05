import SwiftUI

struct InvoiceRequestView: View {
    let trip: Trip
    let onComplete: (BookingResult) -> Void
    @Environment(AuthStore.self) private var authStore
    @State private var selectedDestinations: Set<String> = []
    @State private var selectedActivities: Set<String> = []
    @State private var startDate = Date()
    @State private var endDate = Calendar.current.date(byAdding: .day, value: 7, to: Date()) ?? Date()
    @State private var notes = ""
    @State private var isLoading = false
    @State private var error: APIError?

    private let destinations = ["Tokyo", "Kyoto", "Osaka", "Bali", "Santorini", "Patagonia"]
    private let activities = [
        ("Temple Tour", 50.0), ("Cooking Class", 80.0), ("Hiking Excursion", 120.0),
        ("Spa Treatment", 100.0), ("Wine Tasting", 75.0), ("Snorkeling", 90.0)
    ]

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: TerraSpacing.md) {
                // Destinations
                SectionHeader(title: "Select Destinations")
                    .padding(.horizontal, TerraSpacing.screenEdge)
                TerraCard {
                    VStack(alignment: .leading, spacing: TerraSpacing.xs) {
                        ForEach(destinations, id: \.self) { dest in
                            Button {
                                if selectedDestinations.contains(dest) {
                                    selectedDestinations.remove(dest)
                                } else {
                                    selectedDestinations.insert(dest)
                                }
                            } label: {
                                HStack {
                                    Image(systemName: selectedDestinations.contains(dest) ? "checkmark.circle.fill" : "circle")
                                        .foregroundStyle(selectedDestinations.contains(dest) ? Color.terraTerracotta : Color.terraTextMuted)
                                    Text(dest).font(.terraBody).foregroundStyle(Color.terraText)
                                    Spacer()
                                }
                                .padding(.vertical, 4)
                            }
                        }
                    }
                }
                .padding(.horizontal, TerraSpacing.screenEdge)

                // Activities
                SectionHeader(title: "Activities")
                    .padding(.horizontal, TerraSpacing.screenEdge)
                TerraCard {
                    VStack(alignment: .leading, spacing: TerraSpacing.xs) {
                        ForEach(activities, id: \.0) { activity, price in
                            Button {
                                if selectedActivities.contains(activity) {
                                    selectedActivities.remove(activity)
                                } else {
                                    selectedActivities.insert(activity)
                                }
                            } label: {
                                HStack {
                                    Image(systemName: selectedActivities.contains(activity) ? "checkmark.circle.fill" : "circle")
                                        .foregroundStyle(selectedActivities.contains(activity) ? Color.terraTerracotta : Color.terraTextMuted)
                                    Text(activity).font(.terraBody).foregroundStyle(Color.terraText)
                                    Spacer()
                                    Text(price.asCurrency).font(.terraCaption).foregroundStyle(Color.terraTextMuted)
                                }
                                .padding(.vertical, 4)
                            }
                        }
                    }
                }
                .padding(.horizontal, TerraSpacing.screenEdge)

                // Dates
                SectionHeader(title: "Travel Dates")
                    .padding(.horizontal, TerraSpacing.screenEdge)
                VStack(spacing: TerraSpacing.xs) {
                    DatePicker("Start Date", selection: $startDate, displayedComponents: .date)
                    DatePicker("End Date", selection: $endDate, in: startDate..., displayedComponents: .date)
                }
                .padding(.horizontal, TerraSpacing.screenEdge)

                // Notes
                SectionHeader(title: "Notes")
                    .padding(.horizontal, TerraSpacing.screenEdge)
                TextEditor(text: $notes)
                    .frame(height: 80)
                    .padding(TerraSpacing.xs)
                    .background(Color.terraIvory)
                    .clipShape(RoundedRectangle(cornerRadius: 8))
                    .overlay(RoundedRectangle(cornerRadius: 8).stroke(Color.terraBorder))
                    .padding(.horizontal, TerraSpacing.screenEdge)

                // Error
                if let error {
                    Text(error.localizedDescription)
                        .font(.terraCaption)
                        .foregroundStyle(Color.terraDestructive)
                        .padding(.horizontal, TerraSpacing.screenEdge)
                }

                // Submit
                TerraButton(label: "Submit Request", icon: "paperplane", isLoading: isLoading) {
                    guard !isLoading else { return }
                    isLoading = true
                    Task { await submit() }
                }
                .padding(.horizontal, TerraSpacing.screenEdge)
                .disabled(selectedDestinations.isEmpty)
                .padding(.bottom, TerraSpacing.xxl)
            }
            .padding(.top, TerraSpacing.md)
        }
        .background(Color.terraAlpineOat)
        .navigationTitle("Custom Trip Request")
        .scrollDismissesKeyboard(.interactively)
        .toolbar {
            ToolbarItemGroup(placement: .keyboard) {
                Spacer()
                Button("Done") { UIApplication.shared.sendAction(#selector(UIResponder.resignFirstResponder), to: nil, from: nil, for: nil) }
            }
        }
    }

    private func submit() async {
        error = nil
        do {
            let invoiceService = InvoiceService()
            let formatter = DateFormatter()
            formatter.dateFormat = "yyyy-MM-dd"
            let email = authStore.currentUser?.email ?? ""
            let result = try await invoiceService.createTripRequest(
                email: email,
                destinations: Array(selectedDestinations),
                activities: Array(selectedActivities),
                startDate: formatter.string(from: startDate),
                endDate: formatter.string(from: endDate),
                notes: notes.isEmpty ? nil : notes
            )
            onComplete(BookingResult(
                bookingReference: result.bookingReference ?? "TERRA-REQ",
                tripName: "Custom Trip",
                paymentFlow: .invoice,
                totalAmount: 0,
                paidAmount: 0,
                depositAmount: nil,
                captureId: nil
            ))
        } catch let apiError as APIError {
            error = apiError
        } catch {
            self.error = .networkError(error.localizedDescription)
        }
        isLoading = false
    }
}
