import Foundation

extension Double {
    var asCurrency: String {
        self.formatted(.currency(code: "USD").locale(Locale(identifier: "en_US")))
    }
}
