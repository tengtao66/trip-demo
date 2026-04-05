import Testing
import Foundation
@testable import trip_ios

// MARK: - T3.1 Trip Model Tests

@Suite("Trip Model")
@MainActor
struct TripModelTests {

    // T3.1.1: Trip decodes from real API JSON (snake_case)
    @Test func tripDecodesFromSnakeCaseJSON() throws {
        let json = """
        {
          "id": "t1", "slug": "tokyo-cherry-blossom", "name": "Tokyo Cherry Blossom",
          "description": "Test", "duration_days": 5, "base_price": 800.0,
          "deposit_amount": 200.0, "payment_flow": "authorize", "daily_rate": null,
          "category": "tour", "image_gradient": "gradient",
          "itinerary": [{"day": 1, "title": "Arrive", "details": "Airport"}]
        }
        """.data(using: .utf8)!
        let decoder = JSONDecoder()
        decoder.keyDecodingStrategy = .convertFromSnakeCase
        let trip = try decoder.decode(Trip.self, from: json)
        #expect(trip.slug == "tokyo-cherry-blossom")
        #expect(trip.basePrice == 800.0)
        #expect(trip.durationDays == 5)
    }

    // T3.1.2: Trip with 5-day itinerary decodes correctly
    @Test func tripItineraryDecodes() throws {
        let json = """
        {
          "id": "t1", "slug": "test", "name": "Test", "description": "D",
          "duration_days": 5, "base_price": 800.0, "deposit_amount": 200.0,
          "payment_flow": "authorize", "daily_rate": null, "category": "tour",
          "image_gradient": "g",
          "itinerary": [
            {"day": 1, "title": "Day 1", "details": "d1"},
            {"day": 2, "title": "Day 2", "details": "d2"},
            {"day": 3, "title": "Day 3", "details": "d3"},
            {"day": 4, "title": "Day 4", "details": "d4"},
            {"day": 5, "title": "Day 5", "details": "d5"}
          ]
        }
        """.data(using: .utf8)!
        let decoder = JSONDecoder()
        decoder.keyDecodingStrategy = .convertFromSnakeCase
        let trip = try decoder.decode(Trip.self, from: json)
        #expect(trip.itinerary.count == 5)
    }

    // T3.1.3: Trip with null daily_rate decodes as nil
    @Test func tripNullDailyRateDecodesAsNil() throws {
        let json = """
        {
          "id": "t1", "slug": "s", "name": "N", "description": "D",
          "duration_days": 1, "base_price": 50.0, "deposit_amount": 0.0,
          "payment_flow": "instant", "daily_rate": null, "category": "tour",
          "image_gradient": "g", "itinerary": []
        }
        """.data(using: .utf8)!
        let decoder = JSONDecoder()
        decoder.keyDecodingStrategy = .convertFromSnakeCase
        let trip = try decoder.decode(Trip.self, from: json)
        #expect(trip.dailyRate == nil)
    }

    // T3.1.4: Trip with daily_rate decodes correctly
    @Test func tripWithDailyRateDecodes() throws {
        let json = """
        {
          "id": "t2", "slug": "sedan", "name": "Sedan", "description": "D",
          "duration_days": 1, "base_price": 50.0, "deposit_amount": 0.0,
          "payment_flow": "instant", "daily_rate": 50.0, "category": "car_rental",
          "image_gradient": "g", "itinerary": []
        }
        """.data(using: .utf8)!
        let decoder = JSONDecoder()
        decoder.keyDecodingStrategy = .convertFromSnakeCase
        let trip = try decoder.decode(Trip.self, from: json)
        #expect(trip.dailyRate == 50.0)
    }

    // T3.1.5: TripCategory enum decodes all values
    @Test func tripCategoryDecodes() throws {
        let cases: [(String, TripCategory)] = [
            ("\"tour\"", .tour),
            ("\"car_rental\"", .carRental),
            ("\"cruise\"", .cruise)
        ]
        let decoder = JSONDecoder()
        decoder.keyDecodingStrategy = .convertFromSnakeCase
        for (json, expected) in cases {
            let data = json.data(using: .utf8)!
            let decoded = try decoder.decode(TripCategory.self, from: data)
            #expect(decoded == expected, "Failed for \(json)")
        }
    }

    // T3.1.6: PaymentFlow enum decodes all values
    @Test func paymentFlowDecodes() throws {
        let cases: [(String, PaymentFlow)] = [
            ("\"authorize\"", .authorize),
            ("\"vault\"", .vault),
            ("\"invoice\"", .invoice),
            ("\"instant\"", .instant)
        ]
        for (json, expected) in cases {
            let data = json.data(using: .utf8)!
            let decoded = try JSONDecoder().decode(PaymentFlow.self, from: data)
            #expect(decoded == expected, "Failed for \(json)")
        }
    }

    // T3.1.7: Unknown payment_flow throws decodingError
    @Test func unknownPaymentFlowThrows() {
        let json = "\"unknown_flow\"".data(using: .utf8)!
        #expect(throws: DecodingError.self) {
            try JSONDecoder().decode(PaymentFlow.self, from: json)
        }
    }

    // T3.1.8: ItineraryDay decodes correctly
    @Test func itineraryDayDecodes() throws {
        let json = """
        {"day": 1, "title": "Arrive Tokyo", "details": "Shinjuku Gyoen"}
        """.data(using: .utf8)!
        let day = try JSONDecoder().decode(ItineraryDay.self, from: json)
        #expect(day.day == 1)
        #expect(day.title == "Arrive Tokyo")
        #expect(day.details == "Shinjuku Gyoen")
    }
}

