import SwiftUI

extension Font {
    static let terraLargeTitle = Font.custom("Inter-Bold", size: 28, relativeTo: .largeTitle)
    static let terraTitle = Font.custom("Inter-SemiBold", size: 22, relativeTo: .title)
    static let terraHeadline = Font.custom("Inter-SemiBold", size: 16, relativeTo: .headline)
    static let terraBody = Font.system(.body)
    static let terraCaption = Font.system(.caption)
    static let terraFootnote = Font.system(.footnote)
}
