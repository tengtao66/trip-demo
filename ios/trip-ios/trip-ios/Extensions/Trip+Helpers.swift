import SwiftUI
import UIKit

extension Trip {
    /// Asset catalog image name for this trip, e.g. "trip-tokyo-cherry-blossom"
    var imageName: String {
        "trip-\(slug)"
    }

    /// Whether a bundled image exists in the asset catalog
    var hasImage: Bool {
        UIImage(named: imageName) != nil
    }

    /// Parse gradient colors from the server's imageGradient string
    /// Format: "linear-gradient(135deg, #FFB7C5 0%, #C71585 100%)"
    var gradientColors: [Color] {
        let pattern = /#[0-9A-Fa-f]{6}/
        let matches = imageGradient.matches(of: pattern)
        let colors = matches.map { Color(hex: String(imageGradient[$0.range])) }
        return colors.count >= 2 ? colors : category.defaultGradientColors
    }

    var durationLabel: String {
        durationDays == 1 ? "1 Day" : "\(durationDays) Days"
    }

    var flowBadgeLabel: String {
        switch paymentFlow {
        case .authorize: "Reserve Now"
        case .vault: "Add-ons"
        case .invoice: "Invoice"
        case .instant: "Pay Later"
        }
    }

    /// Mockup itemized fee breakdown that sums to basePrice
    var feeBreakdown: [(item: String, amount: Double)] {
        switch slug {
        case "tokyo-cherry-blossom":
            return [
                ("Accommodation (2 nights)", 300),
                ("Shinkansen Tickets", 150),
                ("Guided Tours & Entry Fees", 120),
                ("Meals (3 days)", 130),
                ("Airport Transfers", 100),
            ]
        case "bali-adventure":
            return [
                ("Villa Accommodation (6 nights)", 900),
                ("Surf & Dive Lessons", 400),
                ("Temple & Rice Terrace Tours", 350),
                ("Spa & Wellness Package", 300),
                ("Meals & Drinks", 350),
                ("Airport & Island Transfers", 200),
            ]
        case "custom-european-tour":
            return [
                ("Hotels (13 nights)", 2600),
                ("Rail Passes & Flights", 1200),
                ("Guided City Tours (6 cities)", 800),
                ("Museum & Attraction Passes", 500),
                ("Meals Plan", 700),
                ("Travel Insurance", 200),
            ]
        default:
            // Generic breakdown for any trip
            let accommodation = (basePrice * 0.40).rounded()
            let activities = (basePrice * 0.25).rounded()
            let meals = (basePrice * 0.20).rounded()
            let transport = basePrice - accommodation - activities - meals
            return [
                ("Accommodation", accommodation),
                ("Activities & Tours", activities),
                ("Meals", meals),
                ("Transport & Transfers", transport),
            ]
        }
    }

    var priceLabel: String {
        if let rate = dailyRate {
            return "\(rate.asCurrency)/day"
        }
        return basePrice.asCurrency
    }
}

extension TripCategory {
    var defaultGradientColors: [Color] {
        switch self {
        case .tour: [Color(hex: "#FFB7C5"), Color(hex: "#C71585")]
        case .carRental: [Color(hex: "#a08060"), Color(hex: "#c4a882")]
        case .cruise: [Color(hex: "#0077B6"), Color(hex: "#48CAE4")]
        }
    }

    var displayName: String {
        switch self {
        case .tour: "Tours"
        case .carRental: "Cars"
        case .cruise: "Cruises"
        }
    }
}
