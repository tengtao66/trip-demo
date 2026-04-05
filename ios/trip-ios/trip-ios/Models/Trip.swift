import Foundation

enum TripCategory: String, Codable, Sendable, CaseIterable {
    case tour
    case carRental = "car_rental"
    case cruise
}

enum PaymentFlow: String, Codable, Sendable, CaseIterable {
    case authorize
    case vault
    case invoice
    case instant
}

struct Trip: Codable, Identifiable, Sendable {
    let id: String
    let slug: String
    let name: String
    let description: String
    let durationDays: Int
    let basePrice: Double
    let depositAmount: Double
    let paymentFlow: PaymentFlow
    let dailyRate: Double?
    let category: TripCategory
    let imageGradient: String
    let itinerary: [ItineraryDay]
}

struct ItineraryDay: Codable, Identifiable, Sendable {
    let day: Int
    let title: String
    let details: String

    var id: Int { day }
}
