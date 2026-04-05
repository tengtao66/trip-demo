import Foundation
@testable import trip_ios

final class MockHTTPClient: HTTPDataProvider, @unchecked Sendable {
    let handler: @Sendable (URLRequest) -> (Data, HTTPURLResponse)
    private let _lock = NSLock()
    private var _lastRequest: URLRequest?

    var lastRequest: URLRequest? {
        _lock.withLock { _lastRequest }
    }

    init(handler: @escaping @Sendable (URLRequest) -> (Data, HTTPURLResponse) = { request in
        let response = HTTPURLResponse(url: request.url!, statusCode: 200, httpVersion: nil, headerFields: nil)!
        return ("{}".data(using: .utf8)!, response)
    }) {
        self.handler = handler
    }

    func data(for request: URLRequest) async throws -> (Data, URLResponse) {
        _lock.withLock { _lastRequest = request }
        let (data, response) = handler(request)
        return (data, response)
    }

    static func returning(json: String, statusCode: Int = 200) -> MockHTTPClient {
        MockHTTPClient { request in
            let response = HTTPURLResponse(url: request.url!, statusCode: statusCode, httpVersion: nil, headerFields: nil)!
            return (json.data(using: .utf8)!, response)
        }
    }

    static func returningError(statusCode: Int, message: String) -> MockHTTPClient {
        returning(json: "{\"error\": \"\(message)\"}", statusCode: statusCode)
    }
}
