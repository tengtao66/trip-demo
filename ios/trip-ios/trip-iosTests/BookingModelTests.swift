import Testing
import Foundation
@testable import trip_ios

@Suite("Booking Model")
@MainActor
struct BookingModelTests {

    // T5.1.1: Booking decodes with all nullable fields null
    @Test func bookingDecodesWithNulls() throws {
        let json = """
        {
          "id": "b1", "booking_reference": "TERRA-0001", "user_id": "u1",
          "trip_id": "t1", "status": "confirmed", "payment_flow": "authorize",
          "total_amount": 800.0, "paid_amount": 200.0,
          "paypal_order_id": null, "authorization_id": null,
          "authorization_expires_at": null, "vault_token_id": null,
          "invoice_id": null, "invoice_url": null,
          "pickup_date": null, "dropoff_date": null,
          "created_at": "2026-04-05T00:00:00Z", "updated_at": "2026-04-05T00:00:00Z",
          "trip_name": null, "trip_slug": null, "image_gradient": null,
          "customer_name": null, "customer_email": null
        }
        """.data(using: .utf8)!
        let decoder = JSONDecoder()
        decoder.keyDecodingStrategy = .convertFromSnakeCase
        let booking = try decoder.decode(Booking.self, from: json)
        #expect(booking.id == "b1")
        #expect(booking.paypalOrderId == nil)
        #expect(booking.authorizationId == nil)
        #expect(booking.vaultTokenId == nil)
        #expect(booking.invoiceId == nil)
        #expect(booking.tripName == nil)
    }

    // T5.1.2: Booking decodes with all fields populated
    @Test func bookingDecodesFullyPopulated() throws {
        let json = """
        {
          "id": "b1", "booking_reference": "TERRA-T5K6", "user_id": "u1",
          "trip_id": "t1", "status": "DEPOSIT_CAPTURED", "payment_flow": "authorize",
          "total_amount": 800.0, "paid_amount": 200.0,
          "paypal_order_id": "9AB82316KF089842T",
          "authorization_id": "AUTH-8A4F2B",
          "authorization_expires_at": "2026-05-04T00:00:00Z",
          "vault_token_id": null, "invoice_id": null, "invoice_url": null,
          "pickup_date": null, "dropoff_date": null,
          "created_at": "2026-04-05T09:41:00Z", "updated_at": "2026-04-05T09:42:00Z",
          "trip_name": "Tokyo Cherry Blossom", "trip_slug": "tokyo-cherry-blossom",
          "image_gradient": "linear-gradient(135deg, #FFB7C5 0%, #C71585 100%)",
          "customer_name": "John Doe", "customer_email": "john.doe@email.com"
        }
        """.data(using: .utf8)!
        let decoder = JSONDecoder()
        decoder.keyDecodingStrategy = .convertFromSnakeCase
        let booking = try decoder.decode(Booking.self, from: json)
        #expect(booking.bookingReference == "TERRA-T5K6")
        #expect(booking.paypalOrderId == "9AB82316KF089842T")
        #expect(booking.tripName == "Tokyo Cherry Blossom")
        #expect(booking.customerName == "John Doe")
    }

    // T5.1.3: BookingCharge decodes all charge types
    @Test func bookingChargeDecodes() throws {
        let types = ["deposit", "balance", "addon", "setup_fee", "final", "full_payment"]
        for chargeType in types {
            let json = """
            {
              "id": "c1", "booking_id": "b1", "type": "\(chargeType)",
              "description": "Test charge", "amount": 100.0,
              "paypal_capture_id": null, "status": "completed",
              "created_at": "2026-04-05T00:00:00Z"
            }
            """.data(using: .utf8)!
            let decoder = JSONDecoder()
            decoder.keyDecodingStrategy = .convertFromSnakeCase
            let charge = try decoder.decode(BookingCharge.self, from: json)
            #expect(charge.type == chargeType, "Failed for type: \(chargeType)")
        }
    }

    // T5.1.4: BookingDetail includes nested charges array
    @Test func bookingDetailDecodesWithCharges() throws {
        let json = """
        {
          "id": "b1", "booking_reference": "TERRA-T5K6", "user_id": "u1",
          "trip_id": "t1", "status": "DEPOSIT_CAPTURED", "payment_flow": "authorize",
          "total_amount": 800.0, "paid_amount": 200.0,
          "paypal_order_id": "ORD123", "authorization_id": "AUTH123",
          "authorization_expires_at": "2026-05-04T00:00:00Z",
          "vault_token_id": null, "invoice_id": null, "invoice_url": null,
          "pickup_date": null, "dropoff_date": null,
          "created_at": "2026-04-05T00:00:00Z", "updated_at": "2026-04-05T00:00:00Z",
          "trip_name": "Tokyo", "trip_slug": "tokyo", "image_gradient": "g",
          "customer_name": "John", "customer_email": "j@t.com",
          "charges": [
            {"id": "c1", "booking_id": "b1", "type": "deposit", "description": "Deposit", "amount": 200.0, "paypal_capture_id": "CAP1", "status": "completed", "created_at": "2026-04-05T00:00:00Z"},
            {"id": "c2", "booking_id": "b1", "type": "balance", "description": "Balance", "amount": 600.0, "paypal_capture_id": null, "status": "pending", "created_at": "2026-04-05T00:00:00Z"}
          ],
          "base_price": 800.0, "trip_deposit_amount": 200.0,
          "duration_days": 5, "trip_description": "Tour",
          "trip_payment_flow": "authorize"
        }
        """.data(using: .utf8)!
        let decoder = JSONDecoder()
        decoder.keyDecodingStrategy = .convertFromSnakeCase
        let detail = try decoder.decode(BookingDetail.self, from: json)
        #expect(detail.charges.count == 2)
        #expect(detail.charges[0].type == "deposit")
        #expect(detail.charges[1].status == "pending")
        #expect(detail.basePrice == 800.0)
    }

    // T6.1.1: MerchantStats decodes all fields
    @Test func merchantStatsDecodes() throws {
        let json = """
        {"activeBookings": 12, "pendingCaptures": 3, "openInvoices": 2, "monthlyRevenue": 15420.50}
        """.data(using: .utf8)!
        let stats = try JSONDecoder().decode(MerchantStats.self, from: json)
        #expect(stats.activeBookings == 12)
        #expect(stats.pendingCaptures == 3)
        #expect(stats.openInvoices == 2)
        #expect(stats.monthlyRevenue == 15420.50)
    }

    // T6.1.2: Monthly revenue formats as currency
    @Test func merchantRevenueFormatsAsCurrency() {
        #expect(15420.50.asCurrency == "$15,420.50")
    }
}
