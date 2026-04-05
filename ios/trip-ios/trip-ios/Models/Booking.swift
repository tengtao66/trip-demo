import Foundation

struct Booking: Codable, Identifiable, Sendable {
    let id: String
    let bookingReference: String
    let userId: String
    let tripId: String
    let status: String
    let paymentFlow: String
    let totalAmount: Double
    let paidAmount: Double
    let paypalOrderId: String?
    let authorizationId: String?
    let authorizationExpiresAt: String?
    let vaultTokenId: String?
    let invoiceId: String?
    let invoiceUrl: String?
    let pickupDate: String?
    let dropoffDate: String?
    let createdAt: String
    let updatedAt: String

    // Joined fields from server
    let tripName: String?
    let tripSlug: String?
    let imageGradient: String?
    let customerName: String?
    let customerEmail: String?
}

struct BookingCharge: Codable, Identifiable, Sendable {
    let id: String
    let bookingId: String
    let type: String
    let description: String
    let amount: Double
    let paypalCaptureId: String?
    let status: String
    let createdAt: String
}

struct BookingDetail: Codable, Sendable {
    let id: String
    let bookingReference: String
    let userId: String
    let tripId: String
    let status: String
    let paymentFlow: String
    let totalAmount: Double
    let paidAmount: Double
    let paypalOrderId: String?
    let authorizationId: String?
    let authorizationExpiresAt: String?
    let vaultTokenId: String?
    let invoiceId: String?
    let invoiceUrl: String?
    let pickupDate: String?
    let dropoffDate: String?
    let createdAt: String
    let updatedAt: String
    let tripName: String?
    let tripSlug: String?
    let imageGradient: String?
    let customerName: String?
    let customerEmail: String?
    let charges: [BookingCharge]
    let basePrice: Double?
    let tripDepositAmount: Double?
    let durationDays: Int?
    let tripDescription: String?
    let tripPaymentFlow: String?
}

struct MerchantStats: Codable, Sendable {
    let activeBookings: Int
    let pendingCaptures: Int
    let openInvoices: Int
    let monthlyRevenue: Double
}
